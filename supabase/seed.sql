-- ═══════════════════════════════════════════════════════════════════════════════
-- OPS Scheduler — Seed Data
-- Show: Europa 2025 (Orange County Convention Center, Sept 5–7 2025)
-- Load via: supabase db reset
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─── Workers (12 total: 9 guards, 3 staffers) ────────────────────────────────

insert into workers (id, first_name, last_name, email, phone, worker_type, is_supervisor, is_active,
                     start_date, position, d_license, g_license, badge, shift_pref, emergency_contact)
values

-- Guards -----------------------------------------------------------------------
('11000000-0000-0000-0000-000000000001', 'James',   'Carter',   'j.carter@ops.com',   '407-555-0101', 'guard',   true,  true,
 '2018-03-15', 'Lead Supervisor',
 '{"blue_card": true, "number": "DL-88821", "exp": "2026-12-01"}'::jsonb,
 '{"active_license": true, "number": "G-44512", "exp": "2026-08-01"}'::jsonb,
 '{"has_issued": true, "barcode": "OPS-001"}'::jsonb,
 '{"start_time": 6, "end_time": 20}'::jsonb,
 '{"name": "Linda Carter", "phone": "407-555-0199", "relation": "Spouse"}'::jsonb),

('11000000-0000-0000-0000-000000000002', 'Marcus',  'Williams', 'm.williams@ops.com', '407-555-0102', 'guard',   false, true,
 '2020-01-10', 'Guard',
 '{"blue_card": true, "number": "DL-77432", "exp": "2025-11-15"}'::jsonb,
 '{"active_license": true, "number": "G-55231", "exp": "2025-09-30"}'::jsonb,
 '{"has_issued": true, "barcode": "OPS-002"}'::jsonb,
 '{"start_time": 6, "end_time": 18}'::jsonb,
 '{"name": "Denise Williams", "phone": "407-555-0299", "relation": "Mother"}'::jsonb),

('11000000-0000-0000-0000-000000000003', 'Darius',  'Thompson', 'd.thompson@ops.com', '407-555-0103', 'guard',   false, true,
 '2021-05-20', 'Guard',
 '{"blue_card": true}'::jsonb,
 '{"active_license": true, "number": "G-60911", "exp": "2026-04-01"}'::jsonb,
 '{"has_issued": true, "barcode": "OPS-003"}'::jsonb,
 '{"start_time": 7, "end_time": 19}'::jsonb,
 '{"name": "Keisha Thompson", "phone": "407-555-0399", "relation": "Sister"}'::jsonb),

('11000000-0000-0000-0000-000000000004', 'Jerome',  'Robinson', 'j.robinson@ops.com', '407-555-0104', 'guard',   false, true,
 '2019-08-01', 'Guard',
 '{"blue_card": false}'::jsonb,
 '{"active_license": true, "number": "G-71823", "exp": "2025-12-01"}'::jsonb,
 '{"has_issued": true, "barcode": "OPS-004"}'::jsonb,
 '{"start_time": 7, "end_time": 15}'::jsonb,
 null),

('11000000-0000-0000-0000-000000000005', 'Antoine', 'Davis',    'a.davis@ops.com',    '407-555-0105', 'guard',   false, true,
 '2022-02-14', 'Guard',
 '{"blue_card": true, "number": "DL-55109", "exp": "2027-01-01"}'::jsonb,
 '{"active_license": false}'::jsonb,
 '{"has_issued": true, "barcode": "OPS-005"}'::jsonb,
 '{"start_time": 6, "end_time": 14}'::jsonb,
 '{"name": "Tamara Davis", "phone": "407-555-0599", "relation": "Spouse"}'::jsonb),

