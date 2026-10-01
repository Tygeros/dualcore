import { useMemo } from "react";

export interface SeriesPoint {
  label: string;
  value: number;
}

export interface MultiSeriesPoint {
  label: string;
  values: number[];
}

const COLORS = {
  sky: "#38bdf8",
  emerald: "#34d399",
  amber: "#fbbf24",
  violet: "#a78bfa",
  rose: "#fb7185",
  neutral: "#737373",
};

function niceMax(n: number): number {
  if (n <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(n)));
  const m = Math.ceil(n / pow);
  return m * pow;
}

/** Single-series line chart */
export function LineChart({
  data,
  color = COLORS.sky,
  height = 160,
  valueSuffix = "",
  yTicks = 4,
}: {
  data: SeriesPoint[];
  color?: string;
  height?: number;
  valueSuffix?: string;
  yTicks?: number;
}) {
  const width = 400;
  const pad = { top: 12, right: 12, bottom: 28, left: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const maxV = useMemo(
    () => niceMax(Math.max(...data.map((d) => d.value), 0)),
    [data]
  );

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-neutral-500 h-40">
        No data yet
      </div>
    );
  }

  const points = data.map((d, i) => {
    const x =
      data.length === 1
        ? pad.left + innerW / 2
        : pad.left + (i / (data.length - 1)) * innerW;
    const y = pad.top + innerH - (d.value / maxV) * innerH;
    return { x, y, ...d };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x.toFixed(1)} ${(pad.top + innerH).toFixed(1)}` +
    ` L ${points[0].x.toFixed(1)} ${(pad.top + innerH).toFixed(1)} Z`;

  const labelStep = Math.max(1, Math.ceil(data.length / 6));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      role="img"
    >
      {/* grid */}
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const v = (maxV / yTicks) * i;
        const y = pad.top + innerH - (v / maxV) * innerH;
        return (
          <g key={i}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={y}
              y2={y}
              stroke="#262626"
              strokeWidth={1}
            />
            <text
              x={pad.left - 6}
              y={y + 3}
              textAnchor="end"
              className="fill-neutral-500"
              style={{ fontSize: 9 }}
            >
              {Number.isInteger(v) ? v : v.toFixed(1)}
              {valueSuffix}
            </text>
          </g>
        );
      })}

      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>

      <path d={areaPath} fill={`url(#grad-${color.replace("#", "")})`} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={data.length > 40 ? 0 : 2.5}
          fill={color}
        >
          <title>
            {p.label}: {p.value.toFixed(1)}
            {valueSuffix}
          </title>
        </circle>
      ))}

      {points.map(
        (p, i) =>
          i % labelStep === 0 && (
            <text
              key={`l-${i}`}
              x={p.x}
              y={height - 8}
              textAnchor="middle"
              className="fill-neutral-500"
              style={{ fontSize: 9 }}
            >
              {p.label}
            </text>
          )
      )}
    </svg>
  );
}

/** Grouped bar chart (up to 4 series) */
export function BarChart({
  data,
  series,
  height = 180,
}: {
  data: MultiSeriesPoint[];
  series: { name: string; color: string }[];
  height?: number;
}) {
  const width = 400;
  const pad = { top: 12, right: 12, bottom: 28, left: 28 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const maxV = useMemo(() => {
    let m = 0;
    for (const d of data) {
      for (const v of d.values) m = Math.max(m, v);
    }
    return niceMax(m);
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-neutral-500 h-40">
        No data yet
      </div>
    );
  }

  const groupW = innerW / data.length;
  const barGap = 2;
  const barW = Math.max(
    2,
    (groupW - 8 - barGap * (series.length - 1)) / series.length
  );
  const labelStep = Math.max(1, Math.ceil(data.length / 6));

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        role="img"
      >
        {[0, 0.5, 1].map((t) => {
          const v = maxV * t;
          const y = pad.top + innerH - t * innerH;
          return (
            <g key={t}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={y}
                y2={y}
                stroke="#262626"
                strokeWidth={1}
              />
              <text
                x={pad.left - 4}
                y={y + 3}
                textAnchor="end"
                className="fill-neutral-500"
                style={{ fontSize: 9 }}
              >
                {Math.round(v)}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const gx = pad.left + i * groupW + 4;
          return (
            <g key={i}>
              {d.values.map((v, si) => {
                const h = (v / maxV) * innerH;
                const x = gx + si * (barW + barGap);
                const y = pad.top + innerH - h;
                return (
                  <rect
                    key={si}
                    x={x}
                    y={y}
                    width={barW}
                    height={Math.max(0, h)}
                    rx={1.5}
                    fill={series[si]?.color ?? COLORS.neutral}
                    opacity={0.9}
                  >
                    <title>
                      {d.label} · {series[si]?.name}: {v}
                    </title>
                  </rect>
                );
              })}
              {i % labelStep === 0 && (
                <text
                  x={gx + (series.length * (barW + barGap)) / 2}
                  y={height - 8}
                  textAnchor="middle"
                  className="fill-neutral-500"
                  style={{ fontSize: 9 }}
                >
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-3 justify-center mt-1">
        {series.map((s) => (
          <div key={s.name} className="flex items-center gap-1.5 text-[11px] text-neutral-400">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ background: s.color }}
            />
            {s.name}
          </div>
        ))}
      </div>
    </div>
  );
}

export { COLORS };
