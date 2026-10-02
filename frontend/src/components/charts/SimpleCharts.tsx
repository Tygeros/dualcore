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

/** Pie / donut chart */
export function PieChart({
  data,
  size = 160,
  innerRatio = 0.55,
  showLegend = true,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  /** 0 = full pie, 0.55 = donut */
  innerRatio?: number;
  showLegend?: boolean;
}) {
  const total = useMemo(
    () => data.reduce((s, d) => s + d.value, 0),
    [data]
  );

  if (data.length === 0 || total === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-neutral-500 h-36">
        No data yet
      </div>
    );
  }

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
  const ir = r * innerRatio;

  let angle = -Math.PI / 2;
  const slices = data.map((d) => {
    const sweep = (d.value / total) * Math.PI * 2;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    const large = sweep > Math.PI ? 1 : 0;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const ix1 = cx + ir * Math.cos(end);
    const iy1 = cy + ir * Math.sin(end);
    const ix2 = cx + ir * Math.cos(start);
    const iy2 = cy + ir * Math.sin(start);
    const path =
      ir > 0
        ? `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${ir} ${ir} 0 ${large} 0 ${ix2} ${iy2} Z`
        : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    return { ...d, path, pct: (d.value / total) * 100 };
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-40 h-40 max-w-full"
        role="img"
      >
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} opacity={0.92}>
            <title>
              {s.label}: {s.value} ({s.pct.toFixed(0)}%)
            </title>
          </path>
        ))}
        {ir > 0 && (
          <text
            x={cx}
            y={cy + 4}
            textAnchor="middle"
            className="fill-neutral-300"
            style={{ fontSize: 14, fontWeight: 600 }}
          >
            {total}
          </text>
        )}
      </svg>
      {showLegend && (
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center max-w-full">
          {slices.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 text-[11px] text-neutral-400"
            >
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ background: s.color }}
              />
              <span className="truncate max-w-[7rem]">{s.label}</span>
              <span className="text-neutral-500 tabular-nums">{s.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Color scale matching the legend image + negative (red) support */
export function heatColor(value: number): string {
  if (value === 0) return "#1c1c1c"; // empty day
  if (value < 0) {
    const abs = Math.abs(value);
    if (abs < 3) return "#3f1d1d";
    if (abs < 7) return "#7f1d1d";
    if (abs < 10) return "#b91c1c";
    if (abs < 15) return "#dc2626";
    if (abs < 20) return "#ef4444";
    return "#f87171";
  }
  if (value < 3) return "#0d3320";
  if (value < 7) return "#14532d";
  if (value < 10) return "#166534";
  if (value < 15) return "#15803d";
  if (value < 20) return "#16a34a";
  return "#22c55e";
}

export interface HeatCell {
  key: string;
  date: Date;
  value: number;
  label?: string;
}

/** GitHub-style contribution heatmap (weeks as columns, weekdays as rows) */
export function Heatmap({
  days,
  weeksLabel = true,
}: {
  days: HeatCell[];
  weeksLabel?: boolean;
}) {
  if (days.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-neutral-500 h-28">
        No data yet
      </div>
    );
  }

  const cell = 11;
  const gap = 2;
  const step = cell + gap;
  const dayLabels = ["Mon", "", "Wed", "", "Fri", "", "Sun"];

  // Align to Monday-start weeks
  const first = days[0].date;
  const firstDow = (first.getDay() + 6) % 7; // Mon=0
  const padded: (HeatCell | null)[] = [];
  for (let i = 0; i < firstDow; i++) padded.push(null);
  for (const d of days) padded.push(d);
  while (padded.length % 7 !== 0) padded.push(null);

  const weekCount = padded.length / 7;
  const leftPad = 28;
  const topPad = weeksLabel ? 14 : 2;
  const width = leftPad + weekCount * step;
  const height = topPad + 7 * step;

  // Month labels at first week of each month
  const monthLabels: { x: number; text: string }[] = [];
  let lastMonth = -1;
  for (let w = 0; w < weekCount; w++) {
    // find first non-null in week
    let sample: HeatCell | null = null;
    for (let r = 0; r < 7; r++) {
      const c = padded[w * 7 + r];
      if (c) {
        sample = c;
        break;
      }
    }
    if (!sample) continue;
    const m = sample.date.getMonth();
    if (m !== lastMonth) {
      lastMonth = m;
      monthLabels.push({
        x: leftPad + w * step,
        text: `${sample.date.getMonth() + 1}/${String(sample.date.getFullYear()).slice(2)}`,
      });
    }
  }

  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto"
        style={{ minWidth: Math.min(width, 520), width: "100%", maxWidth: width }}
        role="img"
      >
        {weeksLabel &&
          monthLabels.map((m, i) => (
            <text
              key={i}
              x={m.x}
              y={10}
              className="fill-neutral-500"
              style={{ fontSize: 9 }}
            >
              {m.text}
            </text>
          ))}

        {dayLabels.map((lab, i) =>
          lab ? (
            <text
              key={i}
              x={leftPad - 4}
              y={topPad + i * step + cell * 0.75}
              textAnchor="end"
              className="fill-neutral-500"
              style={{ fontSize: 8 }}
            >
              {lab}
            </text>
          ) : null
        )}

        {padded.map((d, idx) => {
          if (!d) return null;
          const col = Math.floor(idx / 7);
          const row = idx % 7;
          const x = leftPad + col * step;
          const y = topPad + row * step;
          const fill = heatColor(d.value);
          const dateStr = `${d.date.getDate()}/${d.date.getMonth() + 1}/${d.date.getFullYear()}`;
          return (
            <rect
              key={d.key}
              x={x}
              y={y}
              width={cell}
              height={cell}
              rx={2}
              fill={fill}
              stroke="#262626"
              strokeWidth={0.5}
            >
              <title>
                {dateStr}: {d.value.toFixed(1)} pts
                {d.label ? ` · ${d.label}` : ""}
              </title>
            </rect>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-neutral-500">
        <div className="flex items-center gap-1">
          <span className="text-neutral-600">Neg</span>
          {[-20, -10, -3].map((v) => (
            <span
              key={v}
              className="w-2.5 h-2.5 rounded-sm inline-block"
              style={{ background: heatColor(v) }}
              title={`${v}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span
            className="w-2.5 h-2.5 rounded-sm inline-block"
            style={{ background: heatColor(0) }}
          />
          <span>0</span>
        </div>
        <div className="flex items-center gap-1">
          {[1, 5, 9, 12, 18, 25].map((v) => (
            <span
              key={v}
              className="w-2.5 h-2.5 rounded-sm inline-block"
              style={{ background: heatColor(v) }}
              title={`${v}`}
            />
          ))}
          <span className="text-neutral-600 ml-0.5">20+</span>
        </div>
      </div>
    </div>
  );
}

/** Horizontal comparison bars (e.g. priority / difficulty counts) */
export function HBarChart({
  series,
  heightPerRow = 28,
}: {
  series: {
    label: string;
    values: { name: string; value: number; color: string }[];
  }[];
  heightPerRow?: number;
}) {
  const maxV = useMemo(() => {
    let m = 1;
    for (const row of series) {
      for (const v of row.values) m = Math.max(m, v.value);
    }
    return m;
  }, [series]);

  if (series.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-neutral-500 h-24">
        No data yet
      </div>
    );
  }

  const legendNames = series[0]?.values.map((v) => ({
    name: v.name,
    color: v.color,
  })) ?? [];

  return (
    <div className="space-y-1">
      {series.map((row) => (
        <div key={row.label} className="flex items-center gap-2">
          <div
            className="w-20 shrink-0 text-[11px] text-neutral-400 truncate text-right"
            title={row.label}
          >
            {row.label}
          </div>
          <div
            className="flex-1 flex flex-col gap-0.5 justify-center"
            style={{ minHeight: heightPerRow }}
          >
            {row.values.map((v) => (
              <div key={v.name} className="flex items-center gap-1.5">
                <div className="flex-1 h-2.5 rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(v.value / maxV) * 100}%`,
                      background: v.color,
                      minWidth: v.value > 0 ? 4 : 0,
                    }}
                  />
                </div>
                <span className="text-[10px] text-neutral-500 tabular-nums w-5 text-right">
                  {v.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-3 justify-center pt-1">
        {legendNames.map((s) => (
          <div
            key={s.name}
            className="flex items-center gap-1.5 text-[11px] text-neutral-400"
          >
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
