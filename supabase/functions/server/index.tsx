import { Hono } from "npm:hono";
import { logger } from "npm:hono/logger";
import { cors } from "npm:hono/cors";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
// bcryptjs: 순수 JS 구현 — Web Worker 불필요 (Edge Function 호환)
import bcrypt from "npm:bcryptjs@2.4.3";

// 성남시 개발 톡톡 서버
// Project: bundang rebuild 360 (chmbbclexcwtgwkntzxw)

const ADMIN_API_TOKEN = Deno.env.get("ADMIN_API_TOKEN")!;
const PASSWORD_PEPPER = Deno.env.get("PASSWORD_PEPPER") || "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";

// ========================================
// KV Store Functions (inline)
// ========================================
const kvClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

const kvSet = async (key: string, value: unknown): Promise<void> => {
  const supabase = kvClient();
  const { error } = await supabase
    .from("kv_store_66444bd0")
    .upsert({ key, value });

  if (error) throw new Error(error.message);
};

const kvGet = async (key: string): Promise<any> => {
  const supabase = kvClient();
  const { data, error } = await supabase
    .from("kv_store_66444bd0")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.value;
};

const kvDel = async (key: string): Promise<void> => {
  const supabase = kvClient();
  const { error } = await supabase
    .from("kv_store_66444bd0")
    .delete()
    .eq("key", key);

  if (error) throw new Error(error.message);
};

const kvGetByPrefix = async (prefix: string): Promise<any[]> => {
  const supabase = kvClient();
  const { data, error } = await supabase
    .from("kv_store_66444bd0")
    .select("value")
    .like("key", `${prefix}%`);

  if (error) throw new Error(error.message);
  return (data || []).map((row: any) => row.value);
};

// ========================================
// 공통 유틸리티
// ========================================

