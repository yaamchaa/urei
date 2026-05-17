import { Hono } from "npm:hono";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

// 성남시 개발 톡톡 AI 챗봇 서버 - OpenAI GPT-4o-mini
// Project: bundang rebuild 360 (qhsgehwkwefkdtmzefkh)

// ========================================
// KV Store Functions (inline)
// ========================================
const kvClient = () => createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
);

const kvSet = async (key: string, value: any): Promise<void> => {
  const supabase = kvClient();
  const { error } = await supabase.from("kv_store_66444bd0").upsert({
    key,
    value
  });
  if (error) {
    throw new Error(error.message);
  }
};

const kvGet = async (key: string): Promise<any> => {
  const supabase = kvClient();
  const { data, error } = await supabase.from("kv_store_66444bd0").select("value").eq("key", key).maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data?.value;
};

const kvDel = async (key: string): Promise<void> => {
  const supabase = kvClient();
  const { error } = await supabase.from("kv_store_66444bd0").delete().eq("key", key);
  if (error) {
    throw new Error(error.message);
  }
};

const kvGetByPrefix = async (prefix: string): Promise<any[]> => {
  const supabase = kvClient();
  const { data, error } = await supabase.from("kv_store_66444bd0").select("key, value").like("key", prefix + "%");
  if (error) {
    throw new Error(error.message);
  }
  return data?.map((d) => d.value) ?? [];
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

// ========================================
// Hono Server
// ========================================
const app = new Hono({ strict: false });

// Enable logger
app.use('*', logger(console.log));

// Manual CORS handling - Add headers to all responses
app.use("*", async (c, next) => {
  const path = new URL(c.req.url).pathname;
  console.log(`[CORS] ${c.req.method} ${path}`);
  
  // Handle preflight OPTIONS request FIRST
  if (c.req.method === "OPTIONS") {
    console.log(`[CORS] Responding to OPTIONS with 204`);
    return c.body(null, 204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
      "Access-Control-Max-Age": "600"
    });
  }
  
  // Set CORS headers for all other requests
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization, apikey, x-client-info");
  c.header("Access-Control-Max-Age", "600");
  
  await next();
});

// Health check endpoint - No auth required
app.get("/make-server-66444bd0/health", (c) => {
  console.log("✅ Health check called");
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    server: "bundang-rebuild-360",
    version: "1.3.0" // 이미지 업로드 API 추가됨
  });
});

// AI Chatbot endpoint - OpenAI GPT-4o-mini
app.post("/make-server-66444bd0/chat", async (c) => {
  console.log("Chat endpoint called");
  console.log("Headers:", Object.fromEntries(c.req.raw.headers.entries()));
  
  try {
    const body = await c.req.json();
    const { messages } = body;

    console.log("Received messages:", messages);

    if (!messages || !Array.isArray(messages)) {
      return c.json({ error: "Invalid request: messages array required" }, 400);
    }

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      console.error("OPENAI_API_KEY not found in environment");
      return c.json({ error: "API key not configured" }, 500);
    }

    console.log("OpenAI API key found (first 10 chars):", openaiApiKey.substring(0, 10));

    // System prompt for 성남시 개발 톡톡 chatbot
    const systemPrompt = `당신은 "성남시 개발 톡톡" AI 챗봇입니다. 성남시 분당구 재건축 정보 포털의 전문 상담원으로서, 다음 6개 단지를 담당합니다:
- 시범단지2
- 샛별마을
- 목련마을1
- 양지마을
- 장안타운4
- 느티마을3

**핵심 역할:**
- 재건축 일정, 분담금, 진행 상황 안내
- 학군, 주차, 교통 (8호선 연장 등) 정보 제공
- 10·15 부동산 대책 영향 설명
- 이주비 대출, 세금 등 기본 절차 안내

**답변 원칙:**
- 친절하고 이해하기 쉽게 설명
- 정확한 정보 위주, 불확실한 내용은 "공식 발표 확인 필요" 명시
- 재건축 관련 질문이 아니면 정중히 거절하고 시민광장 이용 안내
- 법률/세금 자문은 전문가 상담 권유

질문이 재건축 관련이 아니라면: "죄송합니다. 저는 분당구 재건축 전문 챗봇입니다. 재건축 관련 질문을 해주시거나 시민광장에서 질문을 남겨주세요."`;

    console.log("Calling OpenAI API...");

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    console.log("OpenAI response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      return c.json({ 
        error: "AI service error", 
        details: errorData 
      }, response.status);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    console.log("OpenAI response received, message length:", assistantMessage.length);

    return c.json({ 
      message: assistantMessage,
      model: "gpt-4o-mini",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Chat endpoint error:", error);
    return c.json({ 
      error: "Internal server error", 
      message: getErrorMessage(error) 
    }, 500);
  }
});

