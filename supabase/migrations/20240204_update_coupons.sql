-- 既存のクーポンを無効化
UPDATE coupons SET is_active = false;

-- カラム名と型の変更
ALTER TABLE coupons 
  RENAME COLUMN discount_amount TO discount_percentage;

-- 既存のデータを1-100の範囲に収める（例：500円引き → 10%に変換）
UPDATE coupons 
SET discount_percentage = 
  CASE 
    WHEN discount_percentage > 100 THEN 10
    WHEN discount_percentage < 1 THEN 1
    ELSE discount_percentage
  END;

-- 制約の追加
ALTER TABLE coupons
  ADD CONSTRAINT discount_percentage_range 
  CHECK (discount_percentage BETWEEN 1 AND 100);