async function sha256Hex(input: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ========================================
// Security: Admin Activity Log System
// ========================================

// 관리자 Bearer 토큰 추출
function getBearerToken(c: any) {
  const authHeader = c.req.header("Authorization") || "";

  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice(7).trim();
}

// 🔒 CSRF 토큰 생성
function generateCsrfToken(): string {
  return crypto.randomUUID();
}

// 🔒 CSRF 토큰 검증
async function verifyCsrfToken(c: any, adminSession: any): Promise<boolean> {
  const csrfToken = c.req.header("X-CSRF-Token");

  if (!csrfToken || !adminSession.csrfToken) {
    return false;
  }

  return csrfToken === adminSession.csrfToken;
}

// 관리자 인증 확인 (세션 타임아웃 포함)
async function requireAdminAuth(c: any, requireCsrf: boolean = false) {
  const token = getBearerToken(c);

  if (!token) {
    return {
      ok: false,
      response: c.json({ error: "Unauthorized" }, 401),
    };
  }

  // 관리자 세션 조회
  const adminSession = await kvGet(`admin_session:${token}`);

  if (!adminSession || !adminSession.adminId) {
    return {
      ok: false,
      response: c.json(
        { error: "Invalid or expired admin token" },
        401,
      ),
    };
  }

  // 🔒 CSRF 토큰 검증 (state-changing 요청에만 필요)
  if (requireCsrf) {
    const isValidCsrf = await verifyCsrfToken(c, adminSession);
    if (!isValidCsrf) {
      return {
        ok: false,
        response: c.json(
          { error: "Invalid CSRF token" },
          403,
        ),
      };
    }
  }

  // 🔒 세션 타임아웃 검증 (30분)
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30분
  const sessionCreatedAt = new Date(
    adminSession.createdAt,
  ).getTime();
  const now = Date.now();

  if (now - sessionCreatedAt > SESSION_TIMEOUT) {
    // 세션 만료 시 삭제
    await kvDel(`admin_session:${token}`);
    return {
      ok: false,
      response: c.json(
        { error: "Session expired. Please login again." },
        401,
      ),
    };
  }

  // 🔒 세션 갱신 (마지막 활동 시간 업데이트)
  await kvSet(`admin_session:${token}`, {
    ...adminSession,
    lastActivityAt: new Date().toISOString(),
  });

  return {
    ok: true,
    adminSession,
  };
}

const logAdminActivity = async (
  adminId: string,
  action: string,
  details: any,
  ipAddress?: string,
): Promise<void> => {
  try {
    const logId = `log:${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const logEntry = {
      id: logId,
      adminId,
      action,
      details,
      ipAddress: ipAddress || "unknown",
      timestamp: new Date().toISOString(),
    };
    await kvSet(logId, logEntry);
    console.log(
      `📝 Admin activity logged: ${action} by ${adminId}`,
    );
  } catch (error: any) {
    console.error("Failed to log admin activity:", error);
  }
};

// ========================================
// Security: Rate Limiting System
// ========================================
const rateLimitMap = new Map<
  string,
  { count: number; resetAt: number }
>();

const checkRateLimit = (
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000,
): boolean => {
  const now = Date.now();
  const limit = rateLimitMap.get(identifier);

  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  if (limit.count >= maxRequests) {
    console.warn(`⚠️ Rate limit exceeded for ${identifier}`);
    return false;
  }

  limit.count++;
  return true;
};

setInterval(() => {
  const now = Date.now();
  rateLimitMap.forEach((value, key) => {
    if (now > value.resetAt) {
      rateLimitMap.delete(key);
    }
  });
}, 600000);

// ========================================
// Security: Input Validation & Sanitization
// ========================================

// XSS 방지: HTML 태그 제거
const sanitizeHtml = (input: string): string => {
  if (typeof input !== "string") return "";
  return input
    .replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      "",
    )
    .replace(
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      "",
    )
    .replace(
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      "",
    )
    .replace(/<embed\b[^<]*>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/data:text\/html/gi, "")
    .trim();
};

// SQL Injection 방지: 특수문자 이스케이프 (Supabase는 자동으로 처리하지만 추가 검증)
const sanitizeSqlInput = (input: string): string => {
  if (typeof input !== "string") return "";
  return input.replace(/['";\\]/g, "").trim();
};

// 전화번호 검증
const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^01[0-9]-?\d{3,4}-?\d{4}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
};

const normalizePhoneNumber = (phone: string): string => {
  return String(phone || "").replace(/\D/g, "").trim();
};

const validateAdminPhoneNumber = (phone: string): boolean => {
  const normalized = normalizePhoneNumber(phone);
  return /^\d{9,11}$/.test(normalized);
};

// 텍스트 길이 검증
const validateTextLength = (
  text: string,
  maxLength: number,
): boolean => {
  return (
    typeof text === "string" &&
    text.trim().length > 0 &&
    text.length <= maxLength
  );
};

const validatePrivateQuestionPassword = (
  value: string,
): string => {
  if (!value) return "비밀번호를 입력해주세요.";
  if (!/^\d+$/.test(value)) {
    return "비밀번호는 숫자만 입력할 수 있습니다.";
  }
  if (value.length < 4) {
    return "비밀번호는 4자리 이상 입력해주세요.";
  }

  let consecutiveCount = 1;
  for (let i = 1; i < value.length; i++) {
    const prev = Number(value[i - 1]);
    const curr = Number(value[i]);

    if (curr === prev + 1) {
      consecutiveCount += 1;
      if (consecutiveCount >= 4) {
        return "연속된 숫자 4개 이상은 사용할 수 없습니다.";
      }
    } else {
      consecutiveCount = 1;
    }
  }

  const digitCount: Record<string, number> = {};
  for (const ch of value) {
    digitCount[ch] = (digitCount[ch] || 0) + 1;
    if (digitCount[ch] >= 3) {
      return "같은 숫자는 3개 이상 사용할 수 없습니다.";
    }
  }

  return "";
};

// 금지어 검증 (서버 측)
const BANNED_WORDS = [
  "씨발",
  "개새끼",
  "병신",
  "좆",
  "지랄",
  "미친",
  "닥쳐",
  "꺼져",
  "바보",
  "멍청이",
  "바보",
  "등신",
  "호로",
  "창녀",
  "년",
  "놈",
];

const containsBannedWords = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return BANNED_WORDS.some((word) => lowerText.includes(word));
};

// ========================================
// Security: Password Validation
// ========================================
const validatePassword = (
  password: string,
): { valid: boolean; message: string } => {
  if (password.length < 8) {
    return {
      valid: false,
      message: "비밀번호는 최소 8자 이상이어야 합니다.",
    };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar =
    /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  const validCount = [
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecialChar,
  ].filter(Boolean).length;

  if (validCount < 3) {
    return {
      valid: false,
      message:
        "비밀번호는 영문 대소문자, 숫자, 특수문자 중 3가지 이상을 포함해야 합니다.",
    };
  }

  return { valid: true, message: "유효한 비밀번호입니다." };
};

// ========================================
// Security: File Upload Validation
// ========================================
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const validateImageFile = (
  fileSize: number,
  fileType: string,
): { valid: boolean; message: string } => {
  if (fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      message: "파일 크기는 10MB를 초과할 수 없습니다.",
    };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(fileType)) {
    return {
      valid: false,
      message:
        "허용되지 않는 파일 형식입니다. (허용: JPEG, PNG, WebP, GIF)",
    };
  }

  return { valid: true, message: "유효한 이미지 파일입니다." };
};

// ========================================
// Hono Server
// ========================================
const app = new Hono({ strict: false });

// CORS 설정
app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: [
       "Content-Type",
       "Authorization",
       "apikey",
       "x-client-info",
       "X-User-ID",
       "X-CSRF-Token",
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

// Enable logger
app.use("*", logger(console.log));

// Security Headers & CORS Middleware
app.use("*", async (c, next) => {
  const path = new URL(c.req.url).pathname;
  console.log(`[REQUEST] ${c.req.method} ${path}`);

  if (c.req.method === "OPTIONS") {
    console.log(`[CORS] Responding to OPTIONS with 204`);
    return c.body(null, 204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods":
        "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":        
        "Content-Type, Authorization, apikey, x-client-info, X-CSRF-Token",
      "Access-Control-Max-Age": "600",
      // 보안 헤더 추가
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Strict-Transport-Security":
        "max-age=31536000; includeSubDomains",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    });
  }

  // CORS 헤더
  c.header("Access-Control-Allow-Origin", "*");
  c.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  c.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, apikey, x-client-info, X-CSRF-Token",
  );
  c.header("Access-Control-Max-Age", "600");

  // 🔒 보안 헤더 추가
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("X-XSS-Protection", "1; mode=block");
  c.header(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );
  c.header(
    "Referrer-Policy",
    "strict-origin-when-cross-origin",
  );
  c.header(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
  );
  c.header(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()",
  );

  await next();
});

// Category별 complexId 매핑
const CATEGORY_COMPLEX_MAP: Record<string, string[]> = {
  bundang: [
    "sibeom2",
    "saetbyeol",
    "mokyeon1",
    "yangji",
    "jangan4",
    "neuti3",
  ],
  "oldtown-redevelopment": [
    "dohwan-jung1",
    "dohwan-jung2",
    "sanseong",
    "sangdaewon2",
    "sujin1",
    "sinheung1",
    "taepyeong3",
    "sangdaewon3",
    "sinheung3",
  ],
  "oldtown-reconstruction": [
    "eunhaeng-jugong",
    "seongji-gungjeon",
    "samnam",
  ],
  garohousing: [
    "seongnam-dong-2801",
    "geumgwang-dong-3335",
    "geumgwang-dong-3289",
  ],
};

// Health check endpoint - No auth required
app.get("/make-server-66444bd0/health", (c) => {
  console.log("✅ Health check called");
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    server: "bundang-rebuild-360",
    version: "2.0.0",
  });
});

// ========================================
// Progress Management API
// ========================================

// GET /progress - 모든 단지의 진행율 조회
app.get("/make-server-66444bd0/progress", async (c) => {
  console.log("GET /progress called");

  try {
    // kv_store에서 progress: prefix로 모든 진행율 조회
    let progressList;
    try {
      progressList = await kvGetByPrefix("progress:");
    } catch (kvError: any) {
      console.error("Progress kvGetByPrefix error:", kvError);
      // DB 연결 오류 시 빈 배열 반환 (프론트엔드에서 기본값 사용)
      return c.json([]);
    }

    console.log("Progress data from KV store:", progressList);

    // 빈 배열이면 빈 배열 반환 (프론트엔드에서 기본값 사용)
    return c.json(progressList || []);
  } catch (error: any) {
    console.error("Progress fetch error:", error);
    // DB 오류 시에도 빈 배열 반환하여 프론트엔드가 기본값으로 동작하도록
    return c.json([]);
  }
});

// PUT /progress - 단일 단지 진행율 업데이트
app.put("/make-server-66444bd0/progress", async (c) => {
  console.log("PUT /progress called");

  try {
    const body = await c.req.json();
    const { complex_id, progress } = body;

    if (!complex_id || progress === undefined) {
      return c.json(
        { error: "complex_id and progress are required" },
        400,
      );
    }

    if (progress < 0 || progress > 100) {
      return c.json(
        { error: "progress must be between 0 and 100" },
        400,
      );
    }

    const progressData = {
      complex_id,
      progress,
      updated_at: new Date().toISOString(),
    };

    // kv_store에 저장
    const key = `progress:${complex_id}`;
    await kvSet(key, progressData);

    console.log("Progress updated:", progressData);
    return c.json({ success: true, data: progressData });
  } catch (error: any) {
    console.error("Progress update error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// PUT /progress/batch - 여러 단지 진행율 일괄 업데이트
app.put("/make-server-66444bd0/progress/batch", async (c) => {
  console.log("PUT /progress/batch called");

  try {
    const body = await c.req.json();
    const { updates } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return c.json(
        { error: "updates array is required" },
        400,
      );
    }

    // Validate all updates
    for (const update of updates) {
      if (!update.complex_id || update.progress === undefined) {
        return c.json(
          {
            error:
              "Each update must have complex_id and progress",
          },
          400,
        );
      }
      if (update.progress < 0 || update.progress > 100) {
        return c.json(
          { error: "progress must be between 0 and 100" },
          400,
        );
      }
    }

    // 모든 업데이트를 kv_store에 저장
    const savedData: any[] = [];
    const timestamp = new Date().toISOString();

    for (const update of updates) {
      const progressData = {
        complex_id: update.complex_id,
        progress: update.progress,
        updated_at: timestamp,
      };

      const key = `progress:${update.complex_id}`;
      await kvSet(key, progressData);
      savedData.push(progressData);
    }

    console.log("Progress batch updated:", savedData);
    return c.json({
      success: true,
      count: savedData.length,
      data: savedData,
    });
  } catch (error: any) {
    console.error("Progress batch update error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// PUT /progress/details - 단지 진행율 상세 정보 업데이트
app.put("/make-server-66444bd0/progress/details", async (c) => {
  console.log("PUT /progress/details called");

  try {
    const body = await c.req.json();
    const { complex_id, detailed_progress, timeline } = body;

    if (!complex_id) {
      return c.json({ error: "complex_id is required" }, 400);
    }

    const timestamp = new Date().toISOString();
    const detailsData = {
      complex_id,
      detailed_progress: detailed_progress || {},
      timeline: timeline || [],
      updated_at: timestamp,
    };

    // KV store에 저장
    const key = `progress_details:${complex_id}`;
    await kvSet(key, detailsData);

    console.log("Progress details updated:", detailsData);
    return c.json({ success: true, data: detailsData });
  } catch (error: any) {
    console.error("Progress details update error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// GET /progress/details/:complex_id - 단지 진행율 상세 정보 조회
app.get(
  "/make-server-66444bd0/progress/details/:complex_id",
  async (c) => {
    const complexId = c.req.param("complex_id");
    console.log(`GET /progress/details/${complexId} called`);

    try {
      const key = `progress_details:${complexId}`;
      const data = await kvGet(key);

      if (!data) {
        return c.json({
          complex_id: complexId,
          detailed_progress: null,
          timeline: null,
        });
      }

      return c.json(data);
    } catch (error: any) {
      console.error("Progress details fetch error:", error);
      return c.json({ error: error.message }, 500);
    }
  },
);

// ========================================
// Timeline Management API
// ========================================

// GET /timeline - 특정 단지의 추진 일정 조회
app.get("/make-server-66444bd0/timeline", async (c) => {
  console.log("GET /timeline called");

  try {
    const complex_id = c.req.query("complex_id");

    if (!complex_id) {
      return c.json(
        { error: "complex_id parameter is required" },
        400,
      );
    }

    // kv_store에서 timeline 조회
    const key = `timeline:${complex_id}`;
    let timelineData;

    try {
      timelineData = await kvGet(key);
    } catch (kvError: any) {
      console.error("Timeline kvGet error:", kvError);
      // DB 연결 오류 시 빈 응답 반환 (프론트엔드에서 기본값 사용)
      return c.json({
        complex_id,
        timeline: null,
        error: "Database temporarily unavailable",
      });
    }

    console.log("Timeline data from KV store:", timelineData);

    // 데이터가 없으면 빈 응답 (프론트엔드에서 기본값 사용)
    if (!timelineData) {
      return c.json({ complex_id, timeline: null });
    }

    return c.json(timelineData);
  } catch (error: any) {
    console.error("Timeline fetch error:", error);
    return c.json(
      { error: error.message || "Internal server error" },
      500,
    );
  }
});

// PUT /timeline - 특정 단지의 추진 일정 업데이트
app.put("/make-server-66444bd0/timeline", async (c) => {
  console.log("PUT /timeline called");

  try {
    const body = await c.req.json();
    const { complex_id, timeline } = body;

    if (!complex_id || !Array.isArray(timeline)) {
      return c.json(
        { error: "complex_id and timeline array are required" },
        400,
      );
    }

    // Validate timeline items
    for (const item of timeline) {
      if (!item.event || !item.date || !item.status) {
        return c.json(
          {
            error:
              "Each timeline item must have event, date, and status",
          },
          400,
        );
      }
      if (
        !["completed", "ongoing", "planned"].includes(
          item.status,
        )
      ) {
        return c.json(
          {
            error:
              "status must be 'completed', 'ongoing', or 'planned'",
          },
          400,
        );
      }
    }

    const timelineData = {
      complex_id,
      timeline,
      updated_at: new Date().toISOString(),
    };

    // kv_store에 저장
    const key = `timeline:${complex_id}`;
    await kvSet(key, timelineData);

    console.log("Timeline updated:", timelineData);
    return c.json({ success: true, data: timelineData });
  } catch (error: any) {
    console.error("Timeline update error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// ========================================
// Poll Management API
// ========================================

// GET /polls - category별 투표 조회
app.get("/make-server-66444bd0/polls", async (c) => {
  console.log("GET /polls called");

  try {
    const category = c.req.query("category") || "bundang";
    console.log("Fetching polls for category:", category);

    // kv_store에서 poll: prefix로 모든 투표 조회
    const allPolls = await kvGetByPrefix("poll:");
    console.log("All polls from KV store:", allPolls.length);

    // category로 직접 필터링
    const filteredPolls = allPolls.filter(
      (poll: any) => poll && poll.category === category,
    );

    console.log(
      `Filtered polls for ${category}:`,
      filteredPolls.length,
    );

    return c.json(filteredPolls);
  } catch (error: any) {
    console.error("Poll fetch error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// POST /polls - 새 투표 생성
app.post("/make-server-66444bd0/polls", async (c) => {
  console.log("POST /polls called");

  try {
    const body = await c.req.json();
    const { title, options, endDate, complexId, category } =
      body;

    if (
      !title ||
      !Array.isArray(options) ||
      !endDate ||
      !complexId ||
      !category
    ) {
      return c.json(
        {
          error:
            "title, options array, endDate, complexId, and category are required",
        },
        400,
      );
    }

    if (options.length < 2) {
      return c.json(
        { error: "At least 2 options are required" },
        400,
      );
    }

    const pollId = `poll_${Date.now()}`;
    const totalVotes = options.reduce(
      (sum, opt) => sum + opt.votes,
      0,
    );

    const pollData = {
      id: pollId,
      title,
      options,
      totalVotes,
      endDate,
      isActive: true,
      complexId,
      category,
      created_at: new Date().toISOString(),
    };

    // kv_store에 저장
    const key = `poll:${pollId}`;
    await kvSet(key, pollData);

    console.log("Poll created:", pollData);
    return c.json({ success: true, data: pollData });
  } catch (error: any) {
    console.error("Poll creation error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// PUT /polls/:id - 투표 수정
app.put("/make-server-66444bd0/polls/:id", async (c) => {
  console.log("PUT /polls/:id called");

  try {
    const pollId = c.req.param("id");
    const body = await c.req.json();
    const {
      title,
      options,
      endDate,
      isActive,
      complexId,
      category,
    } = body;

    if (
      !title ||
      !Array.isArray(options) ||
      !endDate ||
      !complexId ||
      !category
    ) {
      return c.json(
        {
          error:
            "title, options array, endDate, complexId, and category are required",
        },
        400,
      );
    }

    if (options.length < 2) {
      return c.json(
        { error: "At least 2 options are required" },
        400,
      );
    }

    const totalVotes = options.reduce(
      (sum, opt) => sum + opt.votes,
      0,
    );

    const pollData = {
      id: pollId,
      title,
      options,
      totalVotes,
      endDate,
      isActive: isActive !== undefined ? isActive : true,
      complexId,
      category,
      updated_at: new Date().toISOString(),
    };

    // kv_store에 저장
    const key = `poll:${pollId}`;
    await kvSet(key, pollData);

    console.log("Poll updated:", pollData);
    return c.json({ success: true, data: pollData });
  } catch (error: any) {
    console.error("Poll update error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// DELETE /polls/:id - 투표 삭제
app.delete("/make-server-66444bd0/polls/:id", async (c) => {
  console.log("DELETE /polls/:id called");

  try {
    const pollId = c.req.param("id");
    const key = `poll:${pollId}`;

    await kvDel(key);

    console.log("Poll deleted:", pollId);
    return c.json({ success: true, message: "Poll deleted" });
  } catch (error: any) {
    console.error("Poll deletion error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// POST /polls/:id/vote - 투표 참여 (재투표 지원)
app.post("/make-server-66444bd0/polls/:id/vote", async (c) => {
  console.log("POST /polls/:id/vote called");

  try {
    const pollId = c.req.param("id");
    const body = await c.req.json();
    const { optionIndex, previousVote } = body;

    if (optionIndex === undefined) {
      return c.json({ error: "optionIndex is required" }, 400);
    }

    // 투표 데이터 가져오기
    const key = `poll:${pollId}`;
    const pollData = await kvGet(key);

    if (!pollData) {
      return c.json({ error: "Poll not found" }, 404);
    }

    if (!pollData.isActive) {
      return c.json({ error: "Poll is closed" }, 400);
    }

    if (
      optionIndex < 0 ||
      optionIndex >= pollData.options.length
    ) {
      return c.json({ error: "Invalid option index" }, 400);
    }

    // 재투표인 경우 이전 투표 취소
    if (
      previousVote !== undefined &&
      previousVote >= 0 &&
      previousVote < pollData.options.length
    ) {
      console.log(
        "Re-voting: removing previous vote from option",
        previousVote,
      );
      pollData.options[previousVote].votes = Math.max(
        0,
        pollData.options[previousVote].votes - 1,
      );
      pollData.totalVotes = Math.max(
        0,
        pollData.totalVotes - 1,
      );
    }

    // 새로운 투표 추가
    pollData.options[optionIndex].votes += 1;
    pollData.totalVotes += 1;
    pollData.updated_at = new Date().toISOString();

    // 저장
    await kvSet(key, pollData);

    console.log("Vote recorded:", {
      pollId,
      optionIndex,
      previousVote,
      newVotes: pollData.options[optionIndex].votes,
      totalVotes: pollData.totalVotes,
    });
    return c.json({ success: true, data: pollData });
  } catch (error: any) {
    console.error("Vote recording error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// ========================================
// Contribution Management API
// ========================================

// GET /contribution - 모든 단지의 분담금 조회
app.get("/make-server-66444bd0/contribution", async (c) => {
  console.log("GET /contribution called");

  try {
    // kv_store에서 contribution: prefix로 모든 분담금 조회
    const contributionList =
      await kvGetByPrefix("contribution:");

    console.log(
      "Contribution data from KV store:",
      contributionList,
    );

    // 빈 배열이면 빈 배열 반환 (프론트엔드에서 기본값 사용)
    return c.json(contributionList || []);
  } catch (error: any) {
    console.error("Contribution fetch error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// POST /contribution - 단일 단지 분담금 업데이트
app.post("/make-server-66444bd0/contribution", async (c) => {
  console.log("POST /contribution called");

  try {
    const body = await c.req.json();
    const { complex_id, contribution } = body;

    if (!complex_id || !contribution) {
      return c.json(
        { error: "complex_id and contribution are required" },
        400,
      );
    }

    const contributionData = {
      complex_id,
      contribution,
      updated_at: new Date().toISOString(),
    };

    // kv_store에 저장
    const key = `contribution:${complex_id}`;
    await kvSet(key, contributionData);

    console.log("Contribution updated:", contributionData);
    return c.json({ success: true, data: contributionData });
  } catch (error: any) {
    console.error("Contribution update error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// AI Chatbot endpoint - OpenAI GPT-4o-mini
app.post("/make-server-66444bd0/chat", async (c) => {
  console.log("[CHAT] endpoint called");

  try {
    const body = await c.req.json();
    const { messages } = body;

    console.log("[CHAT] received messages:", messages);

    if (
      !messages ||
      !Array.isArray(messages) ||
      messages.length === 0
    ) {
      return c.json(
        { error: "Invalid request: messages array required" },
        400,
      );
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      console.error("[CHAT] OPENAI_API_KEY is missing");
      return c.json(
        {
          error: "AI service is not configured",
          message:
            "AI 상담 서비스 설정이 완료되지 않았습니다. 관리자에게 문의해주세요.",
        },
        500,
      );
    }

    console.log("[CHAT] OpenAI API key found");

    const systemPrompt = `
너는 성남시 시민 서비스 "성남시 개발 톡톡"의 AI 챗봇이다.

역할:
- 성남시의 재건축, 재개발, 가로주택정비사업, 도시정비사업, 조합설립, 추진절차, 인허가, 분담금, 이주, 보상, 학교, 학군, 특별정비구역 지정, 정비사업 현황, 관련 제도와 행정 안내에 대해 설명하는 전문 안내 챗봇이다.
- 사용자가 초보자라고 가정하고, 어려운 행정 용어는 쉬운 말로 풀어서 설명한다.
- 답변은 성남시 시민이 실제로 이해하고 다음 행동을 정할 수 있을 정도로 충분히 자세해야 한다.

기본 원칙:
1. 항상 한국어로 답변한다.
2. 절대 한두 문장으로 짧게 끝내지 않는다.
3. 사용자가 제도, 절차, 비용, 시기, 영향, 준비사항을 이해할 수 있도록 단계적으로 설명한다.
4. 질문이 모호해도 가능한 범위까지 먼저 설명하고, 어떤 정보가 더 있으면 더 정확히 답할 수 있는지 마지막에 알려준다.
5. 답변은 친절하지만 너무 딱딱하지 않게, 공무원 안내문보다 쉽게 풀어서 설명한다.
6. 사용자가 걱정할 가능성이 높은 분담금, 이주, 학군, 사업 지연, 재산권 영향, 교통 불편, 일정 지연 가능성은 필요 시 먼저 보완 설명한다.
7. 분담금, 일정, 입주시기 등 확인되지 않은 수치는 추측하여 단정하지 않는다.
8. 근거가 불확실한 내용은 단정하지 말고, 일반 기준 / 추정 가능 내용 / 확인 필요 사항을 구분해서 설명하고, 설명이 어려운 경우에는“현재 제공된 자료 기준으로는 확인되지 않는다”고 안내한다. 
9. 법률 확정 해석이나 최종 행정 판단이 필요한 사안은 반드시 “최종적으로는 관련 부서 공고문, 정비계획, 추진위원회·조합 안내, 성남시 담당 부서 확인이 필요하다”고 안내한다.
10. 불필요한 군더더기는 줄이고 실질 정보 위주로 답한다.
11. 답변 마지막에는 필요 시 “성남시 개발 톡톡 정비사업 현황을 함께 확인하시면 더 자세한 내용을 볼 수 있습니다.”를 덧붙인다.
12. 네이버카페나 다른 온라인 커뮤니티를 절대 인용하지 않는다.

질문 유형 분기:
- 사용자가 제도, 절차, 분담금, 이주, 학군, 보상, 추진절차 등 일반 설명을 물으면: 제도 설명 중심으로 답한다.
- 재건축사업인지, 재개발사업인지 혼동하지 말고 명확하게 답변해야하고 도시 및 주거환경정비법에 따른 정비예정구역, 정비구역인지 노후계획도시 정비 및 지원에 관한 특별법에 따른 특별정비예정구역, 특별정비구역인지 구분을 명확하게 답변한다
- 사용자가 특정 지역, 단지, 마을, 구역, 선도지구, 특별정비구역, 재개발구역, 재건축 단지명을 포함해서 물으면: 일반론보다 해당 지역/단지/구역의 정비사업 현황 정보를 우선 설명한다.
- 특히 아래와 같은 표현이 있으면 “정비사업 현황형 질문”으로 본다:
  - 분당 재건축
  - 선도지구
  - 샛별마을
  - 시범단지
  - 목련마을
  - 양지마을
  - 원도심 단지명
  - 원도심 구역명
  - 2차특별정비구역 지정
  - 특별정비구역
  - 재개발 단지 및 구역명
  - 재건축 단지 및 구역명
  - 가로주택정비사업 단지 및 구역명

정비사업 현황형 질문의 답변 규칙:
사용자 질문에 지역명, 단지명, 구역명, 마을명, 선도지구명 등이 포함되면 아래 항목을 가능한 범위에서 우선적으로 설명한다.


정비사업 현황형 답변 방식:
- 첫 문장에서 해당 단지/구역의 현재 상태를 한 문장으로 요약한다.
- 그 다음에는 아래 순서로 답한다.
  1) 어디 지역인지와 어떤 사업인지
  2) 현재 추진 상태와 진행 정도
  3) 가구 수, 층수, 용적률, 주차 등 물리적 계획 정보
  4) 분담금, 이주, 학군, 교통 등 시민 체감 정보
  5) 향후 일정과 확인 포인트
