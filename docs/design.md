# 設計書 — PFCカロリー記録アプリ

## 1. システム構成

```
ブラウザ（Next.js SPA）
  ├── UI層          shadcn/ui + Tailwind CSS
  ├── ページ層      App Router（全ページ 'use client'）
  ├── コンポーネント層  再利用可能UIコンポーネント
  ├── ロジック層    src/lib/（classifier / pfc / supabase）
  └── ML層          TF.js（MobileNet + COCO-SSD）※ブラウザ内完結

Supabase（BaaS）
  ├── PostgreSQL    foods / food_images / meal_logs / user_goals
  └── Storage       food-images バケット（公開）
```

### 技術スタック

| 役割 | 技術 | バージョン |
|------|------|-----------|
| フレームワーク | Next.js (App Router) | 16.2.6 |
| 言語 | TypeScript | 5.x |
| UIコンポーネント | shadcn/ui | 4.7.0 |
| CSSフレームワーク | Tailwind CSS | 4.x |
| BaaS | Supabase | 2.105.4 |
| ML基盤 | TensorFlow.js | 4.22.0 |
| 物体検出モデル | COCO-SSD | 2.2.3 |
| 特徴抽出モデル | MobileNet v2 | 2.1.1 |
| アイコン | Lucide React | 1.14.0 |
| トースト通知 | Sonner | 2.0.7 |
| ホスティング | Vercel | — |

---

## 2. ディレクトリ構成

```
pfc-tracker/
├── docs/
│   ├── spec.md            # 機能仕様書（本書）
│   └── design.md          # 設計書
├── src/
│   ├── app/               # Next.js App Router ページ
│   │   ├── layout.tsx     # ルートレイアウト（BottomNav + Toaster）
│   │   ├── page.tsx       # ダッシュボード
│   │   ├── log/page.tsx   # 食事記録
│   │   ├── foods/
│   │   │   ├── page.tsx       # 食べ物一覧
│   │   │   ├── new/page.tsx   # 食べ物登録
│   │   │   └── [id]/page.tsx  # 食べ物編集
│   │   ├── goals/page.tsx # 目標設定
│   │   └── history/page.tsx # 食事履歴
│   ├── components/
│   │   ├── BottomNav.tsx        # 下部ナビゲーション
│   │   ├── CameraCapture.tsx    # カメラ起動・撮影・プレビュー
│   │   ├── ClassifierResult.tsx # 検出結果1件表示
│   │   ├── FoodCard.tsx         # 食べ物カード（一覧用）
│   │   ├── MealLogItem.tsx      # 食事ログ1件表示
│   │   ├── PFCProgressBar.tsx   # PFC進捗バー
│   │   ├── WeightSelector.tsx   # 重さ選択UI
│   │   └── ui/                  # shadcn/ui 生成コンポーネント
│   ├── lib/
│   │   ├── classifier.ts  # ML分類ロジック（COCO-SSD + MobileNet KNN）
│   │   ├── pfc.ts         # PFC計算ユーティリティ
│   │   └── supabase.ts    # Supabaseクライアント
│   └── types/
│       ├── index.ts       # アプリケーション型定義
│       └── supabase.ts    # Supabase テーブル型定義
├── supabase-schema.sql    # DBスキーマ（初期セットアップ用）
├── .env.local.example     # 環境変数テンプレート
└── next.config.ts
```

---

## 3. データベース設計

### ERD（概念）

```
foods ──< food_images
  │
  └──< meal_logs

user_goals（独立テーブル、1行のみ）
```

### テーブル定義

#### foods
| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | uuid | PK, default gen_random_uuid() | |
| name | text | NOT NULL | 食べ物の名前 |
| protein_per100g | float | NOT NULL | 100gあたりたんぱく質(g) |
| fat_per100g | float | NOT NULL | 100gあたり脂質(g) |
| carb_per100g | float | NOT NULL | 100gあたり炭水化物(g) |
| calorie_per100g | float | NOT NULL | 100gあたりカロリー(kcal) |
| weight_mode | text | CHECK('fixed','options') | 重さ入力モード |
| fixed_weight | float | nullable | 固定重量(g)。weight_mode='fixed'のとき使用 |
| weight_options | float[] | nullable | 重さ選択肢。weight_mode='options'のとき使用 |
| created_at | timestamptz | default now() | |

#### food_images
| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | uuid | PK | |
| food_id | uuid | FK → foods(id) ON DELETE CASCADE | |
| image_url | text | NOT NULL | Supabase Storage のパブリックURL |
| embedding | float[] | NOT NULL | MobileNet v2 特徴ベクトル（1024次元） |
| created_at | timestamptz | default now() | |

#### meal_logs
| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | uuid | PK | |
| food_id | uuid | FK → foods(id) | |
| weight_g | float | NOT NULL | 記録時の重さ(g) |
| protein_g | float | NOT NULL | 記録時のたんぱく質(g) |
| fat_g | float | NOT NULL | 記録時の脂質(g) |
| carb_g | float | NOT NULL | 記録時の炭水化物(g) |
| calories | float | NOT NULL | 記録時のカロリー(kcal) |
| logged_at | timestamptz | default now() | |

> PFC・カロリーは記録時に計算して保存（foods側の値が後から変更されても過去ログに影響しない設計）

#### user_goals
| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | uuid | PK | |
| target_calories | float | nullable | 1日カロリー目標(kcal) |
| target_protein_g | float | nullable | 1日たんぱく質目標(g) |
| target_fat_g | float | nullable | 1日脂質目標(g) |
| target_carb_g | float | nullable | 1日炭水化物目標(g) |
| updated_at | timestamptz | | |

