-- メニューデータの挿入
INSERT INTO menu_items (name, description, duration, price, image_url) VALUES
('シンプルレジンアート', '石垣島の美しい海をイメージしたレジンアートで、世界に一つだけのアートボードを作りましょう。初めての方でも安心して体験できます。', 90, 6000, NULL),
('フォトレジンアート', '大切な思い出の写真をレジンアートに閉じ込めて、特別な作品を作りましょう。カップルや友達同士、家族同士で人気のプランです。', 90, 7000, NULL),
('オリジナルコースター', '沖縄の海をイメージしたオリジナルコースターを作ります。お部屋のアクセントやお土産にぴったりです。', 60, 4000, NULL),
('ビーチグラス作品', '石垣島のビーチで集めたビーチグラスを使って、世界に一つだけのアート作品を作ります。', 120, 8000, NULL);

-- サンプルの時間枠データ
INSERT INTO time_slots (start_time, end_time, capacity) VALUES
('10:00', '11:30', 4),
('13:00', '14:30', 4),
('15:00', '16:30', 4);