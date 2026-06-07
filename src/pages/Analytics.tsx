import { useSimulationStore } from '../stores/simulationStore';
import { CompletionTrendChart } from '../components/charts/Charts';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ScatterChart, Scatter, ZAxis, Legend,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Flame,
  Target,
  AlertTriangle,
  Zap,
  FileCheck2,
} from 'lucide-react';
import { formatDuration } from '../data/mockEngine';
import { TOPOLOGY_LABELS } from '../types';

export default function Analytics() {
  const { simulations, dailyStats, getStatistics } = useSimulationStore();
  const stats = getStatistics();

  const trendData = dailyStats.map((d) => ({
    ...d,
    completionRate: (d.completionRate * 100).toFixed(1),
    avgDurationHours: (d.averageDuration / 3600).toFixed(1),
  }));

  const topologyDist = (['toroidal', 'poloidal', 'helical'] as const).map((t) => ({
    name: TOPOLOGY_LABELS[t],
    value: simulations.filter((s) => s.magneticField.topology === t).length,
  }));

  const COLORS = ['#00d4ff', '#a855f7', '#ffaa00'];

  const spinVsJet = simulations
    .filter((s) => s.monitoringHistory.length > 5)
    .map((s) => {
      const last = s.monitoringHistory[s.monitoringHistory.length - 1];
      return {
        spin: s.params.spin,
        magnetic: s.magneticField.strength,
        jetPower: last.jetPower / 1e43,
        name: s.name.slice(0, 8),
      };
    });

  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}h`,
    completed: Math.floor(Math.random() * 3),
    started: Math.floor(Math.random() * 4),
  }));

  const radarData = [
    { subject: '数值稳定性', A: 85 },
    { subject: '喷流稳定性', A: 78 },
    { subject: 'MRI 饱和度', A: 92 },
    { subject: '能量守恒', A: 88 },
    { subject: '收敛速率', A: 75 },
    { subject: '辐射精度', A: 82 },
  ];

  const deviationBySpin = [0, 0.25, 0.5, 0.75, 0.95].map((sp) => {
    const group = simulations.filter((s) => Math.abs(s.params.spin - sp) < 0.15);
    return {
      spin: `a*=${sp.toFixed(2)}`,
      deviation: group.length > 0 ? (group.reduce((a, s) => a + (s.monitoringHistory.length > 0 ? Math.abs(1 - s.monitoringHistory[s.monitoringHistory.length - 1].jetCollimation) : 0), 0) / group.length * 100).toFixed(1) : 0,
      count: group.length,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-orbitron text-2xl font-bold text-slate-100 tracking-wide">统计看板</h1>
        <p className="text-sm text-slate-400 mt-1">每日自动统计完成率、计算耗时及喷流功率偏差</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l: '总模拟数', v: stats.total, icon: BarChart3, c: 'text-plasma-400' },
          { l: '完成率', v: `${(stats.completionRate * 100).toFixed(1)}%`, icon: TrendingUp, c: 'text-gravity-400' },
          { l: '平均耗时', v: formatDuration(stats.avgDuration), icon: Clock, c: 'text-accretion-400' },
          { l: '活跃预警', v: stats.activeWarnings, icon: AlertTriangle, c: stats.activeWarnings > 0 ? 'text-alert-400' : 'text-gravity-400' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="glass-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">{s.l}</span>
                <Icon className={`w-5 h-5 ${s.c}`} />
              </div>
              <p className="font-orbitron text-2xl font-bold text-slate-100">{s.v}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 glass-card p-5">
          <h3 className="section-title">
            <TrendingUp className="w-5 h-5 text-plasma-400" /> 近14天性能趋势
          </h3>
          <CompletionTrendChart data={trendData} height={250} />
        </div>

        <div className="glass-card p-5">
          <h3 className="section-title">
            <Zap className="w-5 h-5 text-magnetic-400" /> 磁场拓扑分布
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={topologyDist} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" stroke="none" paddingAngle={3}>
                {topologyDist.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'rgba(15,21,48,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <h3 className="section-title">
            <Flame className="w-5 h-5 text-accretion-400" /> 自旋 a* vs 喷流功率
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="spin" name="自旋 a*" stroke="#475569" fontSize={10} domain={[0, 1]} tickLine={false} />
              <YAxis dataKey="jetPower" name="喷流功率" unit="×10⁴³ erg/s" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
              <ZAxis dataKey="magnetic" range={[40, 300]} name="磁场强度" />
              <Tooltip contentStyle={{ background: 'rgba(15,21,48,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }} cursor={{ strokeDasharray: '3 3' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Scatter name="模拟" data={spinVsJet} fill="#00d4ff" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h3 className="section-title">
            <Target className="w-5 h-5 text-jet-400" /> 各自旋段喷流偏差
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={deviationBySpin} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="spin" stroke="#475569" fontSize={10} tickLine={false} />
              <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'rgba(15,21,48,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="deviation" name="功率偏差(%)" fill="#a855f7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="glass-card p-5">
          <h3 className="section-title">
            <Clock className="w-5 h-5 text-plasma-400" /> 每日任务时段分布
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hour" stroke="#475569" fontSize={9} tickLine={false} interval={3} />
              <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'rgba(15,21,48,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="started" name="新启动" fill="#00d4ff" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" name="已完成" fill="#ffaa00" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h3 className="section-title">
            <FileCheck2 className="w-5 h-5 text-gravity-400" /> 质量评估雷达图
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={10} />
              <PolarRadiusAxis stroke="#475569" fontSize={9} angle={30} domain={[0, 100]} />
              <Radar name="平均得分" dataKey="A" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.3} strokeWidth={2} />
              <Tooltip contentStyle={{ background: 'rgba(15,21,48,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h3 className="section-title">
            <BarChart3 className="w-5 h-5 text-alert-400" /> 预警统计
          </h3>
          <div className="space-y-3">
            {[
              { l: '吸积率突降', v: dailyStats.reduce((a, d) => a + d.warningsCount, 0), c: 'bg-alert-500' },
              { l: '磁场异常', v: Math.floor(dailyStats.reduce((a, d) => a + d.warningsCount, 0) * 0.7), c: 'bg-magnetic-500' },
              { l: 'MRI异常', v: Math.floor(dailyStats.reduce((a, d) => a + d.warningsCount, 0) * 0.4), c: 'bg-plasma-500' },
              { l: '数值发散', v: dailyStats.reduce((a, d) => a + d.divergenceCount, 0), c: 'bg-accretion-500' },
            ].map((w, i) => {
              const total = dailyStats.reduce((a, d) => a + d.warningsCount + d.divergenceCount, 0) * 2;
              const pct = total > 0 ? (w.v / total) * 100 : 0;
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">{w.l}</span>
                    <span className="font-mono text-slate-400">{w.v} 次</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className={`h-full ${w.c} transition-all`} style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-white/5 grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white/[0.02]">
              <p className="text-slate-500">14天总预警</p>
              <p className="font-mono text-xl font-bold text-slate-100 mt-1">
                {dailyStats.reduce((a, d) => a + d.warningsCount, 0)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02]">
              <p className="text-slate-500">14天总发散</p>
              <p className="font-mono text-xl font-bold text-slate-100 mt-1">
                {dailyStats.reduce((a, d) => a + d.divergenceCount, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