('11000000-0000-0000-0000-000000000006', 'Kevin',   'Harris',   'k.harris@ops.com',   '407-555-0106', 'guard',   false, true,
 '2020-09-30', 'Guard',
 '{"blue_card": true, "number": "DL-66234", "exp": "2026-06-15"}'::jsonb,
 '{"active_license": true, "number": "G-80127", "exp": "2026-03-01"}'::jsonb,
 '{"has_issued": true, "barcode": "OPS-006"}'::jsonb,
 '{"start_time": 5, "end_time": 14}'::jsonb,
 null),

('11000000-0000-0000-0000-000000000007', 'Tyrone',  'Jackson',  't.jackson@ops.com',  '407-555-0107', 'guard',   false, true,
 '2023-01-05', 'Guard',
 '{"blue_card": false}'::jsonb,
 '{"active_license": true, "number": "G-92044", "exp": "2025-10-01"}'::jsonb,
 '{"has_issued": false}'::jsonb,
 '{"start_time": 8, "end_time": 20}'::jsonb,
 '{"name": "Patricia Jackson", "phone": "407-555-0799", "relation": "Mother"}'::jsonb),

('11000000-0000-0000-0000-000000000008', 'Brandon', 'Lewis',    'b.lewis@ops.com',    '407-555-0108', 'guard',   false, true,
 '2021-11-22', 'Guard',
 '{"blue_card": true, "number": "DL-44891", "exp": "2026-09-01"}'::jsonb,
 '{"active_license": true, "number": "G-33567", "exp": "2026-01-15"}'::jsonb,
 '{"has_issued": true, "barcode": "OPS-008"}'::jsonb,
 '{"start_time": 14, "end_time": 23}'::jsonb,
 null),

-- Guard — inactive (terminated)
('11000000-0000-0000-0000-000000000009', 'Raymond', 'Foster',   'r.foster@ops.com',   '407-555-0109', 'guard',   false, false,
 '2017-06-10', 'Guard',
 '{"blue_card": true}'::jsonb,
 '{"active_license": false}'::jsonb,
 '{"has_issued": false}'::jsonb,
 null, null),

-- Staffers ---------------------------------------------------------------------
('11000000-0000-0000-0000-000000000010', 'Maria',   'Gonzalez', 'm.gonzalez@ops.com', '407-555-0110', 'staffer', false, true,
 '2022-07-18', 'Staffer',
 null, null,
 '{"has_issued": true, "barcode": "OPS-010"}'::jsonb,
 '{"start_time": 8, "end_time": 17}'::jsonb,
 '{"name": "Carlos Gonzalez", "phone": "407-555-1099", "relation": "Brother"}'::jsonb),

('11000000-0000-0000-0000-000000000011', 'Ashley',  'Chen',     'a.chen@ops.com',     '407-555-0111', 'staffer', false, true,
 '2023-03-01', 'Staffer',
 null, null,
 '{"has_issued": true, "barcode": "OPS-011"}'::jsonb,
 '{"start_time": 8, "end_time": 16}'::jsonb,
 null),

('11000000-0000-0000-0000-000000000012', 'Priya',   'Patel',    'p.patel@ops.com',    '407-555-0112', 'staffer', false, true,
 '2024-01-15', 'Staffer',
 null, null,
 '{"has_issued": false}'::jsonb,
 '{"start_time": 9, "end_time": 17}'::jsonb,
 '{"name": "Raj Patel", "phone": "407-555-1299", "relation": "Father"}'::jsonb);


-- ─── Show ─────────────────────────────────────────────────────────────────────

insert into shows (id, name, client_name, venue, start_date, end_date, status, notes)
values (
  '22000000-0000-0000-0000-000000000001',
  'Europa 2025',
  'Europa Events LLC',
  'Orange County Convention Center',
  '2025-09-05',
  '2025-09-07',
  'active',
  'Annual European trade showcase. Security priority: Hall A entrances and Loading Dock.'
);


-- ─── Halls ────────────────────────────────────────────────────────────────────

