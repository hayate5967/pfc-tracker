This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

# PFCカロリー記録アプリ

食事の写真を撮ると、事前に登録した食べ物から自動分類してPFC・カロリーを記録するWebアプリです。

## 特徴

- **写真で記録**: カメラで撮るだけで食べ物を自動認識
- **事前登録した食べ物から分類**: 世界中の食べ物ではなく、自分が登録した食べ物の中から分類するため精度が高い
- **ブラウザ内ML**: TensorFlow.js + MobileNetを使用。APIコスト不要
- **PFC・カロリー管理**: 目標設定と今日の進捗をダッシュボードで確認

## セットアップ

### 1. Supabaseプロジェクトの作成

[supabase.com](https://supabase.com) でプロジェクトを作成してください。

### 2. データベーススキーマの実行

Supabase Dashboard の **SQL Editor** で `supabase-schema.sql` の内容を実行します。

### 3. Storageバケットの作成

Supabase Dashboard の **Storage** から `food-images` という名前のパブリックバケットを作成します。

### 4. 環境変数の設定

`.env.local.example` をコピーして `.env.local` を作成し、Supabase の情報を入力します。

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
```

URLとAnon Keyは Supabase Dashboard の **Settings → API** で確認できます。

### 5. 開発サーバーの起動

```bash
npm install
npm run dev
```

`http://localhost:3000` をブラウザで開きます。

## 使い方

### 食べ物の登録

1. **食べ物** タブ → **追加** ボタン
2. 名前・PFC（100gあたり）・カロリーを入力
3. 重さモードを選択（固定 or ボタン選択）
4. 写真を1枚以上撮影して登録

精度を上げるには、同じ食べ物を異なる角度・盛り付けで複数枚登録してください。

### 食事の記録

1. **記録** タブ → カメラを起動
2. 撮影すると自動で食べ物を認識
3. 重さを選択 → 自動でPFC・カロリーを計算して保存

### 目標設定

**目標** タブでカロリーとPFCの1日の目標を設定します。ダッシュボードに進捗が表示されます。

## 技術スタック

| 役割 | 技術 |
|------|------|
| フレームワーク | Next.js 16 (App Router) + TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| 画像分類 | TensorFlow.js + MobileNet + KNNコサイン類似度 |
| バックエンド/DB | Supabase (PostgreSQL + Storage) |
| ホスティング | Vercel |

## Vercelへのデプロイ

1. GitHubにpush
2. [Vercel](https://vercel.com) でプロジェクトをインポート
3. 環境変数（`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`）を設定
4. デプロイ

> **Note**: カメラ機能はHTTPS環境が必要です。Vercelデプロイ後またはlocalhostで動作します。