### Storage
- バケット名：`food-images`
- 公開バケット（Public）
- パス規則：`{food_id}/{uuid}.jpg`

---

## 4. ML分類パイプライン

### 4.1 食べ物登録時（特徴ベクトル抽出）

```
撮影画像（HTMLImageElement）
  └→ MobileNet v2.infer(image, embedding=true)
       └→ 1024次元 Float32Array
            └→ Supabase food_images.embedding に保存
```

### 4.2 食事記録時（検出・分類）

```
撮影画像（HTMLImageElement）
  │
  ├─[1] COCO-SSD.detect(image, maxDetections=20, minScore=0.3)
  │       └→ Prediction[]  { bbox: [x,y,w,h], score, class }
  │
  ├─[2] 各 Prediction に対して：
  │       │
  │       ├─ Canvas でクロップ（5%パディングつき）
  │       ├─ MobileNet.infer(crop, true) → 1024次元ベクトル
  │       └─ KNN分類（コサイン類似度）→ ClassificationResult
  │
  ├─[3] フィルタリング
  │       ├─ 類似度 < 0.5 は除外
  │       └─ 同一食品IDの重複を除外（最初に検出されたものを採用）
  │
  └─[4] フォールバック（COCO-SSDが何も検出しない場合）
          └─ 画像全体をMobileNet → KNN分類 → 1件返す
```

### 4.3 KNN分類アルゴリズム（knnClassify）

```
入力：queryEmbedding[1024], foods[], foodImages[]

1. 全 food_images に対してコサイン類似度を計算
2. food_id ごとに類似度を集計（合計 / 枚数 = 平均類似度）
3. 平均類似度が最大の food を返す
```

**コサイン類似度**：
```
sim(a, b) = Σ(aᵢ·bᵢ) / (√Σaᵢ² · √Σbᵢ²)
```

### 4.4 モデルのロード戦略

- MobileNet・COCO-SSD ともにモジュールレベルのシングルトンとしてキャッシュ
- 初回ロード時のみ `import()` を実行（遅延ロード）
- モデルサイズ：MobileNet ~16MB + COCO-SSD ~7MB ≈ 計23MB

---

## 5. コンポーネント設計

### CameraCapture
```
状態: idle → streaming → preview
- idle:     「撮影する」ボタン表示
- streaming: video要素でライブプレビュー + シャッターボタン
- preview:  撮影済み画像 + 撮り直しボタン
```
- `getUserMedia({ video: { facingMode: 'environment' } })`（背面カメラ優先）
- Canvas経由でJPEG（quality=0.85）に変換
- コールバック: `onCapture(dataUrl: string, element: HTMLImageElement)`

### PFCProgressBar
- 4行（カロリー・P・F・C）の進捗バー
- 目標値がnullの場合はバーを表示するがパーセンテージは0
- 色：カロリー=オレンジ、P=青、F=黄、C=緑

### WeightSelector
- `weight_mode === 'fixed'`：固定重量で即時コールバック呼び出し
- `weight_mode === 'options'`：重さ選択肢をグリッドボタンで表示

---

## 6. データフロー

### 食べ物登録

```
[フォーム入力]
    ↓
POST foods テーブル（INSERT）→ food.id 取得
    ↓
各撮影画像に対して：
  ├─ extractEmbedding(imageElement) → float[1024]
  ├─ Supabase Storage に JPEG をアップロード → publicUrl
  └─ POST food_images（INSERT）: food_id, image_url, embedding
```

### 食事記録

```
[カメラ撮影]
    ↓
detectAndClassify(imageElement, foods, foodImages)
    ↓
[確認画面：検出食品一覧 + 重さ選択]
    ↓
全食品の重さ確定後：
  calcPFC(food, weightG) × n件
    ↓
supabase.from('meal_logs').insert(rows[]) — バルクインサート
```

### PFC計算（calcPFC）

```
PFC値 = (食品の100gあたり値) × (重さg / 100)
小数第1位に丸め（×10 → round → /10）
```

---

## 7. 環境変数

| 変数名 | 説明 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon（公開）キー |

`NEXT_PUBLIC_` プレフィックスによりブラウザから参照可能。

---

## 8. セキュリティ方針

- 単一ユーザー個人利用のため認証なし・RLS無効
- `ANON_KEY` はブラウザに公開されるが、テーブルへのフルアクセスが許可される点に注意
- 複数ユーザー対応に拡張する場合は Supabase Auth + RLS ポリシーを追加する

---

## 9. デプロイ

### Vercel（推奨）

1. GitHub にリポジトリを push
2. Vercel でプロジェクトをインポート
3. 環境変数を設定（`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`）
4. デプロイ（`npm run build` が自動実行される）

### ビルドコマンド

```bash
npm run dev     # 開発サーバー（localhost:3000）
npm run build   # 本番ビルド
npm run start   # 本番サーバー起動
```

---

## 10. 既知の制約・今後の課題

| 項目 | 現状 | 改善案 |
|------|------|--------|
| COCO-SSD検出精度 | 80カテゴリのみ（食品は約10-15種） | 食品専用検出モデルへの切り替え |
| 類似度閾値 | ハードコード（0.5） | UIで調整可能にする |
| 重さモードの変更 | 食品編集画面で変更不可 | 編集フォームに重さモード変更を追加 |
| オフライン対応 | なし | PWA化・Service Workerでモデルをキャッシュ |
| 認証 | なし | Supabase Auth + RLS で複数ユーザー対応 |
| 初回ロード時間 | モデル読み込みに10〜20秒 | モデルの事前キャッシュ（PWA） |