insert into halls (id, show_id, name, floor_level)
values
  ('33000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000001', 'Hall A',                    'Level 1'),
  ('33000000-0000-0000-0000-000000000002', '22000000-0000-0000-0000-000000000001', 'Hall B',                    'Level 1'),
  ('33000000-0000-0000-0000-000000000003', '22000000-0000-0000-0000-000000000001', 'Loading Dock',              'Ground'),
  ('33000000-0000-0000-0000-000000000004', '22000000-0000-0000-0000-000000000001', 'Registration / Main Lobby', 'Level 1');


-- ─── Posts ────────────────────────────────────────────────────────────────────
-- 8 posts spread across all 3 show days with a security/staffing mix.
-- Split rule applied per post duration (see shifts section for result):
--   ≥ 18 h → equal_thirds   |   8–17 h → equal_halves   |   < 8 h → single

insert into posts (id, hall_id, name, post_type, date, start_time, end_time, headcount_required, notes)
values

-- Hall A — Sept 5 (security, 12 h each → equal_halves)
('44000000-0000-0000-0000-000000000001', '33000000-0000-0000-0000-000000000001', 'Hall A Main Entrance', 'security', '2025-09-05', '06:00', '18:00', 1, 'Primary public entrance — two access lanes'),
('44000000-0000-0000-0000-000000000002', '33000000-0000-0000-0000-000000000001', 'Hall A Floor Patrol',  'security', '2025-09-05', '07:00', '19:00', 1, 'Roving patrol; coordinate with Main Entrance'),

-- Hall B — Sept 6 (security, 12 h each → equal_halves)
('44000000-0000-0000-0000-000000000003', '33000000-0000-0000-0000-000000000002', 'Hall B Entrance',      'security', '2025-09-06', '07:00', '19:00', 1, null),
('44000000-0000-0000-0000-000000000004', '33000000-0000-0000-0000-000000000002', 'Hall B Exhibit Floor', 'security', '2025-09-06', '08:00', '20:00', 1, 'Exhibitor access control 08:00–10:00'),

-- Loading Dock — Sept 5 North (18 h → equal_thirds), Sept 7 South (12 h → equal_halves)
('44000000-0000-0000-0000-000000000005', '33000000-0000-0000-0000-000000000003', 'North Gate',           'security', '2025-09-05', '05:00', '23:00', 1, 'Freight access opens at 05:00; last truck out by 23:00'),
('44000000-0000-0000-0000-000000000006', '33000000-0000-0000-0000-000000000003', 'South Gate',           'security', '2025-09-07', '06:00', '18:00', 1, 'Breakdown / load-out day'),

-- Registration / Main Lobby (staffing)
-- Sept 5 Registration Desk (8 h → equal_halves), Sept 6 VIP Entrance (5 h → single)
('44000000-0000-0000-0000-000000000007', '33000000-0000-0000-0000-000000000004', 'Registration Desk',    'staffing', '2025-09-05', '08:00', '16:00', 1, 'Attendee badge check-in'),
('44000000-0000-0000-0000-000000000008', '33000000-0000-0000-0000-000000000004', 'VIP Entrance',         'staffing', '2025-09-06', '10:00', '15:00', 1, 'Credential check for VIP / press');


-- ─── Shifts ───────────────────────────────────────────────────────────────────

insert into shifts (id, post_id, date, start_time, end_time, split_strategy, status)
values

-- Post 1: Hall A Main Entrance  12 h → equal_halves  (2 shifts)
('55000000-0000-0000-0000-000000000001', '44000000-0000-0000-0000-000000000001', '2025-09-05', '06:00', '12:00', 'equal_halves', 'filled'),
('55000000-0000-0000-0000-000000000002', '44000000-0000-0000-0000-000000000001', '2025-09-05', '12:00', '18:00', 'equal_halves', 'filled'),

-- Post 2: Hall A Floor Patrol   12 h → equal_halves  (2 shifts)
('55000000-0000-0000-0000-000000000003', '44000000-0000-0000-0000-000000000002', '2025-09-05', '07:00', '13:00', 'equal_halves', 'filled'),
('55000000-0000-0000-0000-000000000004', '44000000-0000-0000-0000-000000000002', '2025-09-05', '13:00', '19:00', 'equal_halves', 'filled'),

