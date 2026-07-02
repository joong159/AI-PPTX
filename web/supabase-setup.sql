-- Run this in your Supabase project's SQL editor
-- Go to: https://supabase.com/dashboard → your project → SQL Editor

create table if not exists presentations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default '새 프레젠테이션',
  theme text not null default 'modern',
  accent_color text,
  slides jsonb not null default '[]',
  design jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table presentations enable row level security;

-- Users can only access their own presentations
create policy "Users manage own presentations"
  on presentations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-update updated_at on change
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger presentations_updated_at
  before update on presentations
  for each row execute function update_updated_at();
