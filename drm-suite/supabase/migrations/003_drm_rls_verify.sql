-- === 動作チェック（JWTにtenant_idが入っている前提） ===

-- RLSが有効になっているか確認
select 
  schemaname,
  tablename,
  rowsecurity 
from pg_tables 
where schemaname = 'drm' 
order by tablename;

-- ポリシー一覧確認
select 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
from pg_policies 
where schemaname = 'drm'
order by tablename, policyname;

-- ビュー一覧確認
select 
  table_schema,
  table_name
from information_schema.views
where table_schema = 'drm'
order by table_name;

-- 例：手動で1レコードだけ入れてRLS動作を見る（実運用ではアプリ経由で）
-- ※ 実行前に適切なJWTトークンまたはセッション設定が必要
-- set request.jwt.claims = '{"tenant_id": "11111111-1111-1111-1111-111111111111", "can_view_cost": "true"}';

-- insert into drm.projects(project_code, project_name, tenant_id) 
-- values ('PRJ-0001','デモ現場', drm.current_tenant_id());

-- select * from drm.projects; -- ← 見えること
-- select * from drm.v_estimate_lines_public limit 1; -- ← 権限でcostがnullになる/ならない