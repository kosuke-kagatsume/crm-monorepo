-- PROMPT 6D: 数値確認SQL

-- 1) MVリフレッシュ（念のため）
select drm.refresh_finance();

-- 2) マスクなしの生データ確認（管理者視点）
select * from drm.mv_project_finance order by project_code;

-- 3) JWTクレームを仮設定して、公開ビューの挙動も確認（権限テスト）
select set_config(
  'request.jwt.claims',
  json_build_object('tenant_id','11111111-1111-1111-1111-111111111111','can_view_cost','true')::text,
  true
);
select * from drm.v_project_finance_public order by project_code;

-- 期待結果（サンプルCSVそのままの場合）
-- PRJ-0001：見積売上 242,000 / 見積原価 156,000 / PO原価 58,000 / 実績原価 58,000
-- PRJ-0002：見積売上 395,000 / 見積原価 147,000 / PO原価 142,000 / 実績原価 142,000