-- Post 3: Hall B Entrance       12 h → equal_halves  (2 shifts)
('55000000-0000-0000-0000-000000000005', '44000000-0000-0000-0000-000000000003', '2025-09-06', '07:00', '13:00', 'equal_halves', 'filled'),
('55000000-0000-0000-0000-000000000006', '44000000-0000-0000-0000-000000000003', '2025-09-06', '13:00', '19:00', 'equal_halves', 'filled'),

-- Post 4: Hall B Exhibit Floor  12 h → equal_halves  (2 shifts)
('55000000-0000-0000-0000-000000000007', '44000000-0000-0000-0000-000000000004', '2025-09-06', '08:00', '14:00', 'equal_halves', 'filled'),
('55000000-0000-0000-0000-000000000008', '44000000-0000-0000-0000-000000000004', '2025-09-06', '14:00', '20:00', 'equal_halves', 'filled'),

-- Post 5: North Gate            18 h → equal_thirds  (3 shifts, middle is no_show)
('55000000-0000-0000-0000-000000000009', '44000000-0000-0000-0000-000000000005', '2025-09-05', '05:00', '11:00', 'equal_thirds', 'filled'),
('55000000-0000-0000-0000-000000000010', '44000000-0000-0000-0000-000000000005', '2025-09-05', '11:00', '17:00', 'equal_thirds', 'no_show'),
('55000000-0000-0000-0000-000000000011', '44000000-0000-0000-0000-000000000005', '2025-09-05', '17:00', '23:00', 'equal_thirds', 'filled'),

-- Post 6: South Gate            12 h → equal_halves  (2 shifts)
('55000000-0000-0000-0000-000000000012', '44000000-0000-0000-0000-000000000006', '2025-09-07', '06:00', '12:00', 'equal_halves', 'filled'),
('55000000-0000-0000-0000-000000000013', '44000000-0000-0000-0000-000000000006', '2025-09-07', '12:00', '18:00', 'equal_halves', 'filled'),

-- Post 7: Registration Desk      8 h → equal_halves  (2 shifts)
('55000000-0000-0000-0000-000000000014', '44000000-0000-0000-0000-000000000007', '2025-09-05', '08:00', '12:00', 'equal_halves', 'filled'),
('55000000-0000-0000-0000-000000000015', '44000000-0000-0000-0000-000000000007', '2025-09-05', '12:00', '16:00', 'equal_halves', 'filled'),

-- Post 8: VIP Entrance           5 h → single        (1 shift — intentionally left OPEN)
('55000000-0000-0000-0000-000000000016', '44000000-0000-0000-0000-000000000008', '2025-09-06', '10:00', '15:00', 'single',       'open');


-- ─── Assignments ──────────────────────────────────────────────────────────────
-- Shift 16 (VIP Entrance) is left open — no assignment row.
-- Shift 10 (North Gate mid) is no_show — Tyrone Jackson didn't report.
-- A few shifts are still pending acknowledgment.

insert into assignments (shift_id, worker_id, status, acknowledged_at)
values

-- Hall A Main Entrance
('55000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000002', 'confirmed', '2025-08-20 09:15:00+00'),  -- Marcus   06-12
('55000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000003', 'confirmed', '2025-08-21 10:30:00+00'),  -- Darius   12-18

-- Hall A Floor Patrol
('55000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000004', 'pending',   null),                      -- Jerome   07-13  (awaiting ack)
('55000000-0000-0000-0000-000000000004', '11000000-0000-0000-0000-000000000005', 'confirmed', '2025-08-22 08:00:00+00'),  -- Antoine  13-19

