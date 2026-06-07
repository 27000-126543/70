import { useParams, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useSimulationStore } from '../stores/simulationStore';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  TOPOLOGY_LABELS,
  WARNING_LABELS,
  APPROVAL_LABELS,
} from '../types';
import { MRILineChart, JetPowerChart, AccretionRateChart, SpectrumChart, SEDChart, LightCurveChart } from '../components/charts/Charts';
import BlackHoleScene from '../components/three/BlackHoleScene';
import MagneticField3DView from '../components/three/MagneticField3DView';
import { formatScientificNotation, formatDuration, generateId } from '../data/mockEngine';
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Grid3x3,
  Activity,
  Flame,
  Atom,
  FileCheck2,
  Send,
  RotateCcw,
  MessageSquare,
  ChevronRight,
  Zap,
  Magnet,
  Thermometer,
  Target,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';

const STATUS_FLOW = ['pending_validation', 'mesh_generation', 'initializing', 'evolving', 'radiation_synthesis', 'completed'] as const;

export default function SimulationDetail() {
  const { id } = useParams<{ id: string }>();
  const { simulations, setCurrentSimulation, currentSimulation, addApproval, setApprovalStatus, reviewWarning, addAdjustmentLog } =
    useSimulationStore();
  const [reviewComment, setReviewComment] = useState('');
  const [activeWarning, setActiveWarning] = useState<string | null>(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [viewTab, setViewTab] = useState<'monitor' | 'viz' | 'approval' | 'logs'>('monitor');

  useEffect(() => {
    if (id) setCurrentSimulation(id);
    return () => setCurrentSimulation(null);
  }, [id]);

  const sim = currentSimulation || simulations.find((s) => s.id === id);
  if (!sim) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-slate-400">加载中...</p>
      </div>
    );
  }

  const monitoringChart = sim.monitoringHistory.slice(-80).map((m, i) => ({
    step: i,
    mriGrowthRate: m.mriGrowthRate,
    theoretical: 0.5,
    jetPower: m.jetPower / 1e43,
    jetCollimation: m.jetCollimation,
    accretionRate: m.accretionRate,
    threshold: 0.05,
  }));

  const handleWarningReview = (warningId: string, approved: boolean) => {
    reviewWarning(sim.id, warningId, '当前用户', reviewComment || (approved ? '已确认，参数合理' : '需要进一步调查'), approved);
    if (approved) {
      addAdjustmentLog(sim.id, {
        id: generateId(),
        simulationId: sim.id,
        timestamp: Date.now(),
        adjustedParams: { perturbation: sim.initialConditions.perturbation * 1.2 },
        reason: reviewComment || '基于复核意见调整初始扰动',
        reviewedBy: '当前用户',
      });
    }
    setActiveWarning(null);
    setReviewComment('');
  };

  const handleApproval = (type: 'postdoc' | 'professor', approved: boolean) => {
    addApproval(sim.id, {
      id: generateId(),
      simulationId: sim.id,
      type: type === 'postdoc' ? 'postdoc_validation' : 'professor_confirmation',
      approver: type === 'postdoc' ? '博士后' : '教授',
      decision: approved ? 'approved' : 'rejected',
      comment: approvalComment || (approved ? '数值稳定性良好，符合预期' : '存在异常需要调整'),
      numericalStability:
        type === 'postdoc'
          ? { convergenceRate: 1.98, energyConservation: 0.998, divergence: false }
          : undefined,
      physicalValidity:
        type === 'professor'
          ? { jetStability: 0.88, mriSaturation: true, comparisonWithObservations: '与理论预期一致' }
          : undefined,
      timestamp: Date.now(),
    });
    if (approved) {
      setApprovalStatus(
        sim.id,
        type === 'postdoc' ? 'postdoc_approved' : 'professor_approved'
      );
    } else {
      setApprovalStatus(sim.id, 'rejected');
    }
    setApprovalComment('');
  };

  const isCompleted = sim.status === 'completed';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link to="/simulations" className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-plasma-500/30 transition-all">
            <ArrowLeft className="w-4 h-4 text-slate-300" />
          </Link>
          <div>
            <h1 className="font-orbitron text-xl font-bold text-slate-100 tracking-wide">{sim.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`badge-status border ${STATUS_COLORS[sim.status]}`}>
                {STATUS_LABELS[sim.status]}
              </span>
              <span className="text-xs text-slate-500">ID: {sim.id.slice(0, 8)}...</span>
              <span className="text-xs text-slate-500">· 创建者: {sim.createdBy}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isCompleted && sim.approvalStatus === 'professor_approved' && (
            <button className="btn-primary inline-flex items-center gap-2 text-sm">
              <Send className="w-4 h-4" /> 推送至观测提案系统
            </button>
          )}
          <button className="btn-ghost inline-flex items-center gap-2 text-sm">
            <RotateCcw className="w-4 h-4" /> 重新模拟
          </button>
        </div>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-300">状态流转</h3>
          <span className="text-xs text-slate-500 font-mono">
            运行时长: {formatDuration(sim.elapsedTime)} · 步数 {sim.currentStep.toLocaleString()}/{sim.totalSteps.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {STATUS_FLOW.map((st, i) => {
            const currentIdx = STATUS_FLOW.indexOf(sim.status as typeof STATUS_FLOW[number]);
            const isActive = sim.status === st;
            const isPast = (STATUS_FLOW.indexOf(sim.status as typeof STATUS_FLOW[number]) > i && currentIdx >= 0) || sim.status === 'completed';
            const Icon = [Clock, Grid3x3, Zap, Play, Flame, CheckCircle2][i];
            return (
              <div key={st} className="flex-1 flex items-center gap-2">
                <div className={`flex flex-col items-center flex-1 min-w-0 ${isActive ? 'opacity-100' : isPast ? 'opacity-80' : 'opacity-40'}`}>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      isPast
                        ? 'bg-gravity-500/20 border-gravity-500/50 text-gravity-400'
                        : isActive
                        ? 'bg-plasma-500/20 border-plasma-500 text-plasma-300 animate-pulse'
                        : 'bg-white/5 border-white/10 text-slate-500'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1.5 text-center whitespace-nowrap">{STATUS_LABELS[st]}</span>
                </div>
                {i < STATUS_FLOW.length - 1 && (
                  <div className={`h-px flex-shrink-0 w-8 ${isPast ? 'bg-gravity-500/40' : 'bg-white/10'}`} />
                )}
              </div>
            );
          })}
          {sim.status === 'error_fallback' && (
            <div className="flex items-center gap-2 ml-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-alert-500/20 border-2 border-alert-500/50 text-alert-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-alert-400">异常回退</span>
            </div>
          )}
        </div>
        {sim.status === 'evolving' && (
          <div className="mt-4">
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-plasma-500 via-magnetic-500 to-plasma-500 transition-all"
                style={{ width: `${sim.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-accretion-400" />
            <h4 className="text-xs font-medium text-slate-300">黑洞参数</h4>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">质量</span>
              <span className="font-mono text-slate-200">{formatScientificNotation(sim.params.mass, 1)}M☉</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">自旋 a*</span>
              <span className="font-mono text-slate-200">{sim.params.spin.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">倾角</span>
              <span className="font-mono text-slate-200">{sim.params.inclination.toFixed(0)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">吸积率</span>
              <span className="font-mono text-slate-200">{sim.params.accretionRate.toFixed(3)}Ṁ_Edd</span>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Magnet className="w-4 h-4 text-magnetic-400" />
            <h4 className="text-xs font-medium text-slate-300">磁场构型</h4>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">强度</span>
              <span className="font-mono text-slate-200">{sim.magneticField.strength.toFixed(2)}×10⁸G</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">拓扑</span>
              <span className="font-mono text-slate-200">{TOPOLOGY_LABELS[sim.magneticField.topology]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">通量分布</span>
              <span className="font-mono text-slate-200">{sim.magneticField.fluxDistribution}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">幂律指数</span>
              <span className="font-mono text-slate-200">{sim.magneticField.fluxExponent.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Thermometer className="w-4 h-4 text-jet-400" />
            <h4 className="text-xs font-medium text-slate-300">初始条件</h4>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">密度分布</span>
              <span className="font-mono text-slate-200">{sim.initialConditions.densityProfile}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">角速度</span>
              <span className="font-mono text-slate-200">{sim.initialConditions.angularVelocity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">温度</span>
              <span className="font-mono text-slate-200">{sim.initialConditions.temperature.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">扰动</span>
              <span className="font-mono text-slate-200">{sim.initialConditions.perturbation.toFixed(4)}</span>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck2 className="w-4 h-4 text-gravity-400" />
            <h4 className="text-xs font-medium text-slate-300">审批状态</h4>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">当前状态</span>
              <span className="font-mono text-slate-200">{APPROVAL_LABELS[sim.approvalStatus]}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">预警次数</span>
              <span className={`font-mono ${sim.warnings.length > 2 ? 'text-alert-400' : 'text-slate-200'}`}>{sim.warnings.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">调整日志</span>
              <span className="font-mono text-slate-200">{sim.adjustmentLog.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">发散次数</span>
              <span className={`font-mono ${sim.divergenceCount >= 3 ? 'text-alert-400' : 'text-slate-200'}`}>{sim.divergenceCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-white/10">
        {([
          { k: 'monitor', l: '实时监控', icon: Activity },
          { k: 'viz', l: '结果可视化', icon: Atom },
          { k: 'approval', l: '审批工作流', icon: FileCheck2 },
          { k: 'logs', l: '预警与日志', icon: MessageSquare },
        ] as const).map(({ k, l, icon: Icon }) => (
          <button
            key={k}
            onClick={() => setViewTab(k)}
            className={`px-5 py-3 text-sm font-medium transition-all border-b-2 -mb-px flex items-center gap-2 ${
              viewTab === k
                ? 'text-plasma-300 border-plasma-500'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            <Icon className="w-4 h-4" /> {l}
          </button>
        ))}
      </div>

      {viewTab === 'monitor' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="glass-card p-5">
            <h3 className="section-title text-base"><Activity className="w-4 h-4 text-plasma-400" /> MRI 增长率</h3>
            {monitoringChart.length > 2 ? (
              <MRILineChart data={monitoringChart} height={180} />
            ) : (
              <div className="h-[180px] flex items-center justify-center text-sm text-slate-500">等待监控数据...</div>
            )}
          </div>
          <div className="glass-card p-5">
            <h3 className="section-title text-base"><Flame className="w-4 h-4 text-accretion-400" /> 喷流功率 & 准直度</h3>
            {monitoringChart.length > 2 ? (
              <JetPowerChart data={monitoringChart} height={180} />
            ) : (
              <div className="h-[180px] flex items-center justify-center text-sm text-slate-500">等待监控数据...</div>
            )}
          </div>
          <div className="glass-card p-5 xl:col-span-2">
            <h3 className="section-title text-base"><Target className="w-4 h-4 text-magnetic-400" /> 吸积率演化</h3>
            {monitoringChart.length > 2 ? (
              <AccretionRateChart data={monitoringChart} height={180} />
            ) : (
              <div className="h-[180px] flex items-center justify-center text-sm text-slate-500">等待监控数据...</div>
            )}
          </div>
        </div>
      )}

      {viewTab === 'viz' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="glass-card p-5">
            <h3 className="section-title text-base"><Atom className="w-4 h-4 text-plasma-400" /> 系统概览</h3>
            <BlackHoleScene spin={sim.params.spin} height={320} />
          </div>
          <div className="glass-card p-5">
            <h3 className="section-title text-base"><Magnet className="w-4 h-4 text-magnetic-400" /> 磁场结构三维渲染</h3>
            {sim.magneticField3D ? (
              <MagneticField3DView data={sim.magneticField3D} height={320} />
            ) : (
              <div className="h-[320px] flex items-center justify-center text-sm text-slate-500">模拟完成后生成磁场结构...</div>
            )}
          </div>
          {sim.radiationData && (
            <>
              <div className="glass-card p-5">
                <h3 className="section-title text-base">辐射光谱 F_ν</h3>
                <SpectrumChart data={sim.radiationData.spectrum} height={200} />
              </div>
              <div className="glass-card p-5">
                <h3 className="section-title text-base">能谱分布 (SED)</h3>
                <SEDChart data={sim.radiationData.sed} height={200} />
              </div>
              <div className="glass-card p-5 xl:col-span-2">
                <h3 className="section-title text-base">多波段光变曲线</h3>
                <LightCurveChart data={sim.radiationData.lightCurve} height={220} />
              </div>
            </>
          )}
        </div>
      )}

      {viewTab === 'approval' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-4">
            <div className="glass-card p-5">
              <h3 className="section-title text-base mb-4">审批流程时间线</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gravity-500/20 border border-gravity-500/40 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-gravity-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-200 font-medium">模拟计算完成</p>
                    <p className="text-xs text-slate-500">{sim.endTime ? new Date(sim.endTime).toLocaleString() : '进行中'}</p>
                  </div>
                </div>
                {sim.approvals.map((a) => (
                  <div key={a.id} className="flex gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        a.decision === 'approved'
                          ? 'bg-gravity-500/20 border border-gravity-500/40'
                          : 'bg-alert-500/20 border border-alert-500/40'
                      }`}
                    >
                      {a.decision === 'approved' ? (
                        <CheckCircle2 className="w-4 h-4 text-gravity-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-alert-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-slate-200 font-medium">
                        {a.type === 'postdoc_validation' ? '博士后验证' : '教授确认'} - {a.decision === 'approved' ? '通过' : '驳回'}
                      </p>
                      <p className="text-xs text-slate-500">{a.approver} · {new Date(a.timestamp).toLocaleString()}</p>
                      <p className="text-xs text-slate-400 mt-1 bg-white/[0.03] p-2 rounded-lg">{a.comment}</p>
                    </div>
                  </div>
                ))}
                {sim.approvalStatus === 'pending' && isCompleted && (
                  <div className="flex gap-3 opacity-60">
                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center flex-shrink-0">
                      <FileCheck2 className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 font-medium">待博士后验证</p>
                    </div>
                  </div>
                )}
                {(sim.approvalStatus === 'postdoc_approved') && isCompleted && (
                  <div className="flex gap-3 opacity-60">
                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center flex-shrink-0">
                      <FileCheck2 className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 font-medium">待教授确认</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {isCompleted && sim.approvalStatus !== 'professor_approved' && sim.approvalStatus !== 'pushed_to_proposal' && (
            <div className="glass-card p-5 h-fit">
              <h3 className="section-title text-base mb-4">执行审批</h3>
              <div className="space-y-3">
                <textarea
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  rows={4}
                  placeholder="审批意见..."
                  className="input-field resize-none"
                />
                {sim.approvalStatus === 'pending' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleApproval('postdoc', true)} className="btn-primary text-sm py-2">
                      <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> 博士后通过
                    </button>
                    <button onClick={() => handleApproval('postdoc', false)} className="btn-danger text-sm py-2">
                      <XCircle className="w-3.5 h-3.5 inline mr-1" /> 驳回
                    </button>
                  </div>
                )}
                {sim.approvalStatus === 'postdoc_approved' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleApproval('professor', true)} className="btn-accretion text-sm py-2">
                      <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> 教授确认
                    </button>
                    <button onClick={() => handleApproval('professor', false)} className="btn-danger text-sm py-2">
                      <XCircle className="w-3.5 h-3.5 inline mr-1" /> 驳回
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {viewTab === 'logs' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="glass-card p-5">
            <h3 className="section-title text-base mb-4">预警事件 ({sim.warnings.length})</h3>
            {sim.warnings.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">暂无预警事件</p>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-2">
                {sim.warnings.map((w) => (
                  <div
                    key={w.id}
                    className={`p-3 rounded-xl border transition-all ${
                      w.level === 'critical'
                        ? 'bg-alert-500/10 border-alert-500/30'
                        : w.level === 'warning'
                        ? 'bg-accretion-500/10 border-accretion-500/30'
                        : 'bg-plasma-500/10 border-plasma-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
                        <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          w.level === 'critical' ? 'text-alert-400' : w.level === 'warning' ? 'text-accretion-400' : 'text-plasma-400'
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-slate-200">{w.description}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {WARNING_LABELS[w.type]} · 阈值: {w.threshold} · 实际: {w.actualValue.toFixed(3)} · {new Date(w.timestamp).toLocaleString()}
                          </p>
                          {w.reviewed && (
                            <p className="text-xs text-slate-400 mt-1 italic">
                              {w.reviewedBy}: {w.reviewComment}
                            </p>
                          )}
                        </div>
                      </div>
                      {!w.reviewed && activeWarning !== w.id && (
                        <button
                          onClick={() => setActiveWarning(w.id)}
                          className="text-xs text-plasma-400 hover:text-plasma-300"
                        >
                          复核
                        </button>
                      )}
                      {w.reviewed && (
                        <span className="badge-status bg-gravity-500/20 text-gravity-300 border border-gravity-500/30">
                          已复核
                        </span>
                      )}
                    </div>
                    {activeWarning === w.id && (
                      <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          rows={2}
                          placeholder="复核意见..."
                          className="input-field text-xs resize-none"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleWarningReview(w.id, true)} className="btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1">
                            <ChevronRight className="w-3 h-3" /> 确认并调参重算
                          </button>
                          <button onClick={() => handleWarningReview(w.id, false)} className="btn-ghost text-xs py-1.5 px-3">
                            标记为误报
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card p-5">
            <h3 className="section-title text-base mb-4">参数调整日志 ({sim.adjustmentLog.length})</h3>
            {sim.adjustmentLog.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">暂无调整记录</p>
            ) : (
              <div className="space-y-2.5">
                {sim.adjustmentLog.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm text-slate-200 font-medium">{log.reason}</p>
                      <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-1">复核人: {log.reviewedBy}</p>
                    <div className="p-2 rounded-lg bg-space-900/60 text-xs font-mono text-plasma-300">
                      {Object.entries(log.adjustedParams).map(([k, v]) => (
                        <div key={k}>{k}: {typeof v === 'number' ? v.toFixed(4) : String(v)}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
