-- === 動作チェック（JWTにtenant_idが入っている前提） ===

-- 例：手動で1レコードだけ入れてRLS動作を見る（実運用ではアプリ経由で）
insert into drm.projects(project_code, project_name, tenant_id) values ('PRJ-0001','デモ現場', drm.current_tenant_id());

select * from drm.projects;           -- ← 見えること
select * from drm.v_estimate_lines_public limit 1; -- ← 権限でcostがnullになる/ならない