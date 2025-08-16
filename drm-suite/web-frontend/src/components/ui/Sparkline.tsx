'use client';
type P = {
  points: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
};
export default function Sparkline({
  points,
  width = 180,
  height = 36,
  strokeWidth = 2,
}: P) {
  if (!points?.length) return <div style={{ width, height }} />;
  const min = Math.min(...points),
    max = Math.max(...points);
  const norm = (v: number) =>
    max === min ? height / 2 : height - ((v - min) / (max - min)) * height;
  const step = width / Math.max(points.length - 1, 1);
  const d = points
    .map((v, i) => `${i ? 'L' : 'M'} ${i * step} ${norm(v)}`)
    .join(' ');
  return (
    <svg width={width} height={height}>
      <path d={d} fill="none" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  );
}
