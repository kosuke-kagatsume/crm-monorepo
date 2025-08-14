# DRM Suite v1.1 - マイクロサービス型CRM + マルチエージェントRAG

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0-red.svg)](https://nestjs.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)

## 🎉 v1.1 新機能

### 🆕 新規サービス
- **svc-aftercare** - アフターケア・保守管理サービス
- **svc-ledger** - 元帳管理・会計連携サービス
- **svc-expense (強化版)** - 承認ワークフロー・OCR対応

### 🤖 RAG Copilot v2.0
- マルチエージェント対応（営業・施工・財務・顧客）
- コンテキスト記憶機能
- 予測分析機能

### 🎨 UI/UX改善
- ダークテーマ完全対応
- レスポンシブデザイン強化
- アクセシビリティ向上（WCAG 2.1 AA準拠）

## 🏗️ アーキテクチャ概要

DRM Suite（Dandori Relation Management）は、建設・リフォーム業界向けの次世代マイクロサービス型CRMシステムです。

### 📦 サービス構成

#### コアサービス
- **api-gateway** - API Gateway（NestJS + tRPC）
- **svc-estimate** - 見積・原価・発注サービス
- **svc-inventory** - 在庫・棚卸サービス
- **svc-booking** - 会議室・車両予約サービス
- **svc-marketing** - キャンペーン・CPA分析サービス
- **svc-customer** - 顧客管理サービス
- **svc-expense** - 経費管理サービス（v1.1強化）

#### v1.1 新規サービス
- **svc-aftercare** - アフターケア・保守管理サービス
- **svc-ledger** - 元帳管理・会計連携サービス

#### AI/RAGサービス
- **rag-api** - マルチエージェントRAG Copilot（FastAPI + LangChain）
- **web-frontend** - フロントエンド（Next.js + shadcn/ui）

### 🛠️ 技術スタック

#### Backend

- **NestJS** - マイクロサービスフレームワーク
- **FastAPI** - RAG API（Python）
- **Prisma** - ORM & マイグレーション
- **PostgreSQL + PostGIS + pgvector** - メインDB
- **ClickHouse** - 分析データ
- **Redis** - キャッシュ & セッション
- **Apache Kafka** - イベントストリーミング

#### Frontend

- **Next.js 14** - App Router
- **TypeScript** - 型安全性
- **Tailwind CSS** - スタイリング
- **shadcn/ui** - UIコンポーネント

#### AI & RAG (v1.1強化)

- **OpenAI GPT-4 Turbo** - メインLLM
- **Claude 3 Haiku** - 長文要約
- **text-embedding-3-large** - 埋め込みモデル
- **LangChain** - RAGフレームワーク
- **pgvector** - ベクトル検索
- **マルチエージェントシステム** - 専門特化AI（営業・施工・財務・顧客）

## Run tasks

To run tasks with Nx use:

```sh
npx nx <target> <project-name>
```

For example:

```sh
npx nx build myproject
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Add new projects

While you could add new projects to your workspace manually, you might want to leverage [Nx plugins](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) and their [code generation](https://nx.dev/features/generate-code?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) feature.

To install a new plugin you can use the `nx add` command. Here's an example of adding the React plugin:

```sh
npx nx add @nx/react
```

Use the plugin's generator to create new projects. For example, to create a new React app or library:

```sh
# Generate an app
npx nx g @nx/react:app demo

# Generate a library
npx nx g @nx/react:lib some-lib
```

You can use `npx nx list` to get a list of installed plugins. Then, run `npx nx list <plugin-name>` to learn about more specific capabilities of a particular plugin. Alternatively, [install Nx Console](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) to browse plugins and generators in your IDE.

[Learn more about Nx plugins &raquo;](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) | [Browse the plugin registry &raquo;](https://nx.dev/plugin-registry?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Set up CI!

### Step 1

To connect to Nx Cloud, run the following command:

```sh
npx nx connect
```

Connecting to Nx Cloud ensures a [fast and scalable CI](https://nx.dev/ci/intro/why-nx-cloud?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) pipeline. It includes features such as:

- [Remote caching](https://nx.dev/ci/features/remote-cache?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task distribution across multiple machines](https://nx.dev/ci/features/distribute-task-execution?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Automated e2e test splitting](https://nx.dev/ci/features/split-e2e-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task flakiness detection and rerunning](https://nx.dev/ci/features/flaky-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

### Step 2

Use the following command to configure a CI workflow for your workspace:

```sh
npx nx g ci-workflow
```

[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/getting-started/intro#learn-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:

- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
