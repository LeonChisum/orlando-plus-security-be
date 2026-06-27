-- Add resolution fields to overtime_flags
alter table overtime_flags
  add column if not exists resolution_note text,
  add column if not exists resolved_by_name text;