// 회원가입 API - 단지별 회원 정보 저장
app.post("/make-server-66444bd0/members/register", async (c) => {
  console.log("Member registration endpoint called");
  
  try {
    const body = await c.req.json();
    const { name, phone, address, complexId, password } = body;

    console.log("Received registration data:", { name, phone, address, complexId, password: "***" });

    // 입력 데이터 검증
    if (!name || !phone || !address || !complexId || !password) {
      return c.json({ error: "필수 정보가 누락되었습니다." }, 400);
    }

    // 중복 휴대폰 번호 확인
    const existingMembers = await kvGetByPrefix("members:");
    const phoneExists = existingMembers.some(member => member.phone === phone);
    
    if (phoneExists) {
      return c.json({ error: "이미 가입된 휴대폰 번호입니다." }, 400);
    }

    // 회원 데이터 생성
    const memberId = `member_${Date.now()}`;
    const memberData = {
      id: memberId,
      name,
      phone,
      address,
      complexId,
      password, // 비밀번호 저장 (실제 운영 시 해시 처리 필요)
      joinedDate: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      verified: true,
      createdAt: new Date().toISOString()
    };

    // KV store에 저장 (key: members:{complexId}:{memberId})
    const key = `members:${complexId}:${memberId}`;
    await kvSet(key, memberData);

    console.log(`Member registered successfully: ${key}`);

    return c.json({ 
      success: true,
      memberId: memberId,
      message: "원가입이 완료되었습니다."
    });

  } catch (error) {
    console.error("Member registration error:", error);
    return c.json({ 
      error: "회원가입 중 오류가 발생했습니다.", 
      message: getErrorMessage(error) 
    }, 500);
  }
});

// 로그인 API - 휴대폰 번호와 비밀번호로 인증
app.post("/make-server-66444bd0/members/login", async (c) => {
  console.log("Member login endpoint called");
  
  try {
    const body = await c.req.json();
    const { phone, password } = body;

    console.log("Received login data:", { phone, password: "***" });

    // 입력 데이터 검증
    if (!phone || !password) {
      return c.json({ error: "휴대폰 번호와 비밀번호를 입력해주세요." }, 400);
    }

    // 모든 회원 조회
    const allMembers = await kvGetByPrefix("members:");
    
    // 휴대폰 번호로 회원 찾기
    const member = allMembers.find(m => m.phone === phone);
    
    if (!member) {
      return c.json({ error: "가입되지 않은 휴대폰 번호입니다." }, 401);
    }

    // 비밀번호 확인
    if (member.password !== password) {
      return c.json({ error: "비밀번호가 일치하지 않습니다." }, 401);
    }

    console.log(`Member logged in successfully: ${member.id}`);

    // 비밀번호 제외하고 반환
    const { password: _, ...memberWithoutPassword } = member;

    return c.json({ 
      success: true,
      member: memberWithoutPassword,
      message: "로그인되었습니다."
    });

  } catch (error) {
    console.error("Member login error:", error);
    return c.json({ 
      error: "로그인 중 오류가 발생했습니다.", 
      message: getErrorMessage(error) 
    }, 500);
  }
});

// 회원 목록 조회 API - 모든 단지 또는 특정 단지 회원 조회
app.get("/make-server-66444bd0/members", async (c) => {
  console.log("Members list endpoint called");
  
  try {
    const complexId = c.req.query("complexId");
    
    let prefix = "members:";
    if (complexId) {
      prefix = `members:${complexId}:`;
      console.log(`Fetching members for complex: ${complexId}`);
    } else {
      console.log("Fetching all members");
    }

    // KV store에서 prefix로 검색
    const members = await kvGetByPrefix(prefix);

    console.log(`Found ${members.length} members`);

    return c.json({ 
      success: true,
      members,
      count: members.length
    });

  } catch (error) {
    console.error("Members list error:", error);
    return c.json({ 
      error: "회원 목록 조회 중 오류가 발생했습니다.", 
      message: getErrorMessage(error) 
    }, 500);
  }
});

// 특정 회원 삭제 API (관리자용)
app.delete("/make-server-66444bd0/members/:complexId/:memberId", async (c) => {
  console.log("Member deletion endpoint called");

  try {
    const complexId = c.req.param("complexId");
    const memberId = c.req.param("memberId");

    const key = `members:${complexId}:${memberId}`;
    await kvDel(key);

    console.log(`Member deleted: ${key}`);

    return c.json({
      success: true,
      message: "회원이 삭제되었습니다."
    });

  } catch (error) {
    console.error("Member deletion error:", error);
    return c.json({
      error: "회원 삭제 중 오류가 발생했습니다.",
      message: getErrorMessage(error)
    }, 500);
  }
});

