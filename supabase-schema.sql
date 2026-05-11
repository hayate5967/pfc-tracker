-- 食べ物マスタ
create table foods (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  protein_per100g  float not null,
  fat_per100g      float not null,
  carb_per100g     float not null,
  calorie_per100g  float not null,
  weight_mode      text check (weight_mode in ('fixed', 'options')),
  fixed_weight     float,
  weight_options   float[],
  created_at  timestamptz default now()
);

-- 食べ物の登録画像（ML用）
create table food_images (
  id         uuid primary key default gen_random_uuid(),
  food_id    uuid references foods on delete cascade,
  image_url  text not null,
  embedding  float[] not null,
  created_at timestamptz default now()
);

-- 食事ログ
create table meal_logs (
  id         uuid primary key default gen_random_uuid(),
  food_id    uuid references foods,
  weight_g   float not null,
  protein_g  float not null,
  fat_g      float not null,
  carb_g     float not null,
  calories   float not null,
  logged_at  timestamptz default now()
);

-- 目標設定（1行のみ）
create table user_goals (
  id               uuid primary key default gen_random_uuid(),
  target_calories  float,
  target_protein_g float,
  target_fat_g     float,
  target_carb_g    float,
  updated_at       timestamptz default now()
);

-- RLS無効化（単一ユーザー用）
alter table foods disable row level security;
alter table food_images disable row level security;
alter table meal_logs disable row level security;
alter table user_goals disable row level security;

-- Storageバケット作成（Supabase UIで行うか、以下を実行）
-- insert into storage.buckets (id, name, public) values ('food-images', 'food-images', true);