-- Hall B Entrance
('55000000-0000-0000-0000-000000000005', '11000000-0000-0000-0000-000000000001', 'confirmed', '2025-08-19 14:00:00+00'),  -- James    07-13
('55000000-0000-0000-0000-000000000006', '11000000-0000-0000-0000-000000000002', 'pending',   null),                      -- Marcus   13-19  (awaiting ack)

-- Hall B Exhibit Floor
('55000000-0000-0000-0000-000000000007', '11000000-0000-0000-0000-000000000003', 'confirmed', '2025-08-21 10:31:00+00'),  -- Darius   08-14
('55000000-0000-0000-0000-000000000008', '11000000-0000-0000-0000-000000000004', 'confirmed', '2025-08-23 09:00:00+00'),  -- Jerome   14-20

-- North Gate (Loading Dock, Sept 5)
('55000000-0000-0000-0000-000000000009', '11000000-0000-0000-0000-000000000006', 'confirmed', '2025-08-20 11:00:00+00'),  -- Kevin    05-11
('55000000-0000-0000-0000-000000000010', '11000000-0000-0000-0000-000000000007', 'no_show',   null),                      -- Tyrone   11-17  (no_show)
('55000000-0000-0000-0000-000000000011', '11000000-0000-0000-0000-000000000008', 'confirmed', '2025-08-20 11:02:00+00'),  -- Brandon  17-23

-- South Gate (Loading Dock, Sept 7)
('55000000-0000-0000-0000-000000000012', '11000000-0000-0000-0000-000000000005', 'confirmed', '2025-08-22 08:01:00+00'),  -- Antoine  06-12
('55000000-0000-0000-0000-000000000013', '11000000-0000-0000-0000-000000000006', 'confirmed', '2025-08-20 11:03:00+00'),  -- Kevin    12-18

-- Registration Desk (staffers on staffing post)
('55000000-0000-0000-0000-000000000014', '11000000-0000-0000-0000-000000000010', 'confirmed', '2025-08-24 09:00:00+00'),  -- Maria    08-12
('55000000-0000-0000-0000-000000000015', '11000000-0000-0000-0000-000000000011', 'confirmed', '2025-08-24 09:05:00+00'); -- Ashley   12-16


-- ─── Availability (4 guards, per_show, Europa 2025) ──────────────────────────

insert into availability (worker_id, availability_type, show_id, date, start_time, end_time)
values

-- James Carter (supervisor) — all 3 days
('11000000-0000-0000-0000-000000000001', 'per_show', '22000000-0000-0000-0000-000000000001', '2025-09-05', '06:00', '23:00'),
('11000000-0000-0000-0000-000000000001', 'per_show', '22000000-0000-0000-0000-000000000001', '2025-09-06', '06:00', '23:00'),
('11000000-0000-0000-0000-000000000001', 'per_show', '22000000-0000-0000-0000-000000000001', '2025-09-07', '06:00', '23:00'),

-- Marcus Williams — Sept 5 & 6
('11000000-0000-0000-0000-000000000002', 'per_show', '22000000-0000-0000-0000-000000000001', '2025-09-05', '06:00', '20:00'),
('11000000-0000-0000-0000-000000000002', 'per_show', '22000000-0000-0000-0000-000000000001', '2025-09-06', '06:00', '20:00'),

-- Darius Thompson — Sept 5 & 6
('11000000-0000-0000-0000-000000000003', 'per_show', '22000000-0000-0000-0000-000000000001', '2025-09-05', '07:00', '22:00'),
('11000000-0000-0000-0000-000000000003', 'per_show', '22000000-0000-0000-0000-000000000001', '2025-09-06', '07:00', '22:00'),

-- Antoine Davis — Sept 5 & 7
('11000000-0000-0000-0000-000000000005', 'per_show', '22000000-0000-0000-0000-000000000001', '2025-09-05', '06:00', '22:00'),
('11000000-0000-0000-0000-000000000005', 'per_show', '22000000-0000-0000-0000-000000000001', '2025-09-07', '06:00', '22:00');
