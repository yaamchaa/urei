-- 진행율 관리 테이블 생성
CREATE TABLE IF NOT EXISTS complex_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  complex_id TEXT NOT NULL UNIQUE,
  progress INTEGER NOT NULL CHECK (progress >= 0 AND progress <= 100),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_complex_progress_complex_id ON complex_progress(complex_id);

-- RLS (Row Level Security) 활성화
ALTER TABLE complex_progress ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있도록 정책 생성
CREATE POLICY "Anyone can read progress" ON complex_progress
  FOR SELECT
  USING (true);

-- 인증된 사용자만 수정 가능하도록 정책 생성 (추후 관리자 권한으로 변경 가능)
CREATE POLICY "Authenticated users can insert progress" ON complex_progress
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update progress" ON complex_progress
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- 초기 데이터 삽입 (예시)
INSERT INTO complex_progress (complex_id, progress) VALUES
  ('sibeom2', 60),
  ('saetbyeol', 55),
  ('mongnyeon1', 50),
  ('yangji', 45),
  ('jangan4', 40),
  ('neuti3', 35)
ON CONFLICT (complex_id) DO NOTHING;
