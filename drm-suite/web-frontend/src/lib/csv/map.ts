// src/lib/csv/map.ts
export type HeaderMap = Record<string, string>; // { "外部ヘッダ":"標準ヘッダ" }

export function applyHeaderMap(rows: any[], headerMap?: HeaderMap) {
  if (!headerMap) return rows;
  return rows.map((r) => {
    const o: any = {};
    for (const [k, v] of Object.entries(r)) {
      const target = headerMap[k] ?? k; // マップが無ければ元ヘッダをそのまま
      o[target] = v;
    }
    return o;
  });
}
