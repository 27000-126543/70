import { useSimulationStore } from '../stores/simulationStore';
import { STATUS_LABELS, STATUS_COLORS, WARNING_LABELS } from '../types';
import { MRILineChart, JetPowerChart, AccretionRateChart } from '../components/charts/Charts';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Eye,
  Atom,
  Target,
  Flame,
  Magnet,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { formatScientificNotation } from '../data/mockEngine';

export default function Monitoring() {
  const { simulations, getWarnings } = useSimulationStore();
  const warnings = getWarnings(true);
  const activeSims = simulations.filter((s) => s.status === 'evolving' || s.status === 'initializing' || s.status === 'mesh_generation');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-orbitron text-2xl font-bold text-slate-100 tracking-wide">实时监控中心</h1>
        <p className="text-sm text-slate-400 mt-1">
          活跃任务 {activeSims.length} 个 · 未处理预警 {warnings.length} 条
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'MRI 监控', val: activeSims.reduce((a, s) => a + (s.monitoringHistory.length > 0 ? s.monitoringHistory[s.monitoringHistory.length - 1].mriGrowthRate : 0), 0) / Math.max(1, activeSims.length), unit: '', icon: Activity, color: 'text-plasma-400' },
          { label: '喷流功率', val: activeSims.reduce((a, s) => a + (s.monitoringHistory.length > 0 ? s.monitoringHistory[s.monitoringHistory.length - 1].jetPower : 0), 0) / Math.max(1, activeSims.length) / 1e43, unit: '×10⁴³ erg/s', icon: Flame, color: 'text-accretion-400' },
          { label: '吸积率均值', val: activeSims.reduce((a, s) => a + (s.monitoringHistory.length > 0 ? s.monitoringHistory[s.monitoringHistory.length - 1].accretionRate : 0), 0) / Math.max(1, activeSims.length), unit: 'Ṁ_Edd', icon: Target, color: 'text-magnetic-400' },
          { label: '预警密度', val: warnings.length, unit: '条', icon: AlertTriangle, color: warnings.length > 3 ? 'text-alert-400' : 'text-gravity-400' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">{s.label}</span>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="font-mono text-xl font-bold text-slate-100">
                {typeof s.val === 'number' ? s.val.toFixed(3) : s.val}
              </p>
              <p className="text-[10px] text-slate-500">{s.unit}</p>
            </div>
          );
        })}
      </div>

      {warnings.length > 0 && (
        <div className="glass-card p-5 border border-alert-500/30">
          <h3 className="section-title text-alert-400">
            <AlertTriangle className="w-5 h-5" /> 待处理预警 ({warnings.length})
          </h3>
          <div className="space-y-2">
            {warnings.slice(0, 6).map((w: any) => (
              <div key={w.id} className="flex items-center gap-3 p-3 rounded-xl bg-alert-500/5 border border-alert-500/20">
                <div className={`w-2 h-2 rounded-full ${w.level === 'critical' ? 'bg-alert-500 animate-pulse' : w.level === 'warning' ? 'bg-accretion-500' : 'bg-plasma-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-200 truncate">{w.description}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-400">
                      {WARNING_LABELS[w.type]}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    {w.simName} · {new Date(w.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <Link to={`/simulations/${w.simulationId}`} className="text-xs text-plasma-400 hover:text-plasma-300 inline-flex items-center gap-1">
                  处理 <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="section-title">活跃任务监控</h2>
        {activeSims.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Atom className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">当前没有正在运行的模拟任务</p>
            <Link to="/simulations/new" className="btn-primary mt-4 inline-flex items-center gap-2">
              <Zap className="w-4 h-4" /> 启动新模拟
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {activeSims.map((sim) => {
              const chartData = sim.monitoringHistory.slice(-60).map((m, i) => ({
                step: i,
                mriGrowthRate: m.mriGrowthRate,
                theoretical: 0.5,
                jetPower: m.jetPower / 1e43,
                jetCollimation: m.jetCollimation,
                accretionRate: m.accretionRate,
                threshold: 0.05,
              }));
              return (
                <div key={sim.id} className="glass-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-plasma-500/20 border border-plasma-500/30 flex items-center justify-center">
                        <Atom className="w-5 h-5 text-plasma-400 animate-pulse" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-100">{sim.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`badge-status border ${STATUS_COLORS[sim.status]}`}>
                            {STATUS_LABELS[sim.status]}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            M={formatScientificNotation(sim.params.mass, 1)}M☉ · a*={sim.params.spin.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link to={`/simulations/${sim.id}`} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <Eye className="w-4 h-4 text-slate-400" />
                    </Link>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>进度 {sim.progress.toFixed(1)}%</span>
                      <span className="font-mono">{sim.currentStep.toLocaleString()} / {sim.totalSteps.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-plasma-500 via-magnetic-500 transition-all" style={{ width: `${sim.progress}%` }} />
                    </div>
                  </div>
                  {chartData.length > 5 && (
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
                          <Activity className="w-3 h-3 text-plasma-400" /> MRI 增长率
                        </p>
                        <MRILineChart data={chartData} height={80} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
                            <Flame className="w-3 h-3 text-accretion-400" /> 喷流功率
                          </p>
                          <JetPowerChart data={chartData} height={70} />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
                            <Magnet className="w-3 h-3 text-magnetic-400" /> 吸积率
                          </p>
                          <AccretionRateChart data={chartData} height={70} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