- 정보가 일부 없으면 항목을 생략하지 말고 “현재 공개 자료 기준으로는 확인 필요”라고 쓴다.
- 모르는 내용을 추측해서 단정하지 않는다.
- 사용자가 특정 단지명을 물었으면 일반 제도 설명보다 그 단지/구역 현황 설명을 먼저 한다.
- 사용자가 “분담금”, “학교”, “학군”, “이주비”, “언제 시작”, “언제 입주”, “진행률”처럼 세부 질문을 해도 해당 단지/구역 기준으로 연결해서 설명한다.

답변 형식:
- 보고서 형식으로 요약
- 그 다음 항목 또는 문단으로 자세한 설명
- 정비사업 현황형 질문일 때는 가능하면 아래 제목 구조를 우선 사용:
  - 사업 개요
  - 현재 추진 상태
  - 규모 및 계획 정보
  - 시민이 많이 궁금해하는 점
  - 향후 일정과 확인 사항
  - 필요하면 마지막에 “각 단지의 공식 홈페이지나 성남시 개발 톡톡 정비사업 현황을 함께 확인하시면 더욱 더 자세한 내용을 정확하게 확인할 수 있습니다.”를 덧붙인다.

답변 스타일 예시:
- 나쁜 예: "상황에 따라 다릅니다. 담당 부서에 문의하세요."
- 좋은 예: "시범단지 재건축의 분담금은 단순히 평형만으로 정해지지 않고, 종전자산평가액, 새 아파트 배정 면적, 추가 분양 여부, 사업비 규모에 따라 달라집니다. 그래서 먼저 보셔야 할 것은 현재 사업 단계와 권리가액 기준입니다."

