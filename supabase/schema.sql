-- Supabase 대시보드 → SQL Editor 에 붙여넣고 Run
-- 여러 번 실행해도 안전합니다 (이미 있으면 건너뜀 / 정책은 지우고 다시 만듦)

-- 담아 둔 곳 (주변 명소·국가유산)
create table if not exists favorites (
  id bigint generated always as identity primary key,
  nickname text not null,
  source text not null,        -- 'tour' | 'heritage'
  item_id text not null,
  title text not null,
  created_at timestamptz default now()
);

-- 신화 도감 (방문 기록): 닉네임마다 장소별 1건
create table if not exists discoveries (
  id bigint generated always as identity primary key,
  nickname text not null,
  myth_id text not null,
  created_at timestamptz default now(),
  unique (nickname, myth_id)
);

-- 에이전트 대화 기록: 닉네임별로 질문·답변·호출한 도구 목록을 저장
create table if not exists chat_messages (
  id bigint generated always as identity primary key,
  nickname text not null,
  role text not null check (role in ('user', 'assistant')),
  text text not null,
  steps jsonb,                 -- 답변에 쓴 도구 호출 내역 [{ tool, args, count, error }]
  created_at timestamptz default now()
);
create index if not exists chat_messages_nickname_id on chat_messages (nickname, id);

alter table favorites enable row level security;
alter table discoveries enable row level security;
alter table chat_messages enable row level security;

drop policy if exists "favorites read"   on favorites;
drop policy if exists "favorites insert" on favorites;
drop policy if exists "favorites delete" on favorites;
create policy "favorites read"   on favorites   for select using (true);
create policy "favorites insert" on favorites   for insert with check (true);
create policy "favorites delete" on favorites   for delete using (true);

drop policy if exists "discoveries read"   on discoveries;
drop policy if exists "discoveries insert" on discoveries;
drop policy if exists "discoveries update" on discoveries;
create policy "discoveries read"   on discoveries for select using (true);
create policy "discoveries insert" on discoveries for insert with check (true);
create policy "discoveries update" on discoveries for update using (true);

drop policy if exists "chat read"   on chat_messages;
drop policy if exists "chat insert" on chat_messages;
drop policy if exists "chat delete" on chat_messages;
create policy "chat read"   on chat_messages for select using (true);
create policy "chat insert" on chat_messages for insert with check (true);
create policy "chat delete" on chat_messages for delete using (true);
