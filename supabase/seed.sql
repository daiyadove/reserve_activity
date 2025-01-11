-- Insert test time slots
INSERT INTO time_slots (start_time, end_time, capacity)
VALUES
    ('10:00:00', '11:00:00', 5),
    ('11:00:00', '12:00:00', 5),
    ('13:00:00', '14:00:00', 5),
    ('14:00:00', '15:00:00', 5),
    ('15:00:00', '16:00:00', 5);

-- Insert test customer
INSERT INTO customers (name, email, phone_number)
VALUES ('テスト 太郎', 'test@example.com', '090-1234-5678');

-- Insert test reservation
WITH customer AS (
  SELECT customer_id FROM customers WHERE email = 'test@example.com' LIMIT 1
),
slot AS (
  SELECT slot_id FROM time_slots WHERE start_time = '10:00:00' LIMIT 1
)
INSERT INTO reservations (
  customer_id,
  slot_id,
  reservation_date,
  number_of_people
)
SELECT 
  customer.customer_id,
  slot.slot_id,
  CURRENT_DATE,
  2
FROM customer, slot;

-- Insert test sold out setting
WITH slot AS (
  SELECT slot_id FROM time_slots WHERE start_time = '11:00:00' LIMIT 1
)
INSERT INTO sold_out_settings (
  slot_id,
  date
)
SELECT 
  slot.slot_id,
  CURRENT_DATE + interval '1 day'
FROM slot;