금지 사항:
- 지나치게 짧은 단답형 답변 금지
- 확인되지 않은 수치 단정 금지
- 단지명 질문인데 일반론만 길게 설명하는 답변 금지
- 근거 없이 “곧 된다”, “확정됐다”, “문제없다” 같은 표현 금지
- 확인되지 않은 수치, 일정, 금액, 추진단계는 추측하여 생성하지 않는다
`.trim();

    console.log("[CHAT] calling OpenAI API...");

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          temperature: 0.7,
          max_tokens: 1200,
        }),
      },
    );

    console.log(
      "[CHAT] OpenAI response status:",
      response.status,
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("[CHAT] OpenAI API error:", data);

      if (response.status === 429) {
        return c.json(
          {
            error: "OpenAI quota exceeded",
            message:
              "AI 서비스 사용 한도를 초과했습니다. 관리자 결제 설정을 확인해주세요.",
          },
          429,
        );
      }

      return c.json(
        {
          error: "AI service error",
          message: "AI 응답 생성 중 오류가 발생했습니다.",
          details: data,
        },
        response.status,
      );
    }

    const assistantMessage =
      data?.choices?.[0]?.message?.content?.trim();

    if (!assistantMessage) {
      console.error("[CHAT] empty assistant message");
      return c.json(
        {
          error: "Empty AI response",
          message: "AI 응답이 비어 있습니다.",
        },
        500,
      );
    }

    console.log(
      "[CHAT] response received, length:",
      assistantMessage.length,
    );

    return c.json({
      message: assistantMessage,
      model: "gpt-4o-mini",
      timestamp: new Date().toISOString(),
      isMock: false,
    });
  } catch (error: any) {
    console.error("[CHAT] endpoint error:", error);
    return c.json(
      {
        error: "Internal server error",
        message: error?.message || "Unknown error",
      },
      500,
    );
  }
});

// ========================================
// School Info Management API
// ========================================

// GET /school-info - 특정 단지의 학군 정보 조회
app.get("/make-server-66444bd0/school-info", async (c) => {
  console.log("GET /school-info called");

  try {
    const complex_id = c.req.query("complex_id");

    if (!complex_id) {
      return c.json(
        { error: "complex_id parameter is required" },
        400,
      );
    }

    const key = `school_info_${complex_id}`;
    const schoolData = await kvGet(key);

    console.log("School data from KV store:", schoolData);

    if (!schoolData) {
      return c.json({ complex_id, schools: null });
    }

    return c.json({ complex_id, schools: schoolData });
  } catch (error: any) {
    console.error("School info fetch error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// PUT /school-info - 특정 단지의 학군 정보 업데이트
app.put("/make-server-66444bd0/school-info", async (c) => {
  console.log("PUT /school-info called");

  try {
    const body = await c.req.json();
    const { complex_id, schools } = body;

    if (!complex_id || !schools) {
      return c.json(
        { error: "complex_id and schools are required" },
        400,
      );
    }

    // schools는 객체 형태: { schools: [...], studentProjection: "..." }
    const key = `school_info_${complex_id}`;
    await kvSet(key, schools);

    console.log("School info updated:", {
      complex_id,
      schools,
    });
    return c.json({ success: true, complex_id, schools });
  } catch (error: any) {
    console.error("School info update error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// ========================================
// Transport Info Management API
// ========================================

// GET /transport-info - 특정 단지의 교통 정보 조회
app.get("/make-server-66444bd0/transport-info", async (c) => {
  console.log("GET /transport-info called");

  try {
    const complex_id = c.req.query("complex_id");

    if (!complex_id) {
      return c.json(
        { error: "complex_id parameter is required" },
        400,
      );
    }

    const key = `transport_info_${complex_id}`;
    const transportData = await kvGet(key);

    console.log("Transport data from KV store:", transportData);

    if (!transportData) {
      return c.json({ complex_id, transport_info: null });
    }

    return c.json({
      complex_id,
      transport_info: transportData,
    });
  } catch (error: any) {
    console.error("Transport info fetch error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// PUT /transport-info - 특정 단지의 교통 정보 업데이트
app.put("/make-server-66444bd0/transport-info", async (c) => {
  console.log("PUT /transport-info called");

  try {
    const body = await c.req.json();
    const { complex_id, transport_info, improvement_note } =
      body;

    if (!complex_id || !transport_info) {
      return c.json(
        { error: "complex_id and transport_info are required" },
        400,
      );
    }

    // 객체 형태로 저장 (info와 improvementNote 모두 포함)
    const transportData = {
      info: transport_info,
      improvementNote: improvement_note || "",
    };

    const key = `transport_info_${complex_id}`;
    await kvSet(key, transportData);

    console.log("Transport info updated:", { complex_id });
    return c.json({
      success: true,
      complex_id,
      transport_info: transportData,
    });
  } catch (error: any) {
    console.error("Transport info update error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// ========================================
// Notes Management API
// ========================================

// GET /notes - 특정 단지의 비고 정보 조회
app.get("/make-server-66444bd0/notes", async (c) => {
  console.log("GET /notes called");

  try {
    const complex_id = c.req.query("complex_id");

    if (!complex_id) {
      return c.json(
        { error: "complex_id parameter is required" },
        400,
      );
    }

    const key = `notes_${complex_id}`;
    const notesData = await kvGet(key);

    console.log("Notes data from KV store:", notesData);

    if (!notesData) {
      return c.json({ complex_id, notes: null });
    }

    return c.json({ complex_id, notes: notesData });
  } catch (error: any) {
    console.error("Notes fetch error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// PUT /notes - 특정 단지의 비고 정보 업데이트
app.put("/make-server-66444bd0/notes", async (c) => {
  console.log("PUT /notes called");

  try {
    const body = await c.req.json();
    const { complex_id, notes } = body;

    if (!complex_id || !notes) {
      return c.json(
        { error: "complex_id and notes are required" },
        400,
      );
    }

    const key = `notes_${complex_id}`;
    await kvSet(key, notes);

    console.log("Notes updated:", { complex_id });
    return c.json({ success: true, complex_id, notes });
  } catch (error: any) {
    console.error("Notes update error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// ========================================
// News Management API
// ========================================

// GET /news - 모든 뉴스 조회
app.get("/make-server-66444bd0/news", async (c) => {
  console.log("GET /news called");

  try {
    const newsList = await kvGetByPrefix("news:");
    console.log("News data from KV store:", newsList);

    return c.json({ news: newsList || [] });
  } catch (error: any) {
    console.error("News fetch error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// POST /news - 새 뉴스 추가
app.post("/make-server-66444bd0/news", async (c) => {
  console.log("POST /news called");

  try {
    const body = await c.req.json();
    const {
      date,
      category,
      title,
      summary,
      source,
      isImportant,
    } = body;

    if (!title || !summary || !source) {
      return c.json(
        { error: "title, summary, and source are required" },
        400,
      );
    }

    // 고유 ID 생성 (타임스탬프 + 랜덤)
    const newsId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newsData = {
      id: newsId,
      date:
        date ||
        new Date()
          .toISOString()
          .split("T")[0]
          .replace(/-/g, "."),
      category: category || "정책",
      title,
      summary,
      source,
      isImportant: isImportant || false,
      created_at: new Date().toISOString(),
    };

    const key = `news:${newsId}`;
    await kvSet(key, newsData);

    console.log("News created:", newsData);
    return c.json({ success: true, data: newsData });
  } catch (error: any) {
    console.error("News create error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// PUT /news/:id - 뉴스 수정
app.put("/make-server-66444bd0/news/:id", async (c) => {
  const newsId = c.req.param("id");
  console.log("PUT /news/:id called", newsId);

  try {
    const body = await c.req.json();
    const {
      date,
      category,
      title,
      summary,
      source,
      isImportant,
    } = body;

    if (!title || !summary || !source) {
      return c.json(
        { error: "title, summary, and source are required" },
        400,
      );
    }

    const newsData = {
      id: newsId,
      date:
        date ||
        new Date()
          .toISOString()
          .split("T")[0]
          .replace(/-/g, "."),
      category: category || "정책",
      title,
      summary,
      source,
      isImportant: isImportant || false,
      updated_at: new Date().toISOString(),
    };

    const key = `news:${newsId}`;
    await kvSet(key, newsData);

    console.log("News updated:", newsData);
    return c.json({ success: true, data: newsData });
  } catch (error: any) {
    console.error("News update error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// DELETE /news/:id - 뉴스 삭제
app.delete("/make-server-66444bd0/news/:id", async (c) => {
  const newsId = c.req.param("id");
  console.log("DELETE /news/:id called", newsId);

  try {
    const key = `news:${newsId}`;
    await kvDel(key);

    console.log("News deleted:", newsId);
    return c.json({ success: true, deleted_id: newsId });
  } catch (error: any) {
    console.error("News delete error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// ========================================
// Public Data API (공공데이터포털) Integration
// ========================================

// POST /news/fetch-opendata - 공공데이터포털에서 뉴스 자동 수집
app.post(
  "/make-server-66444bd0/news/fetch-opendata",
  async (c) => {
    console.log("POST /news/fetch-opendata called");

    try {
      const serviceKey = Deno.env.get("OPENDATA_SERVICE_KEY");

      if (!serviceKey) {
        return c.json(
          {
            error:
              "OPENDATA_SERVICE_KEY 환경 변수가 설정되지 않았습니다.",
            guide:
              "공공데이터포털에서 API 키를 발급받아 환경 변수에 등록해주세요.",
          },
          400,
        );
      }

      const collectedNews: any[] = [];

      // 1. 국토교통부 보도자료 RSS 수집
      try {
        console.log("Fetching MOLIT RSS...");
        const molitResponse = await fetch(
          "https://www.molit.go.kr/portal/service/rss/getRssList?brdctsNo=1",
        );

        if (molitResponse.ok) {
          const xmlText = await molitResponse.text();

          // 간단한 XML 파싱 (정규식 사용)
          const titleRegex =
            /<title><!\[CDATA\[(.*?)\]\]><\/title>/g;
          const descRegex =
            /<description><!\[CDATA\[(.*?)\]\]><\/description>/g;
          const dateRegex = /<pubDate>(.*?)<\/pubDate>/g;

          const titles: string[] = [];
          const descriptions: string[] = [];
          const dates: string[] = [];

          let match;
          while ((match = titleRegex.exec(xmlText)) !== null) {
            titles.push(match[1]);
          }
          while ((match = descRegex.exec(xmlText)) !== null) {
            descriptions.push(match[1]);
          }
          while ((match = dateRegex.exec(xmlText)) !== null) {
            dates.push(match[1]);
          }

          // 첫 번째는 채널 제목이므로 스킵
          for (let i = 1; i < Math.min(titles.length, 6); i++) {
            if (titles[i] && descriptions[i]) {
              // 성남시 또는 재건축 관련 뉴스만 필터링
              const content = titles[i] + descriptions[i];
              if (
                content.includes("성남") ||
                content.includes("재건축") ||
                content.includes("분당") ||
                content.includes("주택") ||
                content.includes("아파트")
              ) {
                // 날짜 형식 변환 (RFC 822 -> YYYY.MM.DD)
                let formattedDate = new Date()
                  .toISOString()
                  .split("T")[0]
                  .replace(/-/g, ".");
                if (dates[i]) {
                  try {
                    const dateObj = new Date(dates[i]);
                    formattedDate = dateObj
                      .toISOString()
                      .split("T")[0]
                      .replace(/-/g, ".");
                  } catch (e) {
                    console.error("Date parsing error:", e);
                  }
                }

                collectedNews.push({
                  date: formattedDate,
                  category: "정책",
                  title: titles[i].substring(0, 100), // 제목 길이 제한
                  summary:
                    descriptions[i].substring(0, 200) + "...", // 요약 길이 제한
                  source: "국토교통부",
                  isImportant: false,
                });
              }
            }
          }

          console.log(
            `MOLIT RSS: ${collectedNews.length}개 뉴스 수집`,
          );
        }
      } catch (error: any) {
        console.error("MOLIT RSS fetch error:", error);
      }

      // 수집된 뉴스를 DB에 저장
      const savedNews: any[] = [];
      for (const newsItem of collectedNews) {
        const newsId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newsData = {
          id: newsId,
          ...newsItem,
          created_at: new Date().toISOString(),
        };

        const key = `news:${newsId}`;
        await kvSet(key, newsData);
        savedNews.push(newsData);

        // 저장 간격 (Rate limit 방지)
        await new Promise((resolve) =>
          setTimeout(resolve, 100),
        );
      }

      console.log(
        `✅ 총 ${savedNews.length}개의 뉴스를 저장했습니다.`,
      );

      return c.json({
        success: true,
        collected: savedNews.length,
        news: savedNews,
        message: `${savedNews.length}개의 뉴스를 자동으로 수집하여 저장했습니다.`,
      });
    } catch (error: any) {
      console.error("OpenData fetch error:", error);
      return c.json({ error: error.message }, 500);
    }
  },
);

// ========================================
// Community Messages API
// ========================================

// GET /messages - 메시지 조회 (category 또는 complexId로 필터링)
app.get("/make-server-66444bd0/messages", async (c) => {
  console.log("GET /messages called");

  try {
    const complexId = c.req.query("complexId");
    const category = c.req.query("category");

    // kv_store에서 메시지 조회
    const prefix = complexId
      ? `message:${complexId}:`
      : "message:";
    let messages = await kvGetByPrefix(prefix);

    console.log(
      `Found ${messages.length} messages${complexId ? ` for complex ${complexId}` : ""}${category ? ` (filtering by category ${category})` : ""}`,
    );

    // category 필터링 (complexId가 없고 category가 있는 경우)
    if (
      category &&
      !complexId &&
      CATEGORY_COMPLEX_MAP[category]
    ) {
      const categoryComplexIds = CATEGORY_COMPLEX_MAP[category];
      messages = messages.filter((m: any) =>
        categoryComplexIds.includes(m.complexId),
      );
      console.log(
        `Filtered to ${messages.length} messages for category ${category}`,
      );
    }

    // 시간 순으로 정렬 (최신순)
    messages.sort((a, b) => {
      const timeA = new Date(a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || 0).getTime();
      return timeB - timeA;
    });

    return c.json({ messages });
  } catch (error: any) {
    console.error("Messages fetch error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// POST /messages - 새 메시지 생성
app.post("/make-server-66444bd0/messages", async (c) => {
  console.log("POST /messages called");

  try {
    const body = await c.req.json();
    const { complexId, author, content, category } = body;

    if (!complexId || !author || !content) {
      return c.json(
        {
          error: "complexId, author, and content are required",
        },
        400,
      );
    }

    // 🔒 Rate Limiting: 메시지 생성 제한 (1분에 5개)
    const userIdentifier = `message:${author}:${complexId}`;
    if (!checkRateLimit(userIdentifier, 5, 60000)) {
      return c.json(
        {
          error:
            "너무 많은 메시지를 작성하고 있습니다. 잠시 후 다시 시도해주세요.",
        },
        429,
      );
    }

    // 🔒 입력 검증
    if (!validateTextLength(content, 1000)) {
      return c.json(
        { error: "메시지 내용은 1~1000자 이내여야 합니다." },
        400,
      );
    }

    // 🔒 XSS 방지: HTML 태그 제거
    const sanitizedContent = sanitizeHtml(content);
    const sanitizedAuthor = sanitizeHtml(author);

    // 🔒 금지어 검증
    if (containsBannedWords(sanitizedContent)) {
      return c.json(
        { error: "부적절한 단어가 포함되어 있습니다." },
        400,
      );
    }

    const messageId = Date.now();
    const now = new Date();
    const timeString = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const messageData = {
      id: messageId,
      author: sanitizedAuthor,
      time: timeString,
      content: sanitizedContent,
      complexId,
      category: category || "",
      replies: [],
      created_at: now.toISOString(),
    };

    // kv_store에 저장
    const key = `message:${complexId}:${messageId}`;
    await kvSet(key, messageData);

    console.log("✅ Message created:", {
      id: messageId,
      complexId,
      author: sanitizedAuthor.substring(0, 3) + "**",
    });
    return c.json({ success: true, data: messageData });
  } catch (error: any) {
    console.error("Message creation error:", error);
    return c.json(
      { error: "메시지 생성 중 오류가 발생했습니다." },
      500,
    );
  }
});

// POST /messages/:messageId/replies - 메시지에 댓글 추가
app.post(
  "/make-server-66444bd0/messages/:messageId/replies",
  async (c) => {
    console.log("POST /messages/:messageId/replies called");

    try {
      const messageId = c.req.param("messageId");
      const body = await c.req.json();
      const { complexId, author, content } = body;

      if (!complexId || !author || !content) {
        return c.json(
          {
            error:
              "complexId, author, and content are required",
          },
          400,
        );
      }

      // 🔒 Rate Limiting: 댓글 생성 제한 (1분에 10개)
      const userIdentifier = `reply:${author}:${complexId}`;
      if (!checkRateLimit(userIdentifier, 10, 60000)) {
        return c.json(
          {
            error:
              "너무 많은 댓글을 작성하고 있습니다. 잠시 후 다시 시도해주세요.",
          },
          429,
        );
      }

      // 🔒 입력 검증
      if (!validateTextLength(content, 500)) {
        return c.json(
          { error: "댓글 내용은 1~500자 이내여야 합니다." },
          400,
        );
      }

      // 🔒 XSS 방지: HTML 태그 제거
      const sanitizedContent = sanitizeHtml(content);
      const sanitizedAuthor = sanitizeHtml(author);

      // 🔒 금지어 검증
      if (containsBannedWords(sanitizedContent)) {
        return c.json(
          { error: "부적절한 단어가 포함되어 있습니다." },
          400,
        );
      }

      // 메시지 가져오기
      const key = `message:${complexId}:${messageId}`;
      const messageData = await kvGet(key);

      if (!messageData) {
        return c.json({ error: "Message not found" }, 404);
      }

      const now = new Date();
      const timeString = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      const replyData = {
        id: Date.now(),
        author: sanitizedAuthor,
        time: timeString,
        content: sanitizedContent,
        created_at: now.toISOString(),
      };

      // 댓글 추가
      messageData.replies = messageData.replies || [];
      messageData.replies.push(replyData);
      messageData.updated_at = now.toISOString();

      // 저장
      await kvSet(key, messageData);

      console.log("✅ Reply added:", {
        id: replyData.id,
        messageId,
        author: sanitizedAuthor.substring(0, 3) + "**",
      });
      return c.json({ success: true, data: messageData });
    } catch (error: any) {
      console.error("Reply creation error:", error);
      return c.json(
        { error: "댓글 생성 중 오류가 발생했습니다." },
        500,
      );
    }
  },
);

// DELETE /messages/:complexId/:messageId - 메시지 삭제 (내용만 교체)
app.delete(
  "/make-server-66444bd0/messages/:complexId/:messageId",
  async (c) => {
    console.log(
      "DELETE /messages/:complexId/:messageId called",
    );

    try {
      const complexId = c.req.param("complexId");
      const messageId = c.req.param("messageId");
      const body = await c.req.json();
      const reason = body?.reason || "사유 없음";

      const key = `message:${complexId}:${messageId}`;
      const deletedKey = `deleted_message:${complexId}:${messageId}`;

      // 삭제 전 메시지 내용 조회
      const message = await kvGet(key);

      if (message) {
        // 삭제된 메시지 데이터 저장 (백업)
        const deletedMessage = {
          ...message,
          deleteReason: reason,
          deletedAt: new Date().toISOString(),
        };

        await kvSet(deletedKey, deletedMessage);

        // 삭제 로그 기록
        console.log("메시지 삭제 로그:", {
          complexId,
          messageId,
          author: message?.author || "알 수 없음",
          content:
            message?.content?.substring(0, 50) || "알 수 없음",
          reason,
          deletedAt: deletedMessage.deletedAt,
        });

        // 메시지 내용을 클린봇 메시지로 교체 (삭제하지 않음)
        const censoredMessage = {
          ...message,
          content:
            "클린봇이 부적절한 문구를 감지하여 삭제 되었습니다.",
          censored: true,
          censoredAt: new Date().toISOString(),
          censorReason: reason,
        };

        await kvSet(key, censoredMessage);
      }

      console.log("Message censored:", key);
      return c.json({
        success: true,
        message: "Message censored",
      });
    } catch (error: any) {
      console.error("Message deletion error:", error);
      return c.json({ error: error.message }, 500);
    }
  },
);

// ========================================
// Community Q&A API
// ========================================

// GET /questions - 모든 질문 조회 (카테고리 필터링 지원)
app.get("/make-server-66444bd0/questions", async (c) => {
  console.log("GET /questions called");

  try {
    // 카테고리 쿼리 파라미터 확인
    const categoryFilter = c.req.query("category");

    // 관리자 여부 확인
    let isAdmin = false;
    const authHeader = c.req.header("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const adminSession = await kvGet(`admin_session:${token}`);
        if (adminSession?.adminId) isAdmin = true;
      } catch (_) { /* 일반 사용자 */ }
    }

    let questions = await kvGetByPrefix("question:");

    if (categoryFilter) {
      questions = questions.filter((q: any) => q.category === categoryFilter);
    }

    const reqUserId = c.req.header("X-User-ID");
    
    // 비공개 질문: 목록에는 포함하되 content 숨김 (title·author만 표시)
    // private_password 해시는 절대 클라이언트에 반환하지 않음
    questions = questions.map((q: any) => {
      const { private_password_hash, ...safeQ } = q;
      
      // 관리자이거나 작성자 본인이면 내용 표시
      const isAuthor = reqUserId && q.author_id === reqUserId;
      if (q.is_private && !isAdmin && !isAuthor) {
        return {
          ...safeQ,
          content: "",         // 내용 숨김
          answers: [],         // 답변 숨김
          _contentHidden: true,
        };
      }
      return safeQ;
    });

    questions.sort((a: any, b: any) => {
      const timeA = new Date(a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || 0).getTime();
      return timeB - timeA;
    });

    return c.json({ questions });
  } catch (error: any) {
    console.error("Questions fetch error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// POST /questions - 새 질문 생성
app.post("/make-server-66444bd0/questions", async (c) => {
  console.log("POST /questions called");

  try {
    const body = await c.req.json();
    const { author, title, content, category, is_private, author_id, private_password } = body;

    if (!author || !title || !content || !category) {
      return c.json({ error: "author, title, content, and category are required" }, 400);
    }
    if (is_private && (!private_password || !private_password.trim())) {
  return c.json({ error: "비공개 문의는 비밀번호가 필요합니다." }, 400);
}

if (is_private) {
  const privatePasswordError = validatePrivateQuestionPassword(
    String(private_password || "").trim(),
  );

  if (privatePasswordError) {
    return c.json({ error: privatePasswordError }, 400);
  }
}

    // 🔒 Rate Limiting: 질문 생성 제한 (1분에 3개)
    const userIdentifier = `question:${author}:${category}`;
    if (!checkRateLimit(userIdentifier, 3, 60000)) {
      return c.json(
        {
          error:
            "너무 많은 질문을 작성하고 있습니다. 잠시 후 다시 시도해주세요.",
        },
        429,
      );
    }

    // 🔒 입력 검증
    if (!validateTextLength(title, 200)) {
      return c.json(
        { error: "질문 제목은 1~200자 이내여야 합니다." },
        400,
      );
    }
    if (!validateTextLength(content, 2000)) {
      return c.json(
        { error: "질문 내용은 1~2000자 이내여야 합니다." },
        400,
      );
    }

    // 🔒 XSS 방지: HTML 태그 제거
    const sanitizedTitle = sanitizeHtml(title);
    const sanitizedContent = sanitizeHtml(content);
    const sanitizedAuthor = sanitizeHtml(author);

    // 🔒 금지어 검증
    if (
      containsBannedWords(sanitizedTitle) ||
      containsBannedWords(sanitizedContent)
    ) {
      return c.json(
        { error: "부적절한 단어가 포함되어 있습니다." },
        400,
      );
    }

    const questionId = Date.now();
    const now = new Date();
    const dateString = now
      .toISOString()
      .split("T")[0]
      .replace(/-/g, ".");

    // 비공개 비밀번호 해시 (SHA-256 + pepper)
    let private_password_hash: string | null = null;
    if (is_private && private_password) {
  const safePrivatePassword = String(private_password).trim();
  const pepper = PASSWORD_PEPPER;
  const encoded = new TextEncoder().encode(
    safePrivatePassword + pepper,
  );
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  private_password_hash = Array.from(
    new Uint8Array(hashBuffer),
  )
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

    const questionData: any = {
      id: questionId,
      author: sanitizedAuthor,
      title: sanitizedTitle,
      content: sanitizedContent,
      category,
      date: dateString,
      status: "pending",
      answers: [],
      created_at: now.toISOString(),
      is_private: is_private || false,
      author_id: author_id || 'anonymous',
    };
    if (private_password_hash) {
      questionData.private_password_hash = private_password_hash;
    }

    // kv_store에 저장
    const key = `question:${questionId}`;
    await kvSet(key, questionData);

    console.log("✅ Question created:", {
      id: questionId,
      category,
      author: sanitizedAuthor.substring(0, 3) + "**",
    });
    return c.json({ success: true, data: questionData });
  } catch (error: any) {
    console.error("Question creation error:", error);
    return c.json(
      { error: "질문 생성 중 오류가 발생했습니다." },
      500,
    );
  }
});

// POST /questions/:questionId/answers - 질문에 답변 추가
app.post(
  "/make-server-66444bd0/questions/:questionId/answers",
  async (c) => {
    console.log("POST /questions/:questionId/answers called");

    try {
      const questionId = c.req.param("questionId");
      const body = await c.req.json();
      const { author, content } = body;

      if (!author || !content) {
        return c.json(
          { error: "author and content are required" },
          400,
        );
      }

      // 🔒 Rate Limiting: 답변 생성 제한 (1분에 10개)
      const userIdentifier = `answer:${author}:${questionId}`;
      if (!checkRateLimit(userIdentifier, 10, 60000)) {
        return c.json(
          {
            error:
              "너무 많은 답변을 작성하고 있습니다. 잠시 후 다시 시도해주세요.",
          },
          429,
        );
      }

      // 🔒 입력 검증
      if (!validateTextLength(content, 2000)) {
        return c.json(
          { error: "답변 내용은 1~2000자 이내여야 합니다." },
          400,
        );
      }

      // 🔒 XSS 방지: HTML 태그 제거
      const sanitizedContent = sanitizeHtml(content);
      const sanitizedAuthor = sanitizeHtml(author);

      // 🔒 금지어 검증
      if (containsBannedWords(sanitizedContent)) {
        return c.json(
          { error: "부적절한 단어가 포함되어 있습니다." },
          400,
        );
      }

      // 질문 가져오기
      const key = `question:${questionId}`;
      const questionData = await kvGet(key);

      if (!questionData) {
        return c.json({ error: "Question not found" }, 404);
      }

      const now = new Date();
      const dateString = now
        .toISOString()
        .split("T")[0]
        .replace(/-/g, ".");

      const answerData = {
        id: Date.now(),
        author: sanitizedAuthor,
        content: sanitizedContent,
        date: dateString,
        created_at: now.toISOString(),
        isExpert:
          author.includes("전문가") ||
          author.includes("관리자"),
      };

      // 답변 추가
      questionData.answers = questionData.answers || [];
      questionData.answers.push(answerData);
      questionData.status = "answered";
      questionData.updated_at = now.toISOString();

      // 저장
      await kvSet(key, questionData);

      console.log("✅ Answer added:", {
        id: answerData.id,
        questionId,
        author: sanitizedAuthor.substring(0, 3) + "**",
      });
      return c.json({ success: true, data: questionData });
    } catch (error: any) {
      console.error("Answer creation error:", error);
      return c.json(
        { error: "답변 생성 중 오류가 발생했습니다." },
        500,
      );
    }
  },
);

// POST /questions/:questionId/verify-password - 비공개 질문 비밀번호 검증
app.post(
  "/make-server-66444bd0/questions/:questionId/verify-password",
  async (c) => {
    try {
      const questionId = c.req.param("questionId");
      const { password } = await c.req.json();

      if (!password) {
        return c.json({ error: "비밀번호를 입력해주세요." }, 400);
      }

      const question = await kvGet(`question:${questionId}`);
      if (!question) {
        return c.json({ error: "질문을 찾을 수 없습니다." }, 404);
      }

      if (!question.is_private || !question.private_password_hash) {
        return c.json({ error: "비공개 설정이 없는 문의입니다." }, 400);
      }

      // 입력된 비밀번호 해시
      const pepper = PASSWORD_PEPPER;
      const encoded = new TextEncoder().encode(password + pepper);
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
      const inputHash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0")).join("");

      if (inputHash !== question.private_password_hash) {
        return c.json({ code: "PASSWORD_MISMATCH", error: "비밀번호가 일치하지 않습니다." }, 401);
      }

      // 검증 성공: 전체 내용 반환 (비밀번호 해시 제외)
      const { private_password_hash, ...safeQuestion } = question;
      return c.json({ success: true, question: safeQuestion });
    } catch (error: any) {
      console.error("Password verify error:", error);
      return c.json({ error: "비밀번호 확인 중 오류가 발생했습니다." }, 500);
    }
  }
);

// DELETE /questions/:questionId - 질문 삭제 (내용만 교체)
app.delete(
  "/make-server-66444bd0/questions/:questionId",
  async (c) => {
    console.log("DELETE /questions/:questionId called");

    try {
      const questionId = c.req.param("questionId");
      const body = await c.req.json();
      const reason = body?.reason || "사유 없음";

      const key = `question:${questionId}`;
      const deletedKey = `deleted_question:${questionId}`;

      // 삭제 전 질문 내용 조회
      const question = await kvGet(key);

      if (question) {
        // 삭제된 질문 데이터 저장 (백업)
        const deletedQuestion = {
          ...question,
          deleteReason: reason,
          deletedAt: new Date().toISOString(),
        };

        await kvSet(deletedKey, deletedQuestion);

        // 삭제 로그 기록
        console.log("질문 삭제 로그:", {
          questionId,
          title: question?.title || "알 수 없음",
          author: question?.author || "알 수 없음",
          reason,
          deletedAt: deletedQuestion.deletedAt,
        });

        // 질문 내용을 클린봇 메시지로 교체 (삭제하지 않음)
        const censoredQuestion = {
          ...question,
          title:
            "클린봇이 부적절한 문구를 감지하여 삭제 되었습니다.",
          content:
            "클린봇이 부적절한 문구를 감지하여 삭제 되었습니다.",
          censored: true,
          censoredAt: new Date().toISOString(),
          censorReason: reason,
        };

        await kvSet(key, censoredQuestion);
      }

      console.log("Question censored:", key);
      return c.json({
        success: true,
        message: "Question censored",
      });
    } catch (error: any) {
      console.error("Question deletion error:", error);
      return c.json({ error: error.message }, 500);
    }
  },
);

// GET /deleted-questions - 삭제된 질문 조회 (카테고리 필터링 지원)
app.get(
  "/make-server-66444bd0/deleted-questions",
  async (c) => {
    console.log("GET /deleted-questions called");

    try {
      // 카테고리 쿼리 파라미터 확인
      const categoryFilter = c.req.query("category");
      console.log(
        "Category filter for deleted questions:",
        categoryFilter,
      );

      let deletedQuestions = await kvGetByPrefix(
        "deleted_question:",
      );

      // 카테고리 필터링 (쿼리 파라미터가 있으면)
      if (categoryFilter) {
        deletedQuestions = deletedQuestions.filter(
          (q: any) => q.category === categoryFilter,
        );
        console.log(
          `Filtered to ${deletedQuestions.length} deleted questions for category: ${categoryFilter}`,
        );
      }

      console.log(
        "Deleted questions loaded:",
        deletedQuestions.length,
      );
      return c.json({
        success: true,
        deletedQuestions: deletedQuestions.sort(
          (a: any, b: any) => {
            return (
              new Date(b.deletedAt).getTime() -
              new Date(a.deletedAt).getTime()
            );
          },
        ),
      });
    } catch (error: any) {
      console.error("Deleted questions load error:", error);
      return c.json({ error: error.message }, 500);
    }
  },
);

// GET /deleted-messages - 삭제된 메시지 조회 (카테고리 필터링 지원)
app.get("/make-server-66444bd0/deleted-messages", async (c) => {
  console.log("GET /deleted-messages called");

  try {
    // 카테고리 쿼리 파라미터 확인
    const categoryFilter = c.req.query("category");
    console.log(
      "Category filter for deleted messages:",
      categoryFilter,
    );

    let deletedMessages = await kvGetByPrefix(
      "deleted_message:",
    );

    // 카테고리 필터링 (쿼리 파라미터가 있으면)
    if (
      categoryFilter &&
      CATEGORY_COMPLEX_MAP[categoryFilter]
    ) {
      const categoryComplexIds =
        CATEGORY_COMPLEX_MAP[categoryFilter];
      deletedMessages = deletedMessages.filter((m: any) =>
        categoryComplexIds.includes(m.complexId),
      );
      console.log(
        `Filtered to ${deletedMessages.length} deleted messages for category: ${categoryFilter}`,
      );
    }

    console.log(
      "Deleted messages loaded:",
      deletedMessages.length,
    );
    return c.json({
      success: true,
      deletedMessages: deletedMessages.sort(
        (a: any, b: any) => {
          return (
            new Date(b.deletedAt).getTime() -
            new Date(a.deletedAt).getTime()
          );
        },
      ),
    });
  } catch (error: any) {
    console.error("Deleted messages load error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// DELETE /questions/:questionId/answers/:answerId - 답변 삭제 (내용만 교체)
app.delete(
  "/make-server-66444bd0/questions/:questionId/answers/:answerId",
  async (c) => {
    console.log(
      "DELETE /questions/:questionId/answers/:answerId called",
    );

    try {
      const questionId = c.req.param("questionId");
      const answerId = c.req.param("answerId");

      const key = `question:${questionId}`;
      const questionData = await kvGet(key);

      if (!questionData) {
        return c.json({ error: "Question not found" }, 404);
      }

      // 답변 내용을 클린봇 메시지로 교체
      questionData.answers = (questionData.answers || []).map(
        (answer: any) => {
          if (answer.id === Number(answerId)) {
            return {
              ...answer,
              content:
                "클린봇이 부적절한 문구를 감지하여 삭제 되었습니다.",
              censored: true,
              censoredAt: new Date().toISOString(),
            };
          }
          return answer;
        },
      );

      await kvSet(key, questionData);

      console.log(
        "Answer censored:",
        answerId,
        "from question:",
        questionId,
      );
      return c.json({
        success: true,
        message: "Answer censored",
      });
    } catch (error: any) {
      console.error("Answer deletion error:", error);
      return c.json({ error: error.message }, 500);
    }
  },
);

// DELETE /messages/:complexId/:messageId/replies/:replyId - 댓글 삭제
app.delete(
  "/make-server-66444bd0/messages/:complexId/:messageId/replies/:replyId",
  async (c) => {
    console.log(
      "DELETE /messages/:complexId/:messageId/replies/:replyId called",
    );

    try {
      const complexId = c.req.param("complexId");
      const messageId = c.req.param("messageId");
      const replyId = c.req.param("replyId");

      const key = `message:${complexId}:${messageId}`;
      const messageData = await kvGet(key);

      if (!messageData) {
        return c.json({ error: "Message not found" }, 404);
      }

      // 댓글 내용 검열 처리
      messageData.replies = (messageData.replies || []).map(
        (reply: any) => {
          if (reply.id === Number(replyId)) {
            return {
              ...reply,
              content:
                "클린봇이 부적절한 문구를 감지하여 삭제 되었습니다.",
              censored: true,
              censoredAt: new Date().toISOString(),
            };
          }
          return reply;
        },
      );

      await kvSet(key, messageData);

      console.log(
        "Reply censored:",
        replyId,
        "from message:",
        messageId,
      );
      return c.json({
        success: true,
        message: "Reply censored",
      });
    } catch (error: any) {
      console.error("Reply deletion error:", error);
      return c.json({ error: error.message }, 500);
    }
  },
);

// ========================================
// Image Storage API
// ========================================

// 버킷 초기화 함수
const initializeImageBucket = async () => {
  try {
    const supabase = kvClient();
    const bucketName = "make-66444bd0-images";

    // 버킷 목록 조회
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) {
      console.log(
        "⚠️ 버킷 목록 조회 실패 (무시):",
        listError.message,
      );
      return;
    }

    const bucketExists = buckets?.some(
      (bucket) => bucket.name === bucketName,
    );

    if (!bucketExists) {
      // 버킷 생성 (private)
      const { error } = await supabase.storage.createBucket(
        bucketName,
        {
          public: false,
          fileSizeLimit: 5242880, // 5MB
        },
      );

      if (error) {
        // 이미 존재하는 경우 에러 무시
        if (
          error.message?.includes("already exists") ||
          error.message?.includes("resource already exists")
        ) {
          console.log(
            `✅ Storage 버킷 이미 존재: ${bucketName}`,
          );
        } else {
          console.log(
            `⚠️ 버킷 생성 실패 (무시): ${error.message}`,
          );
        }
      } else {
        console.log(`✅ Storage 버킷 생성됨: ${bucketName}`);
      }
    } else {
      console.log(`✅ Storage 버킷 이미 존재: ${bucketName}`);
    }
  } catch (error: any) {
    // 모든 에러를 조용히 처리 (서버 시작을 방해하지 않음)
    console.log(
      `⚠️ 버킷 초기화 스킵: ${error?.message || "Unknown error"}`,
    );
  }
};

// 서버 시작 시 버킷 초기화 (백그라운드, 에러 무시)
initializeImageBucket().catch(() => {});

// POST /images/upload - 이미지 업로드
app.post("/make-server-66444bd0/images/upload", async (c) => {
  console.log("POST /images/upload called");

  // 🔒 관리자 인증 및 CSRF 토큰 검증
  const authResult = await requireAdminAuth(c, true);
  if (!authResult.ok) {
    return authResult.response;
  }

  try {
    const body = await c.req.json();
    const { complex_id, image_type, image_data, adminId } =
      body;

    if (!complex_id || !image_type || !image_data) {
      return c.json(
        {
          error:
            "complex_id, image_type, image_data are required",
        },
        400,
      );
    }

    if (
      !["aerial", "layout", "district"].includes(image_type)
    ) {
      return c.json(
        {
          error:
            "image_type must be 'aerial', 'layout', or 'district'",
        },
        400,
      );
    }

    // Base64 데이터에서 파일 타입 추출
    const matches = image_data.match(
      /^data:([^;]+);base64,(.+)$/,
    );
    if (!matches) {
      return c.json(
        { error: "Invalid image_data format" },
        400,
      );
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    // Base64를 Uint8Array로 변환
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // 🔒 파일 보안 검증
    const fileSize = bytes.length;
    const fileValidation = validateImageFile(
      fileSize,
      mimeType,
    );

    if (!fileValidation.valid) {
      return c.json({ error: fileValidation.message }, 400);
    }

    // 파일 확장자 결정
    const extension =
      mimeType === "application/pdf"
        ? "pdf"
        : mimeType === "image/png"
          ? "png"
          : mimeType === "image/webp"
            ? "webp"
            : mimeType === "image/gif"
              ? "gif"
              : "jpg";

    const supabase = kvClient();
    const bucketName = "make-66444bd0-images";
    const filePath = `${complex_id}/${image_type}.${extension}`;

    // 기존 파일 삭제 (있다면)
    try {
      await supabase.storage
        .from(bucketName)
        .remove([filePath]);
    } catch (e) {
      console.log("기존 파일 없음 (정상)");
    }

    // 파일 업로드
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, bytes, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return c.json(
        { error: "파일 업로드 실패", details: uploadError },
        500,
      );
    }

    // Signed URL 생성 (1년 유효)
    const { data: signedUrlData, error: urlError } =
      await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 31536000); // 1년

    if (urlError) {
      console.error("Signed URL error:", urlError);
      return c.json(
        { error: "URL 생성 실패", details: urlError },
        500,
      );
    }

    // 메타데이터를 KV store에 저장
    const metaData = {
      complex_id,
      image_type,
      file_path: filePath,
      signed_url: signedUrlData.signedUrl,
      mime_type: mimeType,
      uploaded_at: new Date().toISOString(),
    };

    const key = `image:${complex_id}:${image_type}`;
    await kvSet(key, metaData);

    // 📝 이미지 업로드 로그 기록
    if (adminId) {
      await logAdminActivity(adminId, "IMAGE_UPLOAD", {
        complex_id,
        image_type,
        file_size: bytes.length,
        mime_type: mimeType,
      });
    }

    console.log(`✅ 이미지 업로드 완료: ${filePath}`);

    return c.json({
      success: true,
      data: {
        complex_id,
        image_type,
        signed_url: signedUrlData.signedUrl,
      },
    });
  } catch (error: any) {
    console.error("Image upload error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// GET /images/:complexId - 특정 단지의 모든 이미지 URL 조회
app.get(
  "/make-server-66444bd0/images/:complexId",
  async (c) => {
    console.log("GET /images/:complexId called");

    try {
      const complex_id = c.req.param("complexId");

      // KV store에서 이미지 메타데이터 조회
      const imageTypes = ["aerial", "layout", "district"];
      const images: any = {};

      for (const imageType of imageTypes) {
        const key = `image:${complex_id}:${imageType}`;
        const metaData = await kvGet(key);

        if (metaData) {
          images[imageType] = metaData.signed_url;
        }
      }

      console.log(`✅ 이미지 조회 완료: ${complex_id}`, images);

      return c.json({
        success: true,
        complex_id,
        images,
      });
    } catch (error: any) {
      console.error("Image fetch error:", error);
      return c.json({ error: error.message }, 500);
    }
  },
);

// DELETE /images/:complexId/:imageType - 이미지 삭제
app.delete(
  "/make-server-66444bd0/images/:complexId/:imageType",
  async (c) => {
    console.log("DELETE /images/:complexId/:imageType called");

    try {
      const complex_id = c.req.param("complexId");
      const image_type = c.req.param("imageType");

      if (
        !["aerial", "layout", "district"].includes(image_type)
      ) {
        return c.json(
          {
            error:
              "image_type must be 'aerial', 'layout', or 'district'",
          },
          400,
        );
      }

      // KV store에서 메타데이터 조회
      const key = `image:${complex_id}:${image_type}`;
      const metaData = await kvGet(key);

      if (!metaData) {
        return c.json(
          { error: "이미지를 찾을 수 없습니다" },
          404,
        );
      }

      // Storage에서 파일 삭제
      const supabase = kvClient();
      const bucketName = "make-66444bd0-images";

      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove([metaData.file_path]);

      if (deleteError) {
        console.error("Storage delete error:", deleteError);
      }

      // KV store에서 메타데이터 삭제
      await kvDel(key);

      console.log(`✅ 이미지 삭제 완료: ${metaData.file_path}`);

      return c.json({
        success: true,
        message: "이미지가 삭제되었습니다",
        complex_id,
        image_type,
      });
    } catch (error: any) {
      console.error("Image delete error:", error);
      return c.json({ error: error.message }, 500);
    }
  },
);

// ========================================
// Admin Management API
// ========================================

// POST /admin/register - 관리자 등록
app.post("/make-server-66444bd0/admin/register", async (c) => {
  console.log("POST /admin/register called");

  try {
    const body = await c.req.json();
    const { name, department, phone, password, authCode } =
  body;

const normalizedPhone = normalizePhoneNumber(phone);

if (
  !name ||
  !department ||
  !normalizedPhone ||
  !password ||
  !authCode
) {
  return c.json(
    { error: "모든 필드를 입력해주세요." },
    400,
  );
}

if (!validateAdminPhoneNumber(normalizedPhone)) {
  return c.json(
    { error: "올바른 전화번호 형식이 아닙니다." },
    400,
  );
}

    // 🔒 비밀번호 보안 검증
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return c.json({ error: passwordValidation.message }, 400);
    }

    // 인증번호 확인
    const authCodeKey = `auth_code:${authCode}`;
    const authCodeData = await kvGet(authCodeKey);

    if (!authCodeData) {
      return c.json(
        { error: "유효하지 않은 인증번호입니다." },
        400,
      );
    }

    if (authCodeData.status !== "active") {
      return c.json(
        { error: "이미 사용된 인증번호입니다." },
        400,
      );
    }

    // 전화번호 중복 확인
    const phoneKey = `admin_phone:${normalizedPhone}`;
    const existingAdmin = await kvGet(phoneKey);

    if (existingAdmin) {
      return c.json(
        { error: "이미 등록된 전화번호입니다." },
        400,
      );
    }

    const adminId = `admin_${Date.now()}`;
    const passwordHash = await bcrypt.hash(
      password + PASSWORD_PEPPER,
      12,
    );

    const adminData = {
      id: adminId,
      name,
      department,
      phone: normalizedPhone,
      passwordHash,
      isPrimaryAdmin: false,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    // KV store에 저장
    await kvSet(`admin:${adminId}`, adminData);
    await kvSet(phoneKey, adminId);

    // 인증번호 사용 처리
    await kvSet(authCodeKey, {
      ...authCodeData,
      status: "used",
      usedBy: name,
      usedAt: new Date().toISOString(),
    });

    // 📝 관리자 활동 로그 기록
    await logAdminActivity(adminId, "ADMIN_REGISTER", {
      name,
      department,
      phone: normalizedPhone,
      isPrimaryAdmin: false,
      isActive: true,
    });

    console.log("✅ 관리자 등록 완료:", adminId);

    return c.json({
      success: true,
      message: "관리자 등록이 완료되었습니다.",
      adminId,
    });
  } catch (error: any) {
    console.error("Admin register error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// POST /admin/login - 관리자 로그인
app.post("/make-server-66444bd0/admin/login", async (c) => {
  console.log("POST /admin/login called");

  try {
    const body = await c.req.json();
    console.log("login body:", body);

    const { phone, password } = body;

    if (!phone || !password) {
      console.log("login fail: missing phone/password");
      return c.json(
        { error: "전화번호와 비밀번호를 입력해주세요." },
        400,
      );
    }

    const normalizedPhone = normalizePhoneNumber(phone);

if (!validateAdminPhoneNumber(normalizedPhone)) {
  console.log("login fail: invalid admin phone format", normalizedPhone);
  return c.json(
    { error: "올바른 전화번호 형식이 아닙니다." },
    400,
  );
}

// 🔒 Rate Limiting: 로그인 시도 제한 (1분에 5회)
if (!checkRateLimit(`login:${normalizedPhone}`, 5, 60000)) {
  console.log("login fail: rate limited", normalizedPhone);
  return c.json(
    {
      error:
        "너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.",
    },
    429,
  );
}

    // 전화번호로 관리자 ID 조회
    const phoneKey = `admin_phone:${normalizedPhone}`;
    const adminId = await kvGet(phoneKey);
    console.log("phoneKey result:", adminId);

    if (!adminId) {
      console.log("login fail: unregistered phone");
      return c.json(
        { error: "등록되지 않은 전화번호입니다." },
        401,
      );
    }

    // 관리자 정보 조회
    const adminKey = `admin:${adminId}`;
    const adminData = await kvGet(adminKey);
    console.log(
      "adminData result:",
      adminData ? "found" : "missing",
    );

    if (!adminData) {
      console.log("login fail: admin data missing");
      return c.json(
        { error: "관리자 정보를 찾을 수 없습니다." },
        404,
      );
    }

    let normalizedAdminData = adminData;

    // 레거시 관리자 데이터 보정
    if (
      typeof adminData.isPrimaryAdmin === "undefined" ||
      typeof adminData.isActive === "undefined"
    ) {
      normalizedAdminData = {
        ...adminData,
        isPrimaryAdmin: adminData.isPrimaryAdmin === true,
        isActive: adminData.isActive !== false,
        updatedAt: new Date().toISOString(),
      };

      await kvSet(adminKey, normalizedAdminData);
      console.log(
        "✅ 레거시 관리자 데이터 보정 완료:",
        adminId,
      );
    }

    // 🔒 계정 활성 상태 확인
    if (normalizedAdminData.isActive === false) {
      await logAdminActivity(adminId, "LOGIN_BLOCKED", {
        phone: normalizedPhone,
        reason: "비활성화된 계정",
      });
      console.log("login fail: inactive account");
      return c.json(
        { error: "비활성화된 관리자 계정입니다." },
        403,
      );
    }

    // 비밀번호 확인
const storedHash =
  normalizedAdminData.passwordHash ||
  normalizedAdminData.password ||
  "";

if (!storedHash) {
  await logAdminActivity(adminId, "LOGIN_FAILED", {
    phone: normalizedPhone,
    reason: "저장된 비밀번호 해시 없음",
  });
  console.log("login fail: stored hash missing");
  return c.json(
    { error: "관리자 비밀번호 정보가 올바르지 않습니다." },
    500,
  );
}

let passwordOk = false;
let matchedWithoutPepper = false;

try {
  // 1차: 현재 방식 (password + pepper)
  passwordOk = await bcrypt.compare(
    password + PASSWORD_PEPPER,
    storedHash,
  );

  // 2차: 레거시 호환 (pepper 없이 저장된 계정 대응)
  if (!passwordOk) {
    passwordOk = await bcrypt.compare(password, storedHash);
    if (passwordOk) {
      matchedWithoutPepper = true;
    }
  }
} catch (compareError: any) {
  console.error("bcrypt compare error:", compareError);
  return c.json(
    { error: "비밀번호 검증 중 오류가 발생했습니다." },
    500,
  );
}

console.log("password compare result:", passwordOk, {
  matchedWithoutPepper,
});

if (!passwordOk) {
  // 📝 로그인 실패 로그 기록
  await logAdminActivity(adminId, "LOGIN_FAILED", {
    phone: normalizedPhone,
    reason: "잘못된 비밀번호",
  });
  console.log("login fail: wrong password");
  return c.json(
    { error: "비밀번호가 일치하지 않습니다." },
    401,
  );
}

// 레거시 해시(pepper 없이 저장된 비밀번호)면 현재 방식으로 자동 재해시
if (matchedWithoutPepper) {
  const upgradedHash = await bcrypt.hash(
    password + PASSWORD_PEPPER,
    12,
  );

  normalizedAdminData = {
    ...normalizedAdminData,
    passwordHash: upgradedHash,
    updatedAt: new Date().toISOString(),
  };

  await kvSet(adminKey, normalizedAdminData);
  console.log("✅ 레거시 비밀번호 해시 업그레이드 완료:", adminId);
}

    console.log("✅ 관리자 로그인 성공:", adminId);

    // 📝 로그인 성공 로그 기록
    await logAdminActivity(adminId, "LOGIN_SUCCESS", {
      name: normalizedAdminData.name,
      department: normalizedAdminData.department,
      isPrimaryAdmin: normalizedAdminData.isPrimaryAdmin,
      isActive: normalizedAdminData.isActive,
    });

    // 로그인 기록 저장 (기존 방식 유지)
    const loginLogId = `log_${Date.now()}`;
    const now = new Date();
    const dateString = now
      .toISOString()
      .split("T")[0]
      .replace(/-/g, ".");
    const timeString = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const loginLog = {
      id: loginLogId,
      adminId: adminId,
      adminName: normalizedAdminData.name,
      action: "login",
      timestamp: now.toISOString(),
      date: dateString,
      time: timeString,
    };

    await kvSet(`admin_log:${adminId}:${loginLogId}`, loginLog);

    // 관리자 세션 토큰 생성
    const adminApiToken = crypto.randomUUID();

    // 🔒 CSRF 토큰 생성
    const csrfToken = generateCsrfToken();

    // 관리자 세션 저장
    await kvSet(`admin_session:${adminApiToken}`, {
      adminId: adminId,
      name: normalizedAdminData.name,
      phone: normalizedAdminData.phone,
      department: normalizedAdminData.department,
      isPrimaryAdmin: normalizedAdminData.isPrimaryAdmin,
      isActive: normalizedAdminData.isActive,
      csrfToken: csrfToken, // 🔒 CSRF 토큰 추가
      createdAt: new Date().toISOString(),
    });

    // 비밀번호 제외하고 반환
    const {
      passwordHash: _,
      password: __,
      ...adminInfo
    } = normalizedAdminData;

    return c.json({
      success: true,
      admin: adminInfo,
      adminApiToken,
      csrfToken, // 🔒 CSRF 토큰 클라이언트에 반환
    });
  } catch (error: any) {
    console.error("Admin login error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// PUT /admin/profile - 관리자 프로필 수정
app.put("/make-server-66444bd0/admin/profile", async (c) => {
  console.log("PUT /admin/profile called");

  try {
    const body = await c.req.json();
    const { adminId, phone, password } = body;

    if (!adminId) {
      return c.json({ error: "adminId is required." }, 400);
    }

    const adminKey = `admin:${adminId}`;
    const existingAdmin = await kvGet(adminKey);

    if (!existingAdmin) {
      return c.json(
        { error: "관리자 정보를 찾을 수 없습니다." },
        404,
      );
    }

    const normalizedPhone =
  typeof phone === "string"
    ? normalizePhoneNumber(phone)
    : normalizePhoneNumber(existingAdmin.phone || "");
const trimmedPassword =
  typeof password === "string" ? password.trim() : "";

if (!normalizedPhone) {
  return c.json({ error: "전화번호를 입력해주세요." }, 400);
}

if (!validateAdminPhoneNumber(normalizedPhone)) {
  return c.json(
    { error: "올바른 전화번호 형식이 아닙니다." },
    400,
  );
}

const oldPhone = normalizePhoneNumber(existingAdmin.phone || "");

if (oldPhone !== normalizedPhone) {
  const newPhoneKey = `admin_phone:${normalizedPhone}`;
  const phoneOwner = await kvGet(newPhoneKey);

      if (phoneOwner && phoneOwner !== adminId) {
        return c.json(
          { error: "이미 사용 중인 전화번호입니다." },
          400,
        );
      }
    }

    const updatedAdmin = {
      ...existingAdmin,
      phone: normalizedPhone,
      ...(trimmedPassword
        ? {
            passwordHash: await bcrypt.hash(
              trimmedPassword + PASSWORD_PEPPER,
              12,
            ),
          }
        : {}),
      isPrimaryAdmin: existingAdmin.isPrimaryAdmin === true,
      updatedAt: new Date().toISOString(),
    };

    delete (updatedAdmin as any).password;

    await kvSet(adminKey, updatedAdmin);

    if (oldPhone && oldPhone !== normalizedPhone) {
  await kvDel(`admin_phone:${oldPhone}`);
  await kvSet(`admin_phone:${normalizedPhone}`, adminId);
}

    await logAdminActivity(adminId, "PROFILE_UPDATED", {
      before: {
        name: existingAdmin.name,
        department: existingAdmin.department,
        phone: existingAdmin.phone,
        isPrimaryAdmin: existingAdmin.isPrimaryAdmin === true,
      },
      after: {
        name: updatedAdmin.name,
        department: updatedAdmin.department,
        phone: updatedAdmin.phone,
        isPrimaryAdmin: updatedAdmin.isPrimaryAdmin,
      },
      changedFields: {
        phone: oldPhone !== normalizedPhone,
        password: !!trimmedPassword,
      },
    });

    const {
      passwordHash: _,
      password: __,
      ...adminInfo
    } = updatedAdmin as any;

    return c.json({
      success: true,
      message: "프로필이 수정되었습니다.",
      admin: adminInfo,
    });
  } catch (error: any) {
    console.error("Admin profile update error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// GET /admin/accounts - 관리자 계정 목록 조회
app.get("/make-server-66444bd0/admin/accounts", async (c) => {
  console.log("GET /admin/accounts called");

  try {
    const admins = await kvGetByPrefix("admin:");

    const normalizedAdmins = (admins || [])
      .filter((admin) => admin && admin.id && admin.phone)
      .map((admin) => {
        const { password: _, ...adminInfo } = admin;

        return {
          ...adminInfo,
          isPrimaryAdmin: admin.isPrimaryAdmin === true,
          isActive: admin.isActive !== false,
        };
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

    return c.json({
      success: true,
      admins: normalizedAdmins,
    });
  } catch (error: any) {
    console.error("Admin accounts fetch error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// DELETE /admin/accounts/:adminId - 관리자 계정 삭제
app.delete(
  "/make-server-66444bd0/admin/accounts/:adminId",
  async (c) => {
    console.log("DELETE /admin/accounts/:adminId called");

    // 🔒 관리자 인증 및 CSRF 토큰 검증
    const authResult = await requireAdminAuth(c, true);
    if (!authResult.ok) {
      return authResult.response;
    }

    try {
      const adminId = c.req.param("adminId");
      const adminKey = `admin:${adminId}`;
      const adminData = await kvGet(adminKey);

      if (!adminData) {
        return c.json(
          { error: "관리자 정보를 찾을 수 없습니다." },
          404,
        );
      }

      if (adminData.isPrimaryAdmin === true) {
        return c.json(
          { error: "기본 관리자 계정은 삭제할 수 없습니다." },
          403,
        );
      }

      await kvDel(adminKey);

      if (adminData.phone) {
        await kvDel(`admin_phone:${adminData.phone}`);
      }

      await logAdminActivity(adminId, "ADMIN_DELETED", {
        name: adminData.name,
        department: adminData.department,
        phone: adminData.phone,
      });

      return c.json({
        success: true,
        message: "관리자 계정이 삭제되었습니다.",
        deletedAdminId: adminId,
      });
    } catch (error: any) {
      console.error("Admin account delete error:", error);
      return c.json({ error: error.message }, 500);
    }
  },
);

// GET /admin/auth-codes - 인증번호 목록 조회
app.get("/make-server-66444bd0/admin/auth-codes", async (c) => {
  console.log("GET /admin/auth-codes called");

  try {
    const authCodes = await kvGetByPrefix("auth_code:");

    return c.json({
      success: true,
      authCodes: authCodes || [],
    });
  } catch (error: any) {
    console.error("Auth codes fetch error:", error);
    return c.json({ error: error.message }, 500);
  }
});

type AuthCodeData = {
  id: string;
  code: string;
  status: "active" | "used" | "inactive";
  createdAt: string;
  usedBy: string | null;
  usedAt: string | null;
};

// POST /admin/auth-codes - 인증번호 생성
app.post(
  "/make-server-66444bd0/admin/auth-codes",
  async (c) => {
    console.log("POST /admin/auth-codes called");

    try {
      const body = await c.req.json();
      const { count = 1 } = body;

      const generatedCodes: AuthCodeData[] = [];

      for (let i = 0; i < count; i++) {
        const code =
          `${randomString(4)}-${randomString(4)}-${randomString(4)}`.toUpperCase();
        const id = `authcode_${Date.now()}_${i}`;

        const authCodeData: AuthCodeData = {
          id,
          code,
          status: "active",
          createdAt: new Date().toISOString(),
          usedBy: null,
          usedAt: null,
        };

        await kvSet(`auth_code:${code}`, authCodeData);
        generatedCodes.push(authCodeData);
      }

      console.log(
        "✅ 인증번호 생성 완료:",
        generatedCodes.length,
      );

      return c.json({
        success: true,
        authCodes: generatedCodes,
      });
    } catch (error: any) {
      console.error("Auth code generation error:", error);
      return c.json(
        {
          error:
            error.message || "인증번호 생성에 실패했습니다.",
        },
        500,
      );
    }
  },
);

app.delete(
  "/make-server-66444bd0/admin/auth-codes/:code",
  async (c) => {
    console.log("DELETE /admin/auth-codes/:code called");

    try {
      const code = decodeURIComponent(c.req.param("code"));
      const authCodeKey = `auth_code:${code}`;
      const authCodeData = await kvGet(authCodeKey);

      if (!authCodeData) {
        return c.json(
          { error: "인증번호를 찾을 수 없습니다." },
          404,
        );
      }

      await kvDel(authCodeKey);

      return c.json({
        success: true,
        message: "인증번호가 삭제되었습니다.",
        code,
      });
    } catch (error: any) {
      console.error("Auth code delete error:", error);
      return c.json({ error: error.message }, 500);
    }
  },
);

// GET /admin/logs/:adminId - 관리자 활동 로그 조회
app.get(
  "/make-server-66444bd0/admin/logs/:adminId",
  async (c) => {
    console.log("GET /admin/logs/:adminId called");

    try {
      const adminId = c.req.param("adminId");

      // 해당 관리자의 모든 로그 조회
      const logs = await kvGetByPrefix(`admin_log:${adminId}:`);

      // 시간 순으로 정렬 (최신순)
      logs.sort((a, b) => {
        const timeA = new Date(a.timestamp || 0).getTime();
        const timeB = new Date(b.timestamp || 0).getTime();
        return timeB - timeA;
      });

      console.log(`✅ 관리자 로그 조회 완료: ${logs.length}개`);

      return c.json({
        success: true,
        logs: logs,
      });
    } catch (error: any) {
      console.error("Admin logs fetch error:", error);
      return c.json({ error: error.message }, 500);
    }
  },
);

// POST /admin/logs - 관리자 활동 로그 기록
app.post("/make-server-66444bd0/admin/logs", async (c) => {
  console.log("POST /admin/logs called");

  try {
    const body = await c.req.json();
    const { adminId, adminName, action, target, details } =
      body;

    if (!adminId || !adminName || !action) {
      return c.json(
        { error: "adminId, adminName, action are required" },
        400,
      );
    }

    const logId = `log_${Date.now()}`;
    const now = new Date();
    const dateString = now
      .toISOString()
      .split("T")[0]
      .replace(/-/g, ".");
    const timeString = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const logData = {
      id: logId,
      adminId,
      adminName,
      action,
      target: target || null,
      details: details || null,
      timestamp: now.toISOString(),
      date: dateString,
      time: timeString,
    };

    await kvSet(`admin_log:${adminId}:${logId}`, logData);

    console.log("✅ 관리자 활동 로그 기록 완료:", logData);

    return c.json({
      success: true,
      log: logData,
    });
  } catch (error: any) {
    console.error("Admin log creation error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// GET /admin/security-logs - 모든 관리자 보안 활동 로그 조회 (새로운 시스템)
app.get(
  "/make-server-66444bd0/admin/security-logs",
  async (c) => {
    console.log("GET /admin/security-logs called");

    try {
      const logs = await kvGetByPrefix("log:");

      // 시간 순으로 정렬 (최신순)
      logs.sort((a, b) => {
        const timeA = new Date(a.timestamp || 0).getTime();
        const timeB = new Date(b.timestamp || 0).getTime();
        return timeB - timeA;
      });

      console.log(`✅ 보안 로그 조회 완료: ${logs.length}개`);

      return c.json({
        success: true,
        logs: logs,
      });
    } catch (error: any) {
      console.error("Security logs fetch error:", error);
      return c.json({ error: error.message }, 500);
    }
  },
);

// ========================================
// Basic Info Management API
// ========================================

// GET /basic-info - 기본정보 조회
app.get("/make-server-66444bd0/basic-info", async (c) => {
  console.log("GET /basic-info called");

  try {
    const allData = await kvGetByPrefix("basic_info:");

    console.log(`✅ 기본정보 조회 완료: ${allData.length}개`);

    return c.json(allData);
  } catch (error: any) {
    console.error("Basic info fetch error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// PUT /basic-info - 기본정보 업데이트
app.put("/make-server-66444bd0/basic-info", async (c) => {
  console.log("PUT /basic-info called");

  try {
    const body = await c.req.json();
    const {
      complex_id,
      subDistricts,
      total_households_before,
      total_households_after,
    } = body;

    if (!complex_id) {
      return c.json({ error: "complex_id is required" }, 400);
    }

    const key = `basic_info:${complex_id}`;
    const data = {
      complex_id,
      subDistricts: subDistricts || [],
      total_households_before:
        total_households_before || "0가구",
      total_households_after: total_households_after || "0가구",
    };

    await kvSet(key, data);

    console.log(`✅ 기본정보 업데이트 완료: ${complex_id}`);

    return c.json({ success: true, data });
  } catch (error: any) {
    console.error("Basic info update error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// ========================================
// Parking Management API
// ========================================

// GET /parking - 주차 개선 정보 조회
app.get("/make-server-66444bd0/parking", async (c) => {
  console.log("GET /parking called");

  try {
    const allData = await kvGetByPrefix("parking:");

    console.log(
      `✅ 주차 개선 정보 조회 완료: ${allData.length}개`,
    );

    return c.json(allData);
  } catch (error: any) {
    console.error("Parking fetch error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// PUT /parking - 주차 개선 정보 업데이트
app.put("/make-server-66444bd0/parking", async (c) => {
  console.log("PUT /parking called");

  try {
    const body = await c.req.json();
    const { complex_id, parking_before, parking_after } = body;

    if (!complex_id || !parking_before || !parking_after) {
      return c.json(
        {
          error:
            "complex_id, parking_before, parking_after are required",
        },
        400,
      );
    }

    const key = `parking:${complex_id}`;
    const data = {
      complex_id,
      parking_before,
      parking_after,
    };

    await kvSet(key, data);

    console.log(
      `✅ 주차 개선 정보 업데이트 완료: ${complex_id}`,
    );

    return c.json({ success: true, data });
  } catch (error: any) {
    console.error("Parking update error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// ========================================
// Floors Management API
// ========================================

// GET /floors - 예상 층수 조회
app.get("/make-server-66444bd0/floors", async (c) => {
  console.log("GET /floors called");

  try {
    const allData = await kvGetByPrefix("floors:");

    console.log(`✅ 예상 층수 조회 완료: ${allData.length}개`);

    return c.json(allData);
  } catch (error: any) {
    console.error("Floors fetch error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// PUT /floors - 예상 층수 업데이트
app.put("/make-server-66444bd0/floors", async (c) => {
  console.log("PUT /floors called");

  try {
    const body = await c.req.json();
    const { complex_id, max_floors } = body;

    if (!complex_id || !max_floors) {
      return c.json(
        { error: "complex_id, max_floors are required" },
        400,
      );
    }

    const key = `floors:${complex_id}`;
    const data = {
      complex_id,
      max_floors,
    };

    await kvSet(key, data);

    console.log(`✅ 예상 층수 업데이트 완료: ${complex_id}`);

    return c.json({ success: true, data });
  } catch (error: any) {
    console.error("Floors update error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// ========================================
// Floor Area Ratio Management API
// ========================================

// GET /floor-area-ratio - 용적률/건폐율 조회
app.get("/make-server-66444bd0/floor-area-ratio", async (c) => {
  console.log("GET /floor-area-ratio called");

  try {
    const complex_id = c.req.query("complex_id");

    if (complex_id) {
      // 특정 단지 조회
      const key = `floor_area_ratio:${complex_id}`;
      const data = await kvGet(key);

      if (!data) {
        return c.json({
          complex_id,
          floor_area_ratio: null,
          building_coverage_ratio: null,
        });
      }

      return c.json(data);
    } else {
      // 전체 조회
      const allData = await kvGetByPrefix("floor_area_ratio:");

      console.log(
        `✅ 용적률/건폐율 조회 완료: ${allData.length}개`,
      );

      return c.json(allData);
    }
  } catch (error: any) {
    console.error("Floor area ratio fetch error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// PUT /floor-area-ratio - 용적률/건폐율 업데이트
app.put("/make-server-66444bd0/floor-area-ratio", async (c) => {
  console.log("PUT /floor-area-ratio called");

  try {
    const body = await c.req.json();
    const {
      complex_id,
      floor_area_ratio,
      building_coverage_ratio,
    } = body;

    if (!complex_id || !floor_area_ratio) {
      return c.json(
        { error: "complex_id, floor_area_ratio are required" },
        400,
      );
    }

    const key = `floor_area_ratio:${complex_id}`;
    const data = {
      complex_id,
      floor_area_ratio,
      building_coverage_ratio: building_coverage_ratio || "-",
    };

    await kvSet(key, data);

    console.log(
      `✅ 용적률/건폐율 업데이트 완료: ${complex_id}`,
    );

    return c.json({ success: true, data });
  } catch (error: any) {
    console.error("Floor area ratio update error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// ========================================
// Contribution Guide Management API
// ========================================

// GET /contribution-guide - 분담금 안내 내용 조회
app.get(
  "/make-server-66444bd0/contribution-guide",
  async (c) => {
    console.log("GET /contribution-guide called");

    try {
      const key = "contribution_guide_content";
      const content = await kvGet(key);

      if (!content) {
        return c.json({ content: null });
      }

      console.log("✅ 분담금 안내 조회 완료");
      return c.json({ content });
    } catch (error: any) {
      console.error("Contribution guide fetch error:", error);
      return c.json({ error: error.message }, 500);
    }
  },
);

// PUT /contribution-guide - 분담금 안내 내용 업데이트
app.put(
  "/make-server-66444bd0/contribution-guide",
  async (c) => {
    console.log("PUT /contribution-guide called");

    try {
      const body = await c.req.json();
      const { content } = body;

      if (!content) {
        return c.json({ error: "content is required" }, 400);
      }

      const key = "contribution_guide_content";
      await kvSet(key, content);

      console.log("✅ 분담금 안내 업데이트 완료");
      return c.json({ success: true, content });
    } catch (error: any) {
      console.error("Contribution guide update error:", error);
      return c.json({ error: error.message }, 500);
    }
  },
);

// ========================================
// Guide Content Management API
// ========================================

// GET /guide-content - 가이드 콘텐츠 조회
app.get("/make-server-66444bd0/guide-content", async (c) => {
  console.log("GET /guide-content called");

  try {
    const glossaryData = (await kvGet("guide_glossary")) || [];
    const faqData = (await kvGet("guide_faq")) || [];
    const projectTypesData =
      (await kvGet("guide_project_types")) || [];
    const reconstructionStepsData =
      (await kvGet("guide_reconstruction_steps")) || [];
    const originalReconstructionStepsData =
      (await kvGet("guide_original_reconstruction_steps")) ||
      [];
    const redevelopmentStepsData =
      (await kvGet("guide_redevelopment_steps")) || [];
    const streetHousingStepsData =
      (await kvGet("guide_street_housing_steps")) || [];
    const leadZoneData =
      (await kvGet("guide_lead_zone")) || null;
    const totalDurationsData =
      (await kvGet("guide_total_durations")) || null;

    console.log("✅ 가이드 콘텐츠 조회 완료");
    return c.json({
      glossary: glossaryData,
      faqs: faqData,
      projectTypes: projectTypesData,
      reconstructionSteps: reconstructionStepsData,
      originalReconstructionSteps:
        originalReconstructionStepsData,
      redevelopmentSteps: redevelopmentStepsData,
      streetHousingSteps: streetHousingStepsData,
      leadZone: leadZoneData,
      totalDurations: totalDurationsData,
    });
  } catch (error: any) {
    console.error("Guide content fetch error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// PUT /guide-content - 가이드 콘텐츠 업데이트
app.put("/make-server-66444bd0/guide-content", async (c) => {
  console.log("PUT /guide-content called");

  // 관리자 인증 확인
  const authResult = await requireAdminAuth(c, true);
  if (!authResult.ok) {
    return authResult.response;
  }

  try {
    const body = await c.req.json();
    const { section, data } = body;

    if (!section || !data) {
      return c.json(
        { error: "section and data are required" },
        400,
      );
    }

    let key: string;
    switch (section) {
      case "glossary":
        key = "guide_glossary";
        break;
      case "faq":
        key = "guide_faq";
        break;
      case "projectTypes":
        key = "guide_project_types";
        break;
      case "reconstructionSteps":
        key = "guide_reconstruction_steps";
        break;
      case "originalReconstructionSteps":
        key = "guide_original_reconstruction_steps";
        break;
      case "redevelopmentSteps":
        key = "guide_redevelopment_steps";
        break;
      case "streetHousingSteps":
        key = "guide_street_housing_steps";
        break;
      case "leadZone":
        key = "guide_lead_zone";
        break;
      case "totalDurations":
        key = "guide_total_durations";
        break;
      default:
        return c.json({ error: "Invalid section" }, 400);
    }

    await kvSet(key, data);

    console.log(`✅ 가이드 콘텐츠 업데이트 완료: ${section}`);
    return c.json({ success: true, section, data });
  } catch (error: any) {
    console.error("Guide content update error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// ========================================
// Complex List Management API
// ========================================

// GET /complex-list - 단지 목록 조회
app.get("/make-server-66444bd0/complex-list", async (c) => {
  console.log("GET /complex-list called");

  try {
    const complexList = (await kvGet("complex_list")) || [];
    console.log("✅ 단지 목록 조회 완료");
    return c.json({ complexList });
  } catch (error: any) {
    console.error("Complex list fetch error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// PUT /complex-list - 단지 목록 업데이트
app.put("/make-server-66444bd0/complex-list", async (c) => {
  console.log("PUT /complex-list called");

  try {
    const body = await c.req.json();
    const { complexList } = body;

    if (!complexList || !Array.isArray(complexList)) {
      return c.json(
        { error: "complexList must be an array" },
        400,
      );
    }

    await kvSet("complex_list", complexList);

    console.log(
      `✅ 단지 목록 업데이트 완료: ${complexList.length}개 단지`,
    );
    return c.json({ success: true, complexList });
  } catch (error: any) {
    console.error("Complex list update error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// ========================================
// Category-specific Complex List APIs
// ========================================

// 원도심 재개발
app.get(
  "/make-server-66444bd0/complex-list-oldtown-redevelopment",
  async (c) => {
    console.log(
      "GET /complex-list-oldtown-redevelopment called",
    );
    try {
      const complexList =
        (await kvGet("complex_list_oldtown_redevelopment")) ||
        [];
      console.log("✅ 원도심 재개발 단지 목록 조회 완료");
      return c.json({ complexList });
    } catch (error: any) {
      console.error("Complex list fetch error:", error);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.put(
  "/make-server-66444bd0/complex-list-oldtown-redevelopment",
  async (c) => {
    console.log(
      "PUT /complex-list-oldtown-redevelopment called",
    );
    try {
      const body = await c.req.json();
      const { complexList } = body;
      if (!complexList || !Array.isArray(complexList)) {
        return c.json(
          { error: "complexList must be an array" },
          400,
        );
      }
      await kvSet(
        "complex_list_oldtown_redevelopment",
        complexList,
      );
      console.log(
        `✅ 원도심 재개발 단지 목록 업데이트 완료: ${complexList.length}개`,
      );
      return c.json({ success: true, complexList });
    } catch (error: any) {
      console.error("Complex list update error:", error);
      return c.json({ error: error.message }, 500);
    }
  },
);

// 원도심 재건축
app.get(
  "/make-server-66444bd0/complex-list-oldtown-reconstruction",
  async (c) => {
    console.log(
      "GET /complex-list-oldtown-reconstruction called",
    );
    try {
      const complexList =
        (await kvGet("complex_list_oldtown_reconstruction")) ||
        [];
      console.log("✅ 원도심 재건축 단지 목록 조회 완료");
      return c.json({ complexList });
    } catch (error: any) {
      console.error("Complex list fetch error:", error);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.put(
  "/make-server-66444bd0/complex-list-oldtown-reconstruction",
  async (c) => {
    console.log(
      "PUT /complex-list-oldtown-reconstruction called",
    );
    try {
      const body = await c.req.json();
      const { complexList } = body;
      if (!complexList || !Array.isArray(complexList)) {
        return c.json(
          { error: "complexList must be an array" },
          400,
        );
      }
      await kvSet(
        "complex_list_oldtown_reconstruction",
        complexList,
      );
      console.log(
        `✅ 원도심 재건축 단지 목록 업데이트 완료: ${complexList.length}개`,
      );
      return c.json({ success: true, complexList });
    } catch (error: any) {
      console.error("Complex list update error:", error);
      return c.json({ error: error.message }, 500);
    }
  },
);

// 가로주택정비사업
app.get(
  "/make-server-66444bd0/complex-list-garohousing",
  async (c) => {
    console.log("GET /complex-list-garohousing called");
    try {
      const complexList =
        (await kvGet("complex_list_garohousing")) || [];
      console.log("✅ 가로주택정비사업 단지 목록 조회 완료");
      return c.json({ complexList });
    } catch (error: any) {
      console.error("Complex list fetch error:", error);
      return c.json({ error: error.message }, 500);
    }
  },
);

app.put(
  "/make-server-66444bd0/complex-list-garohousing",
  async (c) => {
    console.log("PUT /complex-list-garohousing called");
    try {
      const body = await c.req.json();
      const { complexList } = body;
      if (!complexList || !Array.isArray(complexList)) {
        return c.json(
          { error: "complexList must be an array" },
          400,
        );
      }
      await kvSet("complex_list_garohousing", complexList);
      console.log(
        `✅ 가로주택정비사업 단지 목록 업데이트 완료: ${complexList.length}개`,
      );
      return c.json({ success: true, complexList });
    } catch (error: any) {
      console.error("Complex list update error:", error);
      return c.json({ error: error.message }, 500);
    }
  },
);

// Helper function for random string
function randomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(
      Math.floor(Math.random() * chars.length),
    );
  }
  return result;
}


// ========================================
// 안내 배너 관리 API
// ========================================

// GET /banner-content - 배너 내용 조회
app.get("/make-server-66444bd0/banner-content", async (c) => {
  console.log("GET /banner-content called");

  try {
    const bannerContent = await kvGet("banner:content");

    if (!bannerContent) {
      // 기본 데이터 반환
      return c.json({
        success: true,
        content: {
          title: "2026년 7월 2차 특별정비구역 지정 관련 안내",
          subtitle: "연도별·분기별 흐름 + 중요 서류·동의문·선정 시점",
          years: [],
          designSummary: "",
          constructionSummary: "",
        },
      });
    }

    return c.json({ success: true, content: bannerContent });
  } catch (error: any) {
    console.error("Banner content fetch error:", error);
    return c.json(
      { error: "배너 내용 조회 중 오류가 발생했습니다." },
      500,
    );
  }
});

// POST /banner-content - 배너 내용 저장 (관리자만)
app.post("/make-server-66444bd0/banner-content", async (c) => {
  console.log("POST /banner-content called");

  // 🔒 관리자 인증 및 CSRF 토큰 검증
  const authResult = await requireAdminAuth(c, true);
  if (!authResult.ok) {
    return authResult.response;
  }

  try {
    const body = await c.req.json();
    const { content, adminName } = body;

    if (!content) {
      return c.json({ error: "content is required" }, 400);
    }

    // 🔒 Rate Limiting: 배너 저장 제한 (1분에 3회)
    const userIdentifier = `banner:save:${adminName || "unknown"}`;
    if (!checkRateLimit(userIdentifier, 3, 60000)) {
      return c.json(
        {
          error:
            "너무 많은 저장 요청을 하고 있습니다. 잠시 후 다시 시도해주세요.",
        },
        429,
      );
    }

    // 🔒 XSS 방지: 모든 텍스트 필드 sanitization
    const sanitizedContent = {
      title: sanitizeHtml(content.title || ""),
      subtitle: sanitizeHtml(content.subtitle || ""),
      years: (content.years || []).map((year: any) => ({
        year: sanitizeHtml(year.year || ""),
        quarters: (year.quarters || []).map((quarter: any) => ({
          quarter: sanitizeHtml(quarter.quarter || ""),
          mainProgress: sanitizeHtml(quarter.mainProgress || ""),
          documents: sanitizeHtml(quarter.documents || ""),
          companies: sanitizeHtml(quarter.companies || ""),
        })),
      })),
      designSummary: sanitizeHtml(content.designSummary || ""),
      constructionSummary: sanitizeHtml(
        content.constructionSummary || "",
      ),
    };

    // KV 저장
    await kvSet("banner:content", sanitizedContent);

    // 🔒 보안 로그 기록 (콘솔)
    console.log("🔒 Security Event: banner_update", {
      eventType: "banner_update",
      severity: "medium",
      adminName: sanitizeHtml(adminName || "unknown"),
      timestamp: new Date().toISOString(),
      contentSize: JSON.stringify(sanitizedContent).length,
    });

    console.log("✅ Banner content saved by:", adminName);
    return c.json({ success: true });
  } catch (error: any) {
    console.error("Banner content save error:", error);
    return c.json(
      { error: "배너 내용 저장 중 오류가 발생했습니다." },
      500,
    );
  }
});

// ============================================================
// SMS 인증 (알리고 Aligo) 엔드포인트
// ============================================================

// 알리고 설정 현황 조회 (마스킹된 값만 반환)
app.get("/make-server-66444bd0/sms-auth/config", async (c) => {
  try {
    const config = await kvGet("sms_aligo_config");
    if (!config) {
      return c.json({ isConfigured: false, apiKeyMasked: "", userId: "", sender: "" });
    }
    return c.json({
      isConfigured: true,
      apiKeyMasked: (config.apiKey || "").slice(-4),
      userId: config.userId || "",
      sender: config.sender || "",
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 알리고 설정 저장 (관리자 전용)
app.post("/make-server-66444bd0/sms-auth/config", async (c) => {
  try {
    const auth = await requireAdminAuth(c, true);
    if (!auth.ok) return auth.response;
    const adminId = auth.adminSession.adminId;

    const { apiKey, userId, sender } = await c.req.json();

    if (!apiKey || !userId || !sender) {
      return c.json({ error: "apiKey, userId, sender 모두 필요합니다." }, 400);
    }

    if (!/^01[016789]\d{7,8}$/.test(sender.replace(/-/g, ""))) {
      return c.json({ error: "올바른 발신번호 형식이 아닙니다." }, 400);
    }

    await kvSet("sms_aligo_config", {
      apiKey: sanitizeHtml(apiKey.trim()),
      userId: sanitizeHtml(userId.trim()),
      sender: sender.replace(/-/g, "").trim(),
      updatedAt: new Date().toISOString(),
      updatedBy: adminId,
    });

    await logAdminActivity(adminId, "sms_config_updated", {
      userId: sanitizeHtml(userId.trim()),
      sender: sender.replace(/-/g, "").trim(),
    });

    return c.json({
      success: true,
      config: {
        isConfigured: true,
        apiKeyMasked: apiKey.trim().slice(-4),
        userId: userId.trim(),
        sender: sender.replace(/-/g, "").trim(),
      },
    });
  } catch (error: any) {
    console.error("SMS config save error:", error);
    return c.json({ error: "설정 저장 중 오류가 발생했습니다." }, 500);
  }
});

// OTP 생성 유틸
function generateOtp(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(arr[0] % 1000000).padStart(6, "0");
}

// SMS 발송 (알리고 API 호출)
async function sendAligoSms(to: string, message: string, config: any): Promise<void> {
  const params = new URLSearchParams({
    key: config.apiKey,
    user_id: config.userId,
    sender: config.sender,
    receiver: to,
    msg: message,
    msg_type: "SMS",
  });
  const res = await fetch("https://apis.aligo.in/send/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const data = await res.json();
  if (data.result_code !== "1") {
    throw new Error(`알리고 발송 실패: ${data.message || JSON.stringify(data)}`);
  }
}

// OTP 발송 요청
app.post("/make-server-66444bd0/sms-auth/send", async (c) => {
  try {
    const { phone } = await c.req.json();
    if (!phone || !/^01[016789]\d{7,8}$/.test(phone)) {
      return c.json({ error: "올바른 휴대폰 번호를 입력해주세요." }, 400);
    }

    // Rate limit: 같은 번호로 1분에 3회 이상 불가
    if (!checkRateLimit(`sms_otp:${phone}`, 3, 60000)) {
      return c.json({ error: "잠시 후 다시 시도해주세요. (1분에 최대 3회)" }, 429);
    }

    // 알리고 설정 확인
    const config = await kvGet("sms_aligo_config");
    if (!config?.apiKey) {
      return c.json({ code: "SMS_NOT_CONFIGURED", error: "SMS 서비스 설정이 필요합니다." }, 503);
    }

    const otp = generateOtp();
    const expireAt = Date.now() + 3 * 60 * 1000; // 3분

    // OTP를 서버에 저장 (전화번호별, 3분 후 자동 만료)
    await kvSet(`sms_otp:${phone}`, { otp, expireAt, createdAt: new Date().toISOString() });

    // 알리고로 SMS 발송
    await sendAligoSms(phone, `[성남시 개발 톡톡] 인증번호: ${otp} (3분 이내 입력)`, config);

    return c.json({ success: true });
  } catch (error: any) {
    console.error("SMS send error:", error);
    return c.json({ error: error.message || "SMS 발송 중 오류가 발생했습니다." }, 500);
  }
});

// OTP 검증
app.post("/make-server-66444bd0/sms-auth/verify", async (c) => {
  try {
    const { phone, otp } = await c.req.json();
    if (!phone || !otp) {
      return c.json({ error: "phone과 otp가 필요합니다." }, 400);
    }

    const stored = await kvGet(`sms_otp:${phone}`);
    if (!stored) {
      return c.json({ code: "OTP_EXPIRED", error: "인증번호가 만료되었습니다. 다시 발송해주세요." }, 401);
    }
    if (Date.now() > stored.expireAt) {
      await kvDel(`sms_otp:${phone}`);
      return c.json({ code: "OTP_EXPIRED", error: "인증번호가 만료되었습니다. 다시 발송해주세요." }, 401);
    }
    if (stored.otp !== otp) {
      return c.json({ code: "OTP_MISMATCH", error: "인증번호가 일치하지 않습니다." }, 401);
    }

    // 검증 성공 → OTP 삭제
    await kvDel(`sms_otp:${phone}`);
    return c.json({ success: true });
  } catch (error: any) {
    console.error("OTP verify error:", error);
    return c.json({ error: "인증 확인 중 오류가 발생했습니다." }, 500);
  }
});

// 테스트 SMS 발송 (관리자 전용)
app.post("/make-server-66444bd0/sms-auth/test", async (c) => {
  try {
    const auth = await requireAdminAuth(c, true);
    if (!auth.ok) return auth.response;
    const adminId = auth.adminSession.adminId;

    const { phone } = await c.req.json();

    if (!phone || !/^01[016789]\d{7,8}$/.test(phone)) {
      return c.json({ error: "올바른 휴대폰 번호를 입력해주세요." }, 400);
    }

    const config = await kvGet("sms_aligo_config");
    if (!config?.apiKey) {
      return c.json({ code: "SMS_NOT_CONFIGURED", error: "알리고 API Key가 설정되지 않았습니다." }, 503);
    }

    const testOtp = generateOtp();
    await sendAligoSms(phone, `[성남시 개발 톡톡] 테스트 인증번호: ${testOtp}`, config);

    await logAdminActivity(adminId, "sms_test_sent", {
      targetPhone: phone,
    });

    return c.json({ success: true });
  } catch (error: any) {
    console.error("SMS test error:", error);
    return c.json({ error: error.message || "테스트 발송 중 오류가 발생했습니다." }, 500);
  }
});

// 🔍 DEBUG: Catch-all route to see what path is being received
app.all("*", (c) => {
  const url = new URL(c.req.url);
  console.log("🔍 DEBUG - Catch-all route triggered");
  console.log("   Full URL:", c.req.url);
  console.log("   Pathname:", url.pathname);
  console.log("   Method:", c.req.method);

  return c.json(
    {
      error: "Route not found",
      debug: {
        url: c.req.url,
        pathname: url.pathname,
        method: c.req.method,
        message:
          "This is a debug response. The route was not matched.",
      },
    },
    404,
  );
});

console.log("Starting Deno server for bundang-rebuild-360...");
Deno.serve(app.fetch);