// ========================================
// Image Storage API
// ========================================

// 버킷 초기화 함수
const initializeImageBucket = async () => {
  try {
    const supabase = kvClient();
    const bucketName = "make-66444bd0-images";

    // 버킷 목록 조회
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);

    if (!bucketExists) {
      // 버킷 생성 (private)
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 5242880, // 5MB
      });

      if (error) {
        console.error("버킷 생성 실패:", error);
      } else {
        console.log(`✅ Storage 버킷 생성됨: ${bucketName}`);
      }
    } else {
      console.log(`✅ Storage 버킷 이미 존재: ${bucketName}`);
    }
  } catch (error) {
    console.error("버킷 초기화 오류:", error);
  }
};

// 서버 시작 시 버킷 초기화
initializeImageBucket();

// POST /images/upload - 이미지 업로드
app.post("/make-server-66444bd0/images/upload", async (c) => {
  console.log("POST /images/upload called");

  try {
    const body = await c.req.json();
    const { complex_id, image_type, image_data } = body;

    if (!complex_id || !image_type || !image_data) {
      return c.json({ error: "complex_id, image_type, image_data are required" }, 400);
    }

    if (!['aerial', 'layout', 'district'].includes(image_type)) {
      return c.json({ error: "image_type must be 'aerial', 'layout', or 'district'" }, 400);
    }

    // Base64 데이터에서 파일 타입 추출
    const matches = image_data.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      return c.json({ error: "Invalid image_data format" }, 400);
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    // 파일 확장자 결정
    const extension = mimeType === 'application/pdf' ? 'pdf' :
                     mimeType === 'image/png' ? 'png' : 'jpg';

    // Base64를 Uint8Array로 변환
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const supabase = kvClient();
    const bucketName = "make-66444bd0-images";
    const filePath = `${complex_id}/${image_type}.${extension}`;

    // 기존 파일 삭제 (있다면)
    try {
      await supabase.storage.from(bucketName).remove([filePath]);
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
      return c.json({ error: "파일 업로드 실패", details: uploadError }, 500);
    }

    // Signed URL 생성 (1년 유효)
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 31536000); // 1년

    if (urlError) {
      console.error("Signed URL error:", urlError);
      return c.json({ error: "URL 생성 실패", details: urlError }, 500);
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

    console.log(`✅ 이미지 업로드 완료: ${filePath}`);

    return c.json({
      success: true,
      data: {
        complex_id,
        image_type,
        signed_url: signedUrlData.signedUrl,
      }
    });

  } catch (error: any) {
    console.error("Image upload error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// GET /images/:complexId - 특정 단지의 모든 이미지 URL 조회
app.get("/make-server-66444bd0/images/:complexId", async (c) => {
  console.log("GET /images/:complexId called");

  try {
    const complex_id = c.req.param("complexId");

    // KV store에서 이미지 메타데이터 조회
    const imageTypes = ['aerial', 'layout', 'district'];
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
      images
    });

  } catch (error: any) {
    console.error("Image fetch error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// DELETE /images/:complexId/:imageType - 이미지 삭제
app.delete("/make-server-66444bd0/images/:complexId/:imageType", async (c) => {
  console.log("DELETE /images/:complexId/:imageType called");

  try {
    const complex_id = c.req.param("complexId");
    const image_type = c.req.param("imageType");

    if (!['aerial', 'layout', 'district'].includes(image_type)) {
      return c.json({ error: "image_type must be 'aerial', 'layout', or 'district'" }, 400);
    }

    // KV store에서 메타데이터 조회
    const key = `image:${complex_id}:${image_type}`;
    const metaData = await kvGet(key);

    if (!metaData) {
      return c.json({ error: "이미지를 찾을 수 없습니다" }, 404);
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
      image_type
    });

  } catch (error: any) {
    console.error("Image delete error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// 🔍 DEBUG: Catch-all route to see what path is being received
app.all("*", (c) => {
  const url = new URL(c.req.url);
  console.log("🔍 DEBUG - Catch-all route triggered");
  console.log("   Full URL:", c.req.url);
  console.log("   Pathname:", url.pathname);
  console.log("   Method:", c.req.method);
  
  return c.json({ 
    error: "Route not found",
    debug: {
      url: c.req.url,
      pathname: url.pathname,
      method: c.req.method,
      message: "This is a debug response. The route was not matched."
    }
  }, 404);
});

console.log("🚀 Bundang Server starting...");
Deno.serve(app.fetch);