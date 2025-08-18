# DRM Suite - Dandori Relation Management System

## 🚀 概要

DRM Suiteは、建設業界向けの次世代CRM（顧客関係管理）システムです。
見積・原価管理から在庫管理、マーケティングまで、建設業務全体をカバーする統合プラットフォームです。

### ✨ 主要機能

- 📝 **見積・原価管理** - 承認フロー対応、通常版とプロ版の2種類
- 📦 **在庫・棚卸** - リアルタイム追跡
- 🗓️ **予約管理** - 会議室・車両の予約システム
- 📊 **マーケティング** - CPA分析・KPI管理
- 🤖 **RAG Copilot** - AI文書理解・業務サポート
- 👥 **役職別ダッシュボード** - 8つの役職に最適化された画面

## 🌐 デモサイト

**URL**: https://web-frontend-h4q11t32v-kosukes-projects-c6ad92ba.vercel.app

### デモアカウント

| 役職           | メールアドレス        | パスワード |
| -------------- | --------------------- | ---------- |
| 経営者         | ceo@demo.com          | demo123    |
| 支店長         | manager@demo.com      | demo123    |
| 営業担当       | sales@demo.com        | demo123    |
| 経理担当       | accounting@demo.com   | demo123    |
| マーケティング | marketing@demo.com    | demo123    |
| 施工管理       | construction@demo.com | demo123    |
| 事務員         | office@demo.com       | demo123    |
| アフター担当   | aftercare@demo.com    | demo123    |

## 🛠 技術スタック

- **Frontend**: Next.js 14.2.5, React 18.3.1, TypeScript 5.5.2
- **Styling**: Tailwind CSS 3.4.0
- **Maps**: Google Maps API
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Deployment**: Vercel

## 📋 セットアップ手順

### 前提条件

- Node.js 18.0.0以上
- npm または pnpm

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/kosuke-kagatsume/crm-monorepo.git
cd crm-monorepo/drm-suite/web-frontend

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

開発サーバーは http://localhost:3000 で起動します。

### ビルド

```bash
# プロダクションビルド
npm run build

# プロダクションサーバーの起動
npm start
```

## 📁 プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── dashboard/         # 役職別ダッシュボード
│   ├── estimates/         # 見積管理
│   ├── customers/         # 顧客管理
│   ├── inventory/         # 在庫管理
│   └── ...
├── components/            # 再利用可能コンポーネント
│   ├── forms/            # フォームコンポーネント
│   ├── providers/        # Context Providers
│   ├── ui/               # UIコンポーネント
│   └── shared/           # 共通コンポーネント
├── hooks/                # カスタムフック
├── services/             # APIサービス層
├── types/                # TypeScript型定義
└── contexts/             # React Context
```

## 🎯 機能詳細

### 見積作成システム

**通常版**

- 基本的な項目入力
- テンプレート機能（3種類）
- 自動計算
- PDF出力

**プロ版**

- 3階層の詳細分類
- 原価管理・利益分析
- AIアシスタント
- 協力会社連携
- 画像・図面添付
- バージョン管理

### 役職別ダッシュボード

各役職に最適化された情報表示と機能：

- **経営者**: 全社KPI、売上分析、戦略的意思決定支援
- **支店長**: 支店別実績、チーム管理、承認業務
- **営業担当**: 顧客管理、見積作成、活動記録
- **経理担当**: 請求管理、支払管理、財務レポート
- **マーケティング**: キャンペーン管理、リード分析、ROI測定
- **施工管理**: 工程管理、資材管理、品質管理
- **事務員**: 書類管理、スケジュール調整、データ入力
- **アフター担当**: 保守管理、クレーム対応、顧客満足度

## 🔧 環境変数

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```env
# API Endpoints
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_CUSTOMER_API_URL=http://localhost:3001/api
NEXT_PUBLIC_ESTIMATE_API_URL=http://localhost:3002/api

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

## 📝 開発ガイドライン

### コーディング規約

- **命名規則**:
  - 変数・関数: camelCase
  - 型・インターフェース: PascalCase
  - ファイル: kebab-case
- **コメント**: JSDoc形式、日本語説明OK
- **コンポーネント**: 関数コンポーネント + TypeScript

### Git ブランチ戦略

- `main`: 本番環境
- `develop`: 開発環境
- `feature/*`: 機能開発
- `hotfix/*`: 緊急修正

## 🚀 デプロイ

### Vercel へのデプロイ

```bash
# Vercel CLIのインストール
npm i -g vercel

# デプロイ
vercel --prod
```

### Docker デプロイ

```bash
# イメージのビルド
docker build -t drm-suite .

# コンテナの起動
docker run -p 3000:3000 drm-suite
```

## 📄 ライセンス

Proprietary - All Rights Reserved

## 🤝 サポート

- **Issue**: [GitHub Issues](https://github.com/kosuke-kagatsume/crm-monorepo/issues)
- **Email**: support@dandori-work.com

## 🏗️ ロードマップ

- [ ] モバイルアプリ対応
- [ ] オフライン機能
- [ ] 多言語対応（英語・中国語）
- [ ] AI予測分析機能
- [ ] 外部システム連携API

---

**Version**: 1.1.0  
**Last Updated**: 2025-08-18  
**Status**: Demo Ready 🟢
