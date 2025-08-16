type P = {
  points: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
};

export default function Sparkline({
  points,
  width = 160,
  height = 40,
  color = '#3b82f6',
  strokeWidth = 2,
}: P) {
  if (!points.length) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const xStep = width / (points.length - 1 || 1);
  const pathData = points
    .map((v, i) => {
      const x = i * xStep;
      const y = height - ((v - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height}>
      <path d={pathData} fill="none" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
}
