-- ENUMS
create type worker_type as enum ('guard', 'staffer');
create type post_type as enum ('security', 'staffing');
create type shift_status as enum ('open', 'filled', 'no_show');
create type assignment_status as enum ('pending', 'confirmed', 'declined', 'no_show');
create type show_status as enum ('draft', 'active', 'closed');
create type availability_type as enum ('standing', 'per_show');
create type split_strategy as enum ('equal_thirds', 'equal_halves', 'single', 'manual');

-- WORKERS
create table workers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text unique not null,
  phone text,
  worker_type worker_type not null,
  is_supervisor boolean not null default false,
  is_active boolean not null default true,

  -- CRM / HR fields
  ssn text,
  birth_date date,
  start_date date,
  position text,
  rating text,
  transportation text,

  -- Licensing (JSONB: { active_license: boolean, number?: string, exp?: string })
  d_license jsonb,     -- driver's license / blue card
  g_license jsonb,     -- guard license
  ccw jsonb,           -- concealed carry permit

  -- Equipment (JSONB)
  -- uniform: { polo?: { has_issued: boolean, size?: string, qty?: number }, jacket?: { has_issued: boolean, size?: string } }
  uniform jsonb,
  -- badge: { has_issued: boolean, barcode?: string }
  badge jsonb,

  -- Preferences / contacts (JSONB)
  -- shift_pref: { start_time?: number, end_time?: number }
  shift_pref jsonb,
  -- emergency_contact: { name?: string, phone?: string, relation?: string }
  emergency_contact jsonb,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- SHOWS
create table shows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client_name text not null,
  venue text not null,
  start_date date not null,
  end_date date not null,
  status show_status not null default 'draft',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- HALLS
create table halls (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references shows(id) on delete cascade,
  name text not null,
  floor_level text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- POSTS
create table posts (
  id uuid primary key default gen_random_uuid(),
  hall_id uuid not null references halls(id) on delete cascade,
  name text not null,
  post_type post_type not null default 'security',
  date date not null,
  start_time time not null,
  end_time time not null,
  headcount_required int not null default 1,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- SHIFTS
create table shifts (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  split_strategy split_strategy not null default 'single',
  status shift_status not null default 'open',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ASSIGNMENTS
create table assignments (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references shifts(id) on delete cascade,
  worker_id uuid not null references workers(id),
  status assignment_status not null default 'pending',
  early_release_time time,
  acknowledged_at timestamptz,
  override_reason text,
  override_by uuid references workers(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(shift_id, worker_id)
);

-- AVAILABILITY TOKENS (for webform + ack links)
create table availability_tokens (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references workers(id),
  show_id uuid references shows(id),
  token uuid not null default gen_random_uuid(),
  token_type text not null default 'availability', -- 'availability' | 'acknowledgment'
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz default now()
);

-- AVAILABILITY
create table availability (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references workers(id),
  availability_type availability_type not null,
  show_id uuid references shows(id),
  day_of_week int check (day_of_week between 0 and 6), -- 0=Sun, for standing
  date date,                                             -- for per_show
  start_time time not null,
  end_time time not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint availability_scope check (
    (availability_type = 'standing' and day_of_week is not null and date is null) or
    (availability_type = 'per_show' and show_id is not null and date is not null)
  )
);

-- OVERTIME FLAGS
create table overtime_flags (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references workers(id),
  show_id uuid references shows(id),
  week_start date not null,
  total_hours numeric(5,2) not null,
  resolved_by uuid references workers(id),
  resolved_at timestamptz,
  created_at timestamptz default now()
);

-- updated_at trigger function
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply trigger to all tables with updated_at
create trigger set_updated_at before update on workers for each row execute function set_updated_at();
create trigger set_updated_at before update on shows for each row execute function set_updated_at();
create trigger set_updated_at before update on halls for each row execute function set_updated_at();
create trigger set_updated_at before update on posts for each row execute function set_updated_at();
create trigger set_updated_at before update on shifts for each row execute function set_updated_at();
create trigger set_updated_at before update on assignments for each row execute function set_updated_at();
create trigger set_updated_at before update on availability for each row execute function set_updated_at();
