-- Vibe Computer Store starter catalog
-- Run after schema.sql.

INSERT INTO products (name, category, description, price, stock, image) VALUES
  ('Dahua 4K IP Speed Dome PTZ', 'cctv', '25x Optical Zoom, Starlight Night Vision, Smart AI Human Detection & Auto-Tracking.', 0, 10, 'assets/images/cctv-bg.jpg'),
  ('Dahua Pro 16-Channel 4K NVR', 'cctv', 'Supports up to 16 IP cameras with centralized storage.', 0, 8, 'assets/images/server.jpg'),
  ('24-Port Gigabit Managed Switch', 'network', 'PoE+ ports, SFP optical ports, VLAN support, and managed control.', 0, 15, 'assets/images/network.jpg'),
  ('AX3000 Dual-Band Wi-Fi 6 AP', 'network', 'High-capacity wireless access point with PoE power.', 0, 12, 'assets/images/network.jpg'),
  ('Dell OptiPlex Tower Workstation', 'computing', 'Intel Core i7, 16GB RAM, 512GB NVMe SSD, Windows 11 Pro.', 0, 6, 'assets/images/image.jpg'),
  ('HP ProBook 15.6 Full HD', 'computing', 'Intel Core i5, 16GB RAM, 512GB SSD, and backlit keyboard.', 0, 5, 'assets/images/image.jpg'),
  ('Genuine Windows 11 Pro License', 'accessories', 'Original Microsoft activation key with lifetime updates.', 0, 25, 'assets/images/image.jpg'),
  ('Cat6 Pure Copper UTP Cable Box', 'accessories', '305m gigabit-certified network cable box.', 0, 20, 'assets/images/network.jpg')
ON CONFLICT DO NOTHING;
