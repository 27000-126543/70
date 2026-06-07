import { useSimulationStore } from '../stores/simulationStore';
import BlackHoleScene from '../components/three/BlackHoleScene';
import { CompletionTrendChart } from '../components/charts/Charts';
import { STATUS_LABELS, STATUS_COLORS } from '../types';
import { formatDuration, formatScientificNotation } from '../data/mockEngine';
import { Link } from 'react-router-dom';
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Flame,
  Atom,
  ChevronRight,
  Zap,
  Target,
  TrendingUp,
  FileCheck2,
  Bell,
  Eye,
} from 'lucide-react';

const STATUS_ORDER = ['pending_validation', 'mesh_generation', 'initializing', 'evolving', 'radiation_synthesis', 'completed', 'error_fallback'] as const;

const statusIcons: Record<string, any> = {
  pending_validation: Clock,
  mesh_generation: Atom,
  initializing: Zap,
  evolving: Play,
  radiation_synthesis: Flame,
  completed: CheckCircle2,
  error_fallback: AlertTriangle,
};

export default function Dashboard() {
  const { simulations, dailyStats, getStatistics, getWarnings } = useSimulationStore();
  const stats = getStatistics();
  const unreviewedWarnings = getWarnings(true).slice(0, 5);
  const recentSims = simulations.slice(0, 4);

  const trendData = dailyStats.map((d) => ({
    ...d,
    completionRate: (d.completionRate * 100).toFixed(1),
    avgDurationHours: (d.averageDuration / 3600).toFixed(1),
  }));

  const kpiCards = [
    { label: '活跃任务', value: stats.running, icon: Play, color: 'text-plasma-400', bg: 'from-plasma-500/20', border: 'border-plasma-500/30', sub: 'GRMHD演化中' },
    { label: '今日完成', value: stats.completed, icon: CheckCircle2, color: 'text-gravity-400', bg: 'from-gravity-500/20', border: 'border-gravity-500/30', sub: '辐射合成完毕' },
    { label: '平均耗时', value: formatDuration(stats.avgDuration), icon: Clock, color: 'text-accretion-400', bg: 'from-accretion-500/20', border: 'border-accretion-500/30', sub: '已完成任务均值' },
    { label: '预警通知', value: stats.activeWarnings, icon: Bell, color: 'text-alert-400', bg: 'from-alert-500/20', border: 'border-alert-500/30', sub: '待物理学家复核' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 glass-card p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-accretion-gradient opacity-40 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-orbitron text-2xl font-bold tracking-wider text-slate-100">
                  黑洞吸积盘 GRMHD 模拟实验室
                </h2>
                <p className="text-sm text-slate-400 mt-1 max-w-lg leading-relaxed">
                  广义相对论磁流体动力学模拟 · 喷流反馈智能分析平台
                </p>
              </div>
              <Link to="/simulations/new" className="btn-primary inline-flex items-center gap-2">
                <Zap className="w-4 h-4" />
                新建模拟
              </Link>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-6">
              {kpiCards.map((k, i) => {
                const Icon = k.icon;
                return (
                  <div key={i} className={`bg-gradient-to-br ${k.bg} border ${k.border} rounded-2xl p-4 backdrop-blur-sm`}>
                    <div className="flex items-center justify-between mb-3">
                      <Icon className={`w-5 h-5 ${k.color}`} />
                    </div>
                    <p className="font-mono text-2xl font-bold text-slate-100">
                      {k.value}
                    </p>
                    <p className="text-sm text-slate-400">
                      {k.label}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {k.sub}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="glass-card p-5 overflow-hidden">
          <BlackHoleScene spin={0.8} height={360} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATUS_ORDER.map((st) => {
          const Icon = statusIcons[st];
          const count = stats.byStatus[st] || 0;
          const IconComp = Icon as any;
          return (
            <Link
              key={st}
              to="/simulations"
              className="glass-card glass-card-hover p-4 group"
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`badge-status border ${STATUS_COLORS[st]}`}>
                  <IconComp className="w-3.5 h-3.5" />
                  {STATUS_LABELS[st]}
                </span>
                <span className="font-mono text-2xl font-bold text-slate-100">
                  {count}
                </span>
              </div>
              <div className="mt-2">
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-plasma-500 to-magnetic-500 transition-all duration-700"
                    style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 tracking-wider uppercase">
                占比 {stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : 0}%
              </p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">
              <TrendingUp className="w-5 h-5 text-plasma-400" />
              近14天性能趋势
            </h3>
            <span className="text-xs text-slate-500 font-mono">更新于 {new Date().toLocaleDateString()}</span>
          </div>
          <CompletionTrendChart data={trendData} height={240} />
        </div>

        <div className="glass-card p-6">
          <h3 className="section-title mb-4">
            <Bell className="w-5 h-5 text-alert-400" />
            实时预警中心
          </h3>
          {unreviewedWarnings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-gravity-400 mb-2" />
              <p className="text-sm text-slate-400">暂无未处理预警</p>
              <p className="text-xs text-slate-500">所有系统运行正常</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {unreviewedWarnings.map((w: any) => (
                <div key={w.id} className="p-3 rounded-xl bg-alert-500/10 border border-alert-500/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-alert-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200">{w.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-500 font-mono">{w.simName}</span>
                        <span className="text-[10px] text-slate-600">·</span>
                        <span className="text-[10px] text-slate-500">{new Date(w.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link to="/monitoring" className="btn-ghost mt-4 w-full inline-flex justify-center items-center gap-2 text-xs">
            查看全部预警
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">
              <Target className="w-5 h-5 text-magnetic-400" />
              最近模拟任务
            </h3>
            <Link to="/simulations" className="text-xs text-plasma-400 hover:text-plasma-300 inline-flex items-center gap-1">
              全部任务 <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentSims.map((sim) => (
              <Link
                key={sim.id}
                to={`/simulations/${sim.id}`}
                className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-plasma-500/20 border border-plasma-500/30 flex items-center justify-center flex-shrink-0">
                  <Atom className="w-5 h-5 text-plasma-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-200 font-medium truncate">{sim.name}</p>
                    <span className={`badge-status border ${STATUS_COLORS[sim.status]}`}>
                      {STATUS_LABELS[sim.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-mono">
                    <span>M = {formatScientificNotation(sim.params.mass, 1)}M☉</span>
                    <span>a* = {sim.params.spin.toFixed(2)}</span>
                    <span>B = {sim.magneticField.strength.toFixed(2)}</span>
                  </div>
                  {sim.status === 'evolving' && (
                    <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-plasma-500 via-magnetic-500 transition-all"
                        style={{ width: `${sim.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                <Eye className="w-4 h-4 text-slate-600 group-hover:text-plasma-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">
              <FileCheck2 className="w-5 h-5 text-accretion-400" />
              审批待办
            </h3>
            <Link to="/approvals" className="text-xs text-plasma-400 hover:text-plasma-300 inline-flex items-center gap-1">
              全部审批 <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {(() => {
            const pending = simulations.filter(
              (s) => s.status === 'completed' && s.approvalStatus !== 'professor_approved' && s.approvalStatus !== 'pushed_to_proposal'
            ).slice(0, 4);
            if (pending.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="w-10 h-10 text-gravity-400 mb-2" />
                  <p className="text-sm text-slate-400">暂无待审批任务</p>
                </div>
              );
            }
            return (
              <div className="space-y-2.5">
                {pending.map((sim) => (
                  <div key={sim.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-200 font-medium truncate">{sim.name}</p>
                      <span className="badge-status bg-accretion-500/20 text-accretion-200 border border-accretion-500/30">
                        {sim.approvalStatus === 'pending' ? '待博士后验证' : '待教授确认'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-mono">
                      提交于 {sim.endTime ? new Date(sim.endTime).toLocaleDateString() : 'N/A'} · {sim.createdBy}
                    </p>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
