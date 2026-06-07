import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSimulationStore } from '../stores/simulationStore';
import { SimulationStatus, STATUS_LABELS, STATUS_COLORS } from '../types';
import { formatDuration, formatScientificNotation } from '../data/mockEngine';
import {
  Search,
  Filter,
  Plus,
  Eye,
  PauseCircle,
  PlayCircle,
  AlertCircle,
  ChevronRight,
  Atom,
  Grid3x3,
} from 'lucide-react';

const ALL_STATUSES: (SimulationStatus | 'all')[] = [
  'all',
  'pending_validation',
  'mesh_generation',
  'initializing',
  'evolving',
  'radiation_synthesis',
  'completed',
  'error_fallback',
  'paused',
];

export default function SimulationList() {
  const { simulations, series, statusFilter, setStatusFilter, pauseSeries, resumeSeries } =
    useSimulationStore();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const filteredSims = simulations.filter((s) => {
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.createdBy.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-orbitron text-2xl font-bold text-slate-100 tracking-wide">模拟任务管理</h1>
          <p className="text-sm text-slate-400 mt-1">
            共 {simulations.length} 个任务 · {filteredSims.length} 个匹配
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/simulations/new" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新建模拟
          </Link>
        </div>
      </div>

      <div className="glass-card p-4 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="搜索任务名称、创建者..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="flex flex-wrap gap-1.5">
            {ALL_STATUSES.map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === st
                    ? 'bg-plasma-500/20 border border-plasma-500/40 text-plasma-200'
                    : 'bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                }`}
              >
                {st === 'all' ? '全部' : STATUS_LABELS[st]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid' ? 'bg-plasma-500/20 text-plasma-300' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'table' ? 'bg-plasma-500/20 text-plasma-300' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <div className="w-4 h-4 flex flex-col justify-center items-center gap-[2px]">
              <span className="block w-3 h-[2px] bg-current rounded" />
              <span className="block w-3 h-[2px] bg-current rounded" />
              <span className="block w-3 h-[2px] bg-current rounded" />
            </div>
          </button>
        </div>
      </div>

      {series.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="section-title">参数系列管理</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {series.map((s) => (
              <div key={s.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{s.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      M = {formatScientificNotation(s.baseParams.mass, 1)}M☉ · a* = {s.baseParams.spin.toFixed(2)}
                    </p>
                  </div>
                  <span
                    className={`badge-status border ${
                      s.status === 'active' ? 'bg-gravity-500/20 text-gravity-200 border-gravity-500/30' : s.status === 'paused' ? 'bg-alert-500/20 text-alert-200 border-alert-500/30' : 'bg-plasma-500/20 text-plasma-200 border-plasma-500/30'
                    }`}
                  >
                    {s.status === 'active' ? '进行中' : s.status === 'paused' ? '已暂停' : '已完成'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs">
                  {s.variableParams && s.variableParams.length > 0 && (
                    <>
                      <span className="text-slate-400">变量:</span>
                      <span className="font-mono text-slate-300">{s.variableParams.join(', ')}</span>
                    </>
                  )}
                </div>
                {s.consecutiveDivergences >= 3 && (
                  <div className="mt-2 p-2 rounded-lg bg-alert-500/10 border border-alert-500/20 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-alert-400" />
                    <span className="text-xs text-alert-300">连续发散 {s.consecutiveDivergences} 次</span>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-3">
                  {s.status === 'active' ? (
                    <button onClick={() => pauseSeries(s.id)} className="btn-ghost text-xs px-3 py-1.5 inline-flex items-center gap-1">
                      <PauseCircle className="w-3.5 h-3.5" />暂停
                    </button>
                  ) : (
                    <button onClick={() => resumeSeries(s.id)} className="btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1">
                      <PlayCircle className="w-3.5 h-3.5" />恢复
                    </button>
                  )}
                  <span className="text-xs text-slate-500 ml-auto">{s.simulations.length} 任务</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredSims.map((sim) => (
            <Link
              key={sim.id}
              to={`/simulations/${sim.id}`}
              className="glass-card glass-card-hover p-5 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-plasma-500/20 border border-plasma-500/30 flex items-center justify-center">
                    <Atom className="w-5 h-5 text-plasma-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-100 truncate max-w-[180px]">{sim.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {sim.createdBy}
                    </p>
                  </div>
                </div>
                <span className={`badge-status border ${STATUS_COLORS[sim.status]}`}>
                  {STATUS_LABELS[sim.status]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="p-2 rounded-lg bg-white/[0.03]">
                  <p className="data-label">黑洞质量</p>
                  <p className="font-mono text-slate-200">{formatScientificNotation(sim.params.mass, 1)} M☉</p>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.03]">
                  <p className="data-label">自旋参数</p>
                  <p className="font-mono text-slate-200">a* = {sim.params.spin.toFixed(3)}</p>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.03]">
                  <p className="data-label">磁场强度</p>
                  <p className="font-mono text-slate-200">{sim.magneticField.strength.toFixed(2)} ×10⁸G</p>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.03]">
                  <p className="data-label">吸积率</p>
                  <p className="font-mono text-slate-200">{sim.params.accretionRate.toFixed(3)} Ṁ_Edd</p>
                </div>
              </div>

              {(sim.status === 'evolving' || sim.status === 'mesh_generation' || sim.status === 'initializing' || sim.status === 'radiation_synthesis') && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>进度 {sim.progress.toFixed(1)}%</span>
                    <span className="font-mono">{sim.currentStep.toLocaleString()} / {sim.totalSteps.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-plasma-500 via-magnetic-500 transition-all"
                      style={{ width: `${sim.progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>⏱ {formatDuration(sim.elapsedTime)}</span>
                  {sim.warnings.length > 0 && (
                    <span className="text-alert-400">⚠ {sim.warnings.length}</span>
                  )}
                </div>
                <Eye className="w-4 h-4 text-slate-600 group-hover:text-plasma-400 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">任务名称</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 font-medium">质量</th>
                <th className="px-5 py-3 font-medium">自旋</th>
                <th className="px-5 py-3 font-medium">磁场</th>
                <th className="px-5 py-3 font-medium">进度</th>
                <th className="px-5 py-3 font-medium">创建者</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filteredSims.map((sim) => (
                <tr key={sim.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                  <td className="px-5 py-3 text-slate-200">{sim.name}</td>
                  <td className="px-5 py-3">
                    <span className={`badge-status border ${STATUS_COLORS[sim.status]}`}>
                      {STATUS_LABELS[sim.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-slate-300">{formatScientificNotation(sim.params.mass, 1)}M☉</td>
                  <td className="px-5 py-3 font-mono text-slate-300">{sim.params.spin.toFixed(2)}</td>
                  <td className="px-5 py-3 font-mono text-slate-300">{sim.magneticField.strength.toFixed(2)}</td>
                  <td className="px-5 py-3 w-32">
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-plasma-500 to-magnetic-500" style={{ width: `${sim.progress}%` }} />
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-400">{sim.createdBy}</td>
                  <td className="px-5 py-3">
                    <Link to={`/simulations/${sim.id}`} className="text-plasma-400 hover:text-plasma-300 inline-flex items-center gap-1">
                      详情 <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
