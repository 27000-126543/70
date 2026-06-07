import { useParamStore } from '../stores/paramsStore';
import { useSimulationStore } from '../stores/simulationStore';
import { formatScientificNotation, formatDuration } from '../data/mockEngine';
import { TOPOLOGY_LABELS } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Target,
  Flame,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  TrendingUp,
  Zap,
  Brain,
  History,
  Star,
  Shield,
} from 'lucide-react';

export default function Recommendations() {
  const { recommendations, simulations } = useSimulationStore();
  const { applyRecommendation } = useParamStore();
  const navigate = useNavigate();

  const completedSims = simulations.filter((s) => s.status === 'completed');
  const highJetSims = completedSims
    .filter((s) => s.monitoringHistory.length > 5)
    .sort((a, b) => {
      const al = a.monitoringHistory[a.monitoringHistory.length - 1].jetPower;
      const bl = b.monitoringHistory[b.monitoringHistory.length - 1].jetPower;
      return bl - al;
    })
    .slice(0, 5);

  const handleApply = (rec: any) => {
    applyRecommendation(rec);
    navigate('/simulations/new');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-orbitron text-2xl font-bold text-slate-100 tracking-wide">智能推荐引擎</h1>
        <p className="text-sm text-slate-400 mt-1">
          基于 {completedSims.length} 次历史模拟自动推荐最优参数组合，预测稳定喷流概率
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { l: '历史模拟', v: completedSims.length, icon: History, c: 'text-plasma-400' },
          { l: '推荐模型', v: 'GRU-LSTM', icon: Brain, c: 'text-magnetic-400' },
          { l: '平均准确率', v: '91.3%', icon: Target, c: 'text-gravity-400' },
          { l: '高置信推荐', v: recommendations.length, icon: Star, c: 'text-accretion-400' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">{s.l}</span>
                <Icon className={`w-4 h-4 ${s.c}`} />
              </div>
              <p className="font-orbitron text-xl font-bold text-slate-100">{s.v}</p>
            </div>
          );
        })}
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="section-title mb-0">
            <Sparkles className="w-5 h-5 text-magnetic-400" />
            AI 推荐参数配置
          </h3>
          <span className="text-xs text-slate-500 font-mono">基于 {completedSims.length} 次历史训练数据</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {recommendations.map((rec, idx) => (
            <div
              key={rec.id}
              className="relative p-5 rounded-2xl bg-gradient-to-br from-magnetic-500/10 to-plasma-500/5 border border-magnetic-500/20 hover:border-magnetic-500/40 transition-all group overflow-hidden"
            >
              {idx === 0 && (
                <div className="absolute top-3 right-3">
                  <span className="badge-status bg-accretion-500/20 text-accretion-200 border border-accretion-500/30">
                    <Star className="w-3 h-3 mr-1 fill-accretion-500" />最佳
                  </span>
                </div>
              )}
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative w-16 h-16">
                    <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15" fill="none"
                        stroke={idx === 0 ? '#ffaa00' : '#a855f7'}
                        strokeWidth="3"
                        strokeDasharray={`${rec.jetStabilityProbability * 94.2} 94.2`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-orbitron text-lg font-bold text-slate-100">
                        {(rec.jetStabilityProbability * 100).toFixed(0)}%
                      </span>
                      <span className="text-[9px] text-slate-500">稳定概率</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-100">推荐配置 #{idx + 1}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Shield className="w-3 h-3 text-plasma-400" />
                      <span className="text-[10px] text-slate-400">置信度 {(rec.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      预测喷流: {formatScientificNotation(rec.expectedJetPower, 1)} erg/s
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 mb-4">
                  {[
                    ['黑洞质量', `${formatScientificNotation(rec.params.mass, 1)} M☉`],
                    ['自旋参数 a*', rec.params.spin.toFixed(3)],
                    ['磁场强度', `${rec.magneticField.strength.toFixed(2)} ×10⁸G`],
                    ['磁场拓扑', TOPOLOGY_LABELS[rec.magneticField.topology]],
                    ['初始扰动', rec.initialConditions.perturbation.toFixed(4)],
                  ].map(([l, v], i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-slate-500">{l}</span>
                      <span className="font-mono text-slate-200">{v}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleApply(rec)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-magnetic-500/20 to-plasma-500/20 border border-magnetic-500/40 text-plasma-100 text-sm font-medium inline-flex items-center justify-center gap-1.5 hover:from-magnetic-500/30 hover:to-plasma-500/30 transition-all group-hover:shadow-[0_0_20px_rgba(168,85,247,0.25)]"
                >
                  <Zap className="w-3.5 h-3.5" />
                  应用并创建模拟
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 glass-card p-5">
          <h3 className="section-title">
            <TrendingUp className="w-5 h-5 text-plasma-400" /> 历史高喷流功率案例
          </h3>
          {highJetSims.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">暂无足够历史数据</p>
          ) : (
            <div className="space-y-2">
              {highJetSims.map((sim, i) => {
                const last = sim.monitoringHistory[sim.monitoringHistory.length - 1];
                return (
                  <Link
                    key={sim.id}
                    to={`/simulations/${sim.id}`}
                    className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accretion-500/20 border border-accretion-500/30 flex items-center justify-center font-orbitron font-bold text-accretion-300">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{sim.name}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-mono flex-wrap">
                        <span>M = {formatScientificNotation(sim.params.mass, 1)}M☉</span>
                        <span>a* = {sim.params.spin.toFixed(2)}</span>
                        <span>B = {sim.magneticField.strength.toFixed(2)}</span>
                        <span>{TOPOLOGY_LABELS[sim.magneticField.topology]}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-accretion-400" />
                        <span className="font-mono text-sm text-slate-100">
                          {formatScientificNotation(last.jetPower, 2)}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        准直度 {last.jetCollimation.toFixed(2)} · {formatDuration(sim.elapsedTime)}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-plasma-400 transition-colors" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="glass-card p-5">
          <h3 className="section-title">
            <Brain className="w-5 h-5 text-magnetic-400" /> 模型洞察
          </h3>
          <div className="space-y-3">
            {[
              { t: '高自旋更易产生喷流', d: 'a* > 0.7 的模拟中，87% 观测到稳定准直射流', s: 'gravity' },
              { t: '螺旋磁场最优', d: '螺旋拓扑相比环形/极向平均喷流功率高 43%', s: 'magnetic' },
              { t: '扰动幅度建议', d: '初始扰动 δ ~ 0.01 左右最有利于 MRI 快速增长', s: 'plasma' },
              { t: '吸积率窗口', d: '0.05 < Ṁ/Ṁ_Edd < 0.5 区间数值稳定性最佳', s: 'accretion' },
              { t: '避免发散', d: '连续发散常与 B > 10 ×10⁸G 或 Ṁ > 10Ṁ_Edd 相关', s: 'alert' },
            ].map((ins, i) => {
              const colors: Record<string, string> = {
                gravity: 'bg-gravity-500/10 border-gravity-500/20 text-gravity-300',
                magnetic: 'bg-magnetic-500/10 border-magnetic-500/20 text-magnetic-300',
                plasma: 'bg-plasma-500/10 border-plasma-500/20 text-plasma-300',
                accretion: 'bg-accretion-500/10 border-accretion-500/20 text-accretion-300',
                alert: 'bg-alert-500/10 border-alert-500/20 text-alert-300',
              };
              return (
                <div key={i} className={`p-3 rounded-xl border ${colors[ins.s]}`}>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{ins.t}</p>
                      <p className="text-xs opacity-80 mt-0.5 leading-relaxed">{ins.d}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
