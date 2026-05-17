-- KV Store 테이블 생성
CREATE TABLE IF NOT EXISTS public.kv_store_66444bd0 (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) 비활성화 (서버에서만 접근)
ALTER TABLE public.kv_store_66444bd0 ENABLE ROW LEVEL SECURITY;

-- Service Role이 모든 작업을 할 수 있도록 정책 설정
CREATE POLICY "Service role can do everything"
  ON public.kv_store_66444bd0
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_kv_store_key_prefix 
  ON public.kv_store_66444bd0 
  USING btree (key text_pattern_ops);

-- Updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_kv_store_updated_at
  BEFORE UPDATE ON public.kv_store_66444bd0
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
