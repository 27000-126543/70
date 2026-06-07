import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, BarChart, Bar, Legend } from 'recharts';

interface ChartProps {
  data: any[];
  height?: number;
  color?: string;
}

export function MRILineChart({ data, height = 180, color = '#00d4ff' }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="mriGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.4} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="step" stroke="#475569" fontSize={10} tickLine={false} />
        <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ background: 'rgba(15,21,48,0.95)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: 12, fontSize: 12, fontFamily: 'JetBrains Mono' }}
          labelStyle={{ color: '#94a3b8' }}
        />
        <Area type="monotone" dataKey="mriGrowthRate" stroke={color} strokeWidth={2} fill="url(#mriGrad)" />
        <Line type="monotone" dataKey="theoretical" stroke="#ffaa00" strokeWidth={1} strokeDasharray="4 4" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function JetPowerChart({ data, height = 180, color = '#22d3ee' }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="step" stroke="#475569" fontSize={10} tickLine={false} />
        <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} scale="log" />
        <Tooltip
          contentStyle={{ background: 'rgba(15,21,48,0.95)', border: '1px solid rgba(34,211,238,0.3)', borderRadius: 12, fontSize: 12 }}
        />
        <Line type="monotone" dataKey="jetPower" stroke={color} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="jetCollimation" stroke="#a855f7" strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AccretionRateChart({ data, height = 180, color = '#ffaa00' }: ChartProps) {
  const threshold = 0.05;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.4} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="step" stroke="#475569" fontSize={10} tickLine={false} />
        <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} domain={[0, 'auto']} />
        <Tooltip
          contentStyle={{ background: 'rgba(15,21,48,0.95)', border: '1px solid rgba(255,170,0,0.3)', borderRadius: 12, fontSize: 12 }}
        />
        <Area type="monotone" dataKey="accretionRate" stroke={color} strokeWidth={2} fill="url(#accGrad)" />
        <Line type="monotone" dataKey="threshold" stroke="#ff3b5c" strokeWidth={1} strokeDasharray="6 3" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CompletionTrendChart({ data, height = 200 }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.5} />
            <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="durGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ffaa00" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ffaa00" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} tickFormatter={(v) => v.slice(5)} />
        <YAxis yAxisId="left" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
        <YAxis yAxisId="right" orientation="right" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ background: 'rgba(15,21,48,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Area yAxisId="left" type="monotone" dataKey="completionRate" name="完成率" stroke="#00d4ff" strokeWidth={2} fill="url(#compGrad)" />
        <Area yAxisId="right" type="monotone" dataKey="avgDurationHours" name="平均耗时(小时)" stroke="#ffaa00" strokeWidth={2} fill="url(#durGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SpectrumChart({ data, height = 220 }: { data: { frequency: number[]; flux: number[] }; height?: number }) {
  const chartData = data.frequency.map((f, i) => ({ logFreq: Math.log10(f).toFixed(1), flux: data.flux[i] }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="specGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.5} />
            <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="logFreq" stroke="#475569" fontSize={10} label={{ value: 'log ν (Hz)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 11 }} />
        <YAxis stroke="#475569" fontSize={10} scale="log" label={{ value: 'F_ν', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }} />
        <Tooltip contentStyle={{ background: 'rgba(15,21,48,0.95)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 12, fontSize: 12 }} />
        <Area type="monotone" dataKey="flux" stroke="#a855f7" strokeWidth={2} fill="url(#specGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SEDChart({ data, height = 220 }: { data: { energy: number[]; luminosity: number[] }; height?: number }) {
  const chartData = data.energy.map((e, i) => ({ logE: Math.log10(e).toFixed(1), luminosity: data.luminosity[i] }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="logE" stroke="#475569" fontSize={10} label={{ value: 'log E (keV)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 11 }} />
        <YAxis stroke="#475569" fontSize={10} scale="log" label={{ value: 'ν L_ν', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }} />
        <Tooltip contentStyle={{ background: 'rgba(15,21,48,0.95)', border: '1px solid rgba(255,170,0,0.3)', borderRadius: 12, fontSize: 12 }} />
        <Line type="monotone" dataKey="luminosity" stroke="#ffaa00" strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function LightCurveChart({ data, height = 220 }: { data: { time: number[]; flux: number[][]; bands: string[] }; height?: number }) {
  const colors = ['#ffaa00', '#00d4ff', '#a855f7', '#ff3b5c'];
  const chartData = data.time.map((t, i) => {
    const row: any = { time: (t / 1000).toFixed(0) };
    data.bands.forEach((b, bi) => { row[b] = data.flux[bi][i]; });
    return row;
  });
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="time" stroke="#475569" fontSize={10} label={{ value: 't (ks)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 11 }} />
        <YAxis stroke="#475569" fontSize={10} label={{ value: '归一化流量', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }} />
        <Tooltip contentStyle={{ background: 'rgba(15,21,48,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {data.bands.map((b, i) => (
          <Line key={b} type="monotone" dataKey={b} stroke={colors[i]} strokeWidth={1.5} dot={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
