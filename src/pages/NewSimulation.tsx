import { useNavigate } from 'react-router-dom';
import { useParamStore } from '../stores/paramsStore';
import { useSimulationStore } from '../stores/simulationStore';
import { formatScientificNotation } from '../data/mockEngine';
import BlackHoleScene from '../components/three/BlackHoleScene';
import { TOPOLOGY_LABELS } from '../types';
import {
  Zap,
  RotateCcw,
  Play,
  Settings2,
  Magnet,
  Thermometer,
  Sparkles,
  Target,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useState } from 'react';

function ParamSlider({
  label, value, min, max, step, unit, onChange, logScale = false,
}: {
  label: string; value: number; min: number; max: number; step: number; unit: string;
  onChange: (v: number) => void; logScale?: boolean;
}) {
  const displayVal = logScale ? Math.pow(10, value) : value;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm text-slate-300 font-medium">{label}</label>
        <span className="font-mono text-sm text-plasma-300">
          {logScale ? formatScientificNotation(displayVal, 2) : displayVal.toFixed(3)} {unit}
        </span>
      </div>
      <input
        type="range"
        min={logScale ? Math.log10(min) : min}
        max={logScale ? Math.log10(max) : max}
        step={step}
        value={logScale ? Math.log10(value) : value}
        onChange={(e) => onChange(logScale ? Math.pow(10, parseFloat(e.target.value)) : parseFloat(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-[10px] text-slate-600 mt-0.5 font-mono">
        <span>{logScale ? formatScientificNotation(min, 1) : min}</span>
        <span>{logScale ? formatScientificNotation(max, 1) : max}</span>
      </div>
    </div>
  );
}

function SelectField({
  label, value, options, onChange,
}: {
  label: string; value: string; options: { label: string; value: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-sm text-slate-300 font-medium block mb-1.5">{label}</label>
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              value === opt.value
                ? 'bg-plasma-500/20 border border-plasma-500/40 text-plasma-200 shadow-[0_0_15px_rgba(0,212,255,0.15)]'
                : 'bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function NewSimulation() {
  const navigate = useNavigate();
  const {
    blackHole, magneticField, initialConditions,
    taskName, taskDescription, selectedSeriesId,
    setBlackHole, setMagneticField, setInitialConditions,
    setTaskName, setTaskDescription, setSelectedSeries, reset,
  } = useParamStore();
  const { createSimulation, recommendations, series } = useSimulationStore();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!taskName.trim()) return;
    const sim = createSimulation({
      name: taskName,
      params: blackHole,
      magneticField,
      initialConditions,
      description: taskDescription,
      parameterSeriesId: selectedSeriesId || undefined,
    });
    setSubmitted(true);
    setTimeout(() => navigate(`/simulations/${sim.id}`), 1200);
  };

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="glass-card p-12 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gravity-500/20 border border-gravity-500/40 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-gravity-400 animate-pulse" />
          </div>
          <h2 className="font-orbitron text-xl font-bold text-slate-100 mb-2">模拟任务已提交</h2>
          <p className="text-sm text-slate-400 mb-4">正在构建自适应网格并初始化GRMHD求解器...</p>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-plasma-500 via-magnetic-500 to-plasma-500 animate-pulse w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-orbitron text-2xl font-bold text-slate-100 tracking-wide">新建GRMHD模拟任务</h1>
          <p className="text-sm text-slate-400 mt-1">配置黑洞参数、磁场构型与初始条件，启动数值模拟</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={reset} className="btn-ghost inline-flex items-center gap-2 text-sm">
            <RotateCcw className="w-4 h-4" /> 重置参数
          </button>
          <button
            onClick={handleSubmit}
            disabled={!taskName.trim()}
            className="btn-accretion inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4" /> 启动模拟
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <h3 className="section-title">
              <Settings2 className="w-5 h-5 text-plasma-400" /> 基本信息
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300 font-medium block mb-1.5">任务名称 *</label>
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="例如：M87高自旋螺旋磁场模拟"
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 font-medium block mb-1.5">参数系列</label>
                <select
                  value={selectedSeriesId || ''}
                  onChange={(e) => setSelectedSeries(e.target.value || null)}
                  className="input-field"
                >
                  <option value="">独立任务</option>
                  {series.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-slate-300 font-medium block mb-1.5">描述</label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  rows={2}
                  placeholder="研究目的、物理场景说明..."
                  className="input-field resize-none"
                />
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="section-title">
              <Target className="w-5 h-5 text-accretion-400" /> 黑洞参数
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ParamSlider
                label="黑洞质量 M"
                value={blackHole.mass}
                min={1e6}
                max={1e10}
                step={0.1}
                unit="M☉"
                logScale
                onChange={(v) => setBlackHole({ mass: v })}
              />
              <ParamSlider
                label="自旋参数 a*"
                value={blackHole.spin}
                min={0}
                max={0.998}
                step={0.01}
                unit=""
                onChange={(v) => setBlackHole({ spin: v })}
              />
              <ParamSlider
                label="观测倾角"
                value={blackHole.inclination}
                min={0}
                max={90}
                step={1}
                unit="°"
                onChange={(v) => setBlackHole({ inclination: v })}
              />
              <ParamSlider
                label="初始吸积率 Ṁ"
                value={blackHole.accretionRate}
                min={0.001}
                max={100}
                step={0.01}
                unit="Ṁ_Edd"
                logScale
                onChange={(v) => setBlackHole({ accretionRate: v })}
              />
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="section-title">
              <Magnet className="w-5 h-5 text-magnetic-400" /> 磁场构型
            </h3>
            <div className="space-y-6">
              <ParamSlider
                label="磁场强度 B"
                value={magneticField.strength}
                min={0.01}
                max={100}
                step={0.05}
                unit="×10⁸ G"
                logScale
                onChange={(v) => setMagneticField({ strength: v })}
              />
              <SelectField
                label="磁场拓扑结构"
                value={magneticField.topology}
                options={Object.entries(TOPOLOGY_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                onChange={(v) => setMagneticField({ topology: v as any })}
              />
              <SelectField
                label="磁通量分布"
                value={magneticField.fluxDistribution}
                options={[
                  { value: 'uniform', label: '均匀' },
                  { value: 'gaussian', label: '高斯' },
                  { value: 'power-law', label: '幂律' },
                ]}
                onChange={(v) => setMagneticField({ fluxDistribution: v as any })}
              />
              {magneticField.fluxDistribution === 'power-law' && (
                <ParamSlider
                  label="幂律指数"
                  value={magneticField.fluxExponent}
                  min={-2}
                  max={1}
                  step={0.1}
                  unit=""
                  onChange={(v) => setMagneticField({ fluxExponent: v })}
                />
              )}
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="section-title">
              <Thermometer className="w-5 h-5 text-jet-400" /> 初始条件
            </h3>
            <div className="space-y-6">
              <SelectField
                label="密度分布剖面"
                value={initialConditions.densityProfile}
                options={[
                  { value: 'isothermal', label: '等温' },
                  { value: 'adiabatic', label: '绝热' },
                  { value: 'power-law', label: '幂律' },
                ]}
                onChange={(v) => setInitialConditions({ densityProfile: v as any })}
              />
              <SelectField
                label="角速度分布"
                value={initialConditions.angularVelocity}
                options={[
                  { value: 'keplerian', label: '开普勒' },
                  { value: 'sub-keplerian', label: '亚开普勒' },
                  { value: 'super-keplerian', label: '超开普勒' },
                ]}
                onChange={(v) => setInitialConditions({ angularVelocity: v as any })}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ParamSlider
                  label="初始温度"
                  value={initialConditions.temperature}
                  min={0.1}
                  max={10}
                  step={0.1}
                  unit="×10¹¹K"
                  onChange={(v) => setInitialConditions({ temperature: v })}
                />
                <ParamSlider
                  label="初始扰动幅度"
                  value={initialConditions.perturbation}
                  min={0.001}
                  max={0.1}
                  step={0.001}
                  unit=""
                  onChange={(v) => setInitialConditions({ perturbation: v })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-5">
            <h3 className="section-title text-base mb-3">
              <Zap className="w-4 h-5 text-plasma-400" />
              实时预览
            </h3>
            <BlackHoleScene spin={blackHole.spin} height={280} />
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-white/[0.03]">
                <p className="data-label">自旋</p>
                <p className="font-mono text-slate-200">a* = {blackHole.spin.toFixed(3)}</p>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.03]">
                <p className="data-label">倾角</p>
                <p className="font-mono text-slate-200">{blackHole.inclination.toFixed(0)}°</p>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.03]">
                <p className="data-label">磁场拓扑</p>
                <p className="font-mono text-slate-200">{TOPOLOGY_LABELS[magneticField.topology]}</p>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.03]">
                <p className="data-label">磁场强度</p>
                <p className="font-mono text-slate-200">{magneticField.strength.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="section-title text-base mb-3">
              <Sparkles className="w-4 h-5 text-magnetic-400" />
              AI 智能推荐
            </h3>
            <div className="space-y-2.5">
              {recommendations.slice(0, 2).map((rec) => (
                <div
                  key={rec.id}
                  className="p-3 rounded-xl bg-gradient-to-br from-magnetic-500/10 border border-magnetic-500/20 hover:border-magnetic-500/40 transition-all cursor-pointer group"
                  onClick={() => {
                    useParamStore.getState().applyRecommendation(rec);
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="relative w-10 h-10">
                        <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
                          <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                          <circle
                            cx="18" cy="18" r="15" fill="none"
                            stroke="#a855f7" strokeWidth="3"
                            strokeDasharray={`${rec.jetStabilityProbability * 94.2} 94.2`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-magnetic-300 font-mono">
                          {(rec.jetStabilityProbability * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-200">稳定喷流推荐</p>
                        <p className="text-[10px] text-slate-500">置信度 {(rec.confidence * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
                    M={formatScientificNotation(rec.params.mass, 1)}M☉ · a*={rec.params.spin.toFixed(2)} · B={rec.magneticField.strength.toFixed(2)}
                  </p>
                  <button className="mt-2 w-full text-[10px] text-magnetic-300 group-hover:text-magnetic-200 inline-flex items-center justify-center gap-1 py-1">
                    应用此配置 <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-accretion-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-200">求解器配置</p>
                <ul className="mt-1.5 text-[10px] text-slate-400 space-y-0.5 font-mono">
                  <li>· 自适应网格: 4 级 AMR</li>
                  <li>· 基网格: 64³ 均匀</li>
                  <li>· 时间方案: RK3 + CFL=0.5</li>
                  <li>· 重建方式: WENO-5</li>
                  <li>· 总步数: 5,000</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
