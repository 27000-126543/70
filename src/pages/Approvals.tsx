import { useSimulationStore } from '../stores/simulationStore';
import { Link } from 'react-router-dom';
import { STATUS_COLORS, STATUS_LABELS, APPROVAL_LABELS } from '../types';
import { formatScientificNotation, formatDuration, generateId } from '../data/mockEngine';
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Send,
  Eye,
  User,
  UserCheck,
  GraduationCap,
} from 'lucide-react';
import { useState } from 'react';

export default function Approvals() {
  const { simulations, addApproval, setApprovalStatus } = useSimulationStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'postdoc' | 'professor' | 'approved' | 'rejected'>('all');
  const [activeSim, setActiveSim] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  const pending = simulations.filter(
    (s) => s.status === 'completed' && s.approvalStatus !== 'pushed_to_proposal'
  );

  const filtered = pending.filter((s) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return s.approvalStatus === 'pending';
    if (filter === 'postdoc') return s.approvalStatus === 'pending';
    if (filter === 'professor') return s.approvalStatus === 'postdoc_approved';
    if (filter === 'approved') return s.approvalStatus === 'professor_approved';
    if (filter === 'rejected') return s.approvalStatus === 'rejected';
    return true;
  });

  const stats = {
    total: pending.length,
    pending: pending.filter((s) => s.approvalStatus === 'pending').length,
    postdocApproved: pending.filter((s) => s.approvalStatus === 'postdoc_approved').length,
    professorApproved: pending.filter((s) => s.approvalStatus === 'professor_approved').length,
    rejected: pending.filter((s) => s.approvalStatus === 'rejected').length,
  };

  const handleApprove = (simId: string, type: 'postdoc' | 'professor') => {
    addApproval(simId, {
      id: generateId(),
      simulationId: simId,
      type: type === 'postdoc' ? 'postdoc_validation' : 'professor_confirmation',
      approver: type === 'postdoc' ? '博士后研究员' : '教授',
      decision: 'approved',
      comment: comment || (type === 'postdoc' ? '数值稳定性良好，收敛性符合预期' : '物理图像合理，可用于后续分析'),
      numericalStability:
        type === 'postdoc' ? { convergenceRate: 1.98, energyConservation: 0.998, divergence: false } : undefined,
      physicalValidity:
        type === 'professor' ? { jetStability: 0.9, mriSaturation: true, comparisonWithObservations: '与观测数据匹配良好' } : undefined,
      timestamp: Date.now(),
    });
    setApprovalStatus(simId, type === 'postdoc' ? 'postdoc_approved' : 'professor_approved');
    setActiveSim(null);
    setComment('');
  };

  const handleReject = (simId: string, type: 'postdoc' | 'professor') => {
    addApproval(simId, {
      id: generateId(),
      simulationId: simId,
      type: type === 'postdoc' ? 'postdoc_validation' : 'professor_confirmation',
      approver: type === 'postdoc' ? '博士后研究员' : '教授',
      decision: 'rejected',
      comment: comment || '需要重新调整参数后再次提交',
      timestamp: Date.now(),
    });
    setApprovalStatus(simId, 'rejected');
    setActiveSim(null);
    setComment('');
  };

  const handlePush = (simId: string) => {
    setApprovalStatus(simId, 'pushed_to_proposal');
    setActiveSim(null);
  };

  const filterOptions: { k: typeof filter; l: string; c: string }[] = [
    { k: 'all', l: '全部', c: `${pending.length}` },
    { k: 'pending', l: '待验证', c: `${stats.pending}` },
    { k: 'professor', l: '待确认', c: `${stats.postdocApproved}` },
    { k: 'approved', l: '已通过', c: `${stats.professorApproved}` },
    { k: 'rejected', l: '已驳回', c: `${stats.rejected}` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-orbitron text-2xl font-bold text-slate-100 tracking-wide">审批工作流</h1>
          <p className="text-sm text-slate-400 mt-1">模拟结果需经博士后验证和教授确认两级审批</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { l: '待处理', v: stats.pending + stats.postdocApproved, icon: Clock, c: 'text-plasma-400' },
          { l: '待博士后验证', v: stats.pending, icon: User, c: 'text-magnetic-400' },
          { l: '待教授确认', v: stats.postdocApproved, icon: UserCheck, c: 'text-accretion-400' },
          { l: '已通过', v: stats.professorApproved, icon: CheckCircle2, c: 'text-gravity-400' },
          { l: '已驳回', v: stats.rejected, icon: XCircle, c: 'text-alert-400' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">{s.l}</span>
                <Icon className={`w-4 h-4 ${s.c}`} />
              </div>
              <p className="font-mono text-2xl font-bold text-slate-100">{s.v}</p>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 flex-wrap">
        {filterOptions.map((f) => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              filter === f.k
                ? 'bg-plasma-500/20 border border-plasma-500/40 text-plasma-200'
                : 'bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200'
            }`}
          >
            {f.l} <span className="opacity-60">({f.c})</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <FileCheck2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">当前没有需要审批的模拟任务</p>
          </div>
        ) : (
          filtered.map((sim) => (
            <div key={sim.id} className="glass-card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accretion-500/20 border border-accretion-500/30 flex items-center justify-center flex-shrink-0">
                    <FileCheck2 className="w-6 h-6 text-accretion-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-base font-semibold text-slate-100">{sim.name}</p>
                      <span className={`badge-status border ${STATUS_COLORS[sim.status]}`}>
                        {STATUS_LABELS[sim.status]}
                      </span>
                      <span
                        className={`badge-status border ${
                          sim.approvalStatus === 'professor_approved' || sim.approvalStatus === 'pushed_to_proposal'
                            ? 'bg-gravity-500/20 text-gravity-200 border-gravity-500/30'
                            : sim.approvalStatus === 'postdoc_approved'
                            ? 'bg-plasma-500/20 text-plasma-200 border-plasma-500/30'
                            : sim.approvalStatus === 'rejected'
                            ? 'bg-alert-500/20 text-alert-200 border-alert-500/30'
                            : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                        }`}
                      >
                        {APPROVAL_LABELS[sim.approvalStatus]}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500 font-mono flex-wrap">
                      <span>M = {formatScientificNotation(sim.params.mass, 1)}M☉</span>
                      <span>a* = {sim.params.spin.toFixed(3)}</span>
                      <span>B = {sim.magneticField.strength.toFixed(2)}×10⁸G</span>
                      <span>耗时 {formatDuration(sim.elapsedTime)}</span>
                      <span>创建者 {sim.createdBy}</span>
                    </div>
                    {sim.approvals.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {sim.approvals.map((a) => (
                          <div key={a.id} className="flex items-start gap-2 text-xs">
                            {a.type === 'postdoc_validation' ? (
                              <GraduationCap className="w-3.5 h-3.5 text-plasma-400 mt-0.5" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5 text-gravity-400 mt-0.5" />
                            )}
                            <div>
                              <span className={a.decision === 'approved' ? 'text-gravity-400' : 'text-alert-400'}>
                                {a.type === 'postdoc_validation' ? '博士后' : '教授'} {a.approver} - {a.decision === 'approved' ? '通过' : '驳回'}
                              </span>
                              <span className="text-slate-600 mx-1">·</span>
                              <span className="text-slate-500">{new Date(a.timestamp).toLocaleString()}</span>
                              <p className="text-slate-400 mt-0.5 bg-white/[0.02] p-2 rounded-lg border border-white/[0.03]">
                                {a.comment}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Link to={`/simulations/${sim.id}`} className="btn-ghost text-xs px-3 py-1.5 inline-flex items-center gap-1">
                    <Eye className="w-3 h-3" /> 查看详情
                  </Link>
                  {sim.approvalStatus === 'pushed_to_proposal' ? (
                    <span className="badge-status bg-gravity-500/20 text-gravity-200 border border-gravity-500/30">
                      <Send className="w-3 h-3 mr-1" /> 已推送
                    </span>
                  ) : (
                    <button
                      onClick={() => setActiveSim(activeSim === sim.id ? null : sim.id)}
                      className="btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1"
                    >
                      {activeSim === sim.id ? '收起' : '执行审批'} <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {activeSim === sim.id && sim.approvalStatus !== 'pushed_to_proposal' && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    placeholder="审批意见（可选）..."
                    className="input-field text-xs resize-none mb-3"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    {sim.approvalStatus === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(sim.id, 'postdoc')} className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 博士后通过
                        </button>
                        <button onClick={() => handleReject(sim.id, 'postdoc')} className="btn-danger text-xs py-2 px-4 inline-flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> 驳回
                        </button>
                      </>
                    )}
                    {sim.approvalStatus === 'postdoc_approved' && (
                      <>
                        <button onClick={() => handleApprove(sim.id, 'professor')} className="btn-accretion text-xs py-2 px-4 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 教授确认通过
                        </button>
                        <button onClick={() => handleReject(sim.id, 'professor')} className="btn-danger text-xs py-2 px-4 inline-flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> 驳回
                        </button>
                      </>
                    )}
                    {sim.approvalStatus === 'professor_approved' && (
                      <button onClick={() => handlePush(sim.id)} className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1">
                        <Send className="w-3.5 h-3.5" /> 推送至观测提案系统
                      </button>
                    )}
                    {sim.approvalStatus === 'rejected' && (
                      <button
                        onClick={() => {
                          setApprovalStatus(sim.id, 'pending');
                          setActiveSim(null);
                        }}
                        className="btn-ghost text-xs py-2 px-4 inline-flex items-center gap-1"
                      >
                        重新提交审批
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
