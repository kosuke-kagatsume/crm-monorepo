#!/bin/bash
# Vercel環境変数設定スクリプト
# 使い方: bash VERCEL_ENV_SETUP.sh

echo "Vercel環境変数を設定します。各値を入力してください。"

# Production
echo "▼ Production環境"
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Preview
echo "▼ Preview環境"
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
vercel env add SUPABASE_SERVICE_ROLE_KEY preview

# Development
echo "▼ Development環境"
vercel env add NEXT_PUBLIC_SUPABASE_URL development
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development
vercel env add SUPABASE_SERVICE_ROLE_KEY development

echo "環境変数設定完了！再デプロイしてください。"
echo "vercel --prod"