import { useState } from 'react';
import { useSimulationStore } from '../stores/simulationStore';
import { formatScientificNotation, formatDuration } from '../data/mockEngine';
import { STATUS_LABELS, STATUS_COLORS, TOPOLOGY_LABELS } from '../types';
import {
  FileDown,
  FileText,
  Database,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  SlidersHorizontal,
  Calendar,
  Atom,
} from 'lucide-react';

export default function Exports() {
  const { simulations, generateReportPDF } = useSimulationStore();
  const [selectedSim, setSelectedSim] = useState<string | null>(null);
  const [spinRange, setSpinRange] = useState<[number, number]>([0, 1]);
  const [bRange, setBRange] = useState<[number, number]>([0, 100]);
  const [timeWindow, setTimeWindow] = useState<'all' | 'early' | 'mid' | 'late'>('all');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'fits'>('csv');
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const completedSims = simulations.filter((s) => s.status === 'completed');
  const selected = completedSims.find((s) => s.id === selectedSim);

  const filteredSims = completedSims.filter(
    (s) => s.params.spin >= spinRange[0] && s.params.spin <= spinRange[1] && s.magneticField.strength >= bRange[0] && s.magneticField.strength <= bRange[1]
  );

  const handleExportPDF = async () => {
    if (!selected) return;
    setExporting(true);
    setErrorMsg(null);
    try {
      await generateReportPDF(selected.id);
      setExporting(false);
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (e) {
      setExporting(false);
      setErrorMsg('报告生成失败：' + (e as Error).message);
      setTimeout(() => setErrorMsg(null), 5000);
    }
  };

  const handleExportData = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-orbitron text-2xl font-bold text-slate-100 tracking-wide">报告与数据导出</h1>
        <p className="text-sm text-slate-400 mt-1">
          生成PDF综合报告，按参数筛选导出全场等离子体参数与辐射数据
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 space-y-6">
          <div className="glass-card p-5">
            <h3 className="section-title">
              <FileText className="w-5 h-5 text-plasma-400" /> PDF 报告生成
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              包含磁场结构3D渲染、辐射光谱、能谱分布、光变曲线及完整参数日志
            </p>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
              {completedSims.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">暂无可导出的完成模拟</p>
              ) : (
                completedSims.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSim(s.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      selectedSim === s.id
                        ? 'bg-plasma-500/15 border border-plasma-500/40'
                        : 'bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05]'
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-200 truncate">{s.name}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-mono">
                      <span>a*={s.params.spin.toFixed(2)}</span>
                      <span>B={s.magneticField.strength.toFixed(1)}</span>
                      <span>{formatDuration(s.elapsedTime)}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
            <button
              onClick={handleExportPDF}
              disabled={!selected || exporting}
              className="btn-primary w-full mt-4 inline-flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {exporting ? (
                <Clock className="w-4 h-4 animate-spin" />
              ) : exported ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {exporting ? '生成中...' : exported ? '已生成！' : '生成 PDF 报告'}
            </button>
            {errorMsg && (
              <p className="text-xs text-alert-400 mt-2 text-center">{errorMsg}</p>
            )}
          </div>

          {selected && (
            <div className="glass-card p-5">
              <h4 className="text-sm font-medium text-slate-200 mb-3">报告内容预览</h4>
              <div className="space-y-2 text-xs">
                {['磁场结构3D渲染图', '多波段辐射光谱', 'SED能谱分布曲线', '多波段光变曲线', '完整参数配置日志', '审批流程记录'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
                    <CheckCircle2 className="w-3 h-3 text-gravity-400" />
                    <span className="text-slate-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="xl:col-span-2 space-y-6">
          <div className="glass-card p-5">
            <h3 className="section-title">
              <Database className="w-5 h-5 text-accretion-400" /> 数据导出
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              按黑洞自旋、磁通量和时间窗口筛选，导出全场等离子体参数和辐射数据
            </p>

            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                  <label className="text-sm text-slate-300 font-medium">黑洞自旋 a* 范围</label>
                  <span className="ml-auto font-mono text-xs text-plasma-300">
                    [{spinRange[0].toFixed(2)}, {spinRange[1].toFixed(2)}]
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min={0} max={1} step={0.01}
                    value={spinRange[0]}
                    onChange={(e) => setSpinRange([Math.min(parseFloat(e.target.value), spinRange[1]), spinRange[1]])}
                    className="flex-1"
                  />
                  <input
                    type="range" min={0} max={1} step={0.01}
                    value={spinRange[1]}
                    onChange={(e) => setSpinRange([spinRange[0], Math.max(parseFloat(e.target.value), spinRange[0])])}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Atom className="w-4 h-4 text-slate-400" />
                  <label className="text-sm text-slate-300 font-medium">磁场强度 B 范围 (×10⁸ G)</label>
                  <span className="ml-auto font-mono text-xs text-plasma-300">
                    [{bRange[0].toFixed(1)}, {bRange[1].toFixed(1)}]
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min={0} max={100} step={0.5}
                    value={bRange[0]}
                    onChange={(e) => setBRange([Math.min(parseFloat(e.target.value), bRange[1]), bRange[1]])}
                    className="flex-1"
                  />
                  <input
                    type="range" min={0} max={100} step={0.5}
                    value={bRange[1]}
                    onChange={(e) => setBRange([bRange[0], Math.max(parseFloat(e.target.value), bRange[0])])}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <label className="text-sm text-slate-300 font-medium">时间窗口</label>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    { k: 'all', l: '全部时段' },
                    { k: 'early', l: '早期 (0-25%)' },
                    { k: 'mid', l: '中期 (25-75%)' },
                    { k: 'late', l: '晚期 (75-100%)' },
                  ] as const).map(({ k, l }) => (
                    <button
                      key={k}
                      onClick={() => setTimeWindow(k)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        timeWindow === k
                          ? 'bg-plasma-500/20 border border-plasma-500/40 text-plasma-200'
                          : 'bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileDown className="w-4 h-4 text-slate-400" />
                  <label className="text-sm text-slate-300 font-medium">导出格式</label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { k: 'csv', l: 'CSV', desc: '表格格式' },
                    { k: 'json', l: 'JSON', desc: '结构化' },
                    { k: 'fits', l: 'FITS', desc: '天文标准' },
                  ] as const).map(({ k, l, desc }) => (
                    <button
                      key={k}
                      onClick={() => setExportFormat(k)}
                      className={`p-3 rounded-xl text-center transition-all ${
                        exportFormat === k
                          ? 'bg-accretion-500/20 border border-accretion-500/40'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <p className={`font-mono font-bold text-sm ${exportFormat === k ? 'text-accretion-300' : 'text-slate-300'}`}>{l}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  <Filter className="w-3 h-3 inline mr-1" />
                  匹配 <span className="font-mono text-plasma-300 font-bold">{filteredSims.length}</span> 个模拟结果
                </div>
                <button
                  onClick={handleExportData}
                  disabled={filteredSims.length === 0 || exporting}
                  className="btn-accretion inline-flex items-center gap-2 disabled:opacity-40"
                >
                  {exporting ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : exported ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {exporting ? '导出中...' : exported ? '导出成功！' : `导出数据 (${exportFormat.toUpperCase()})`}
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="section-title">
              <Database className="w-5 h-5 text-magnetic-400" /> 可导出数据字段
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {[
                ['等离子体参数', ['密度 ρ', '温度 T', '压力 P', '速度场 v^i', '四维速度 u^μ', '洛伦兹因子 Γ']],
                ['磁场数据', ['磁场强度 B', '磁通量 Φ', '磁压 P_B', '等离子体β', '电流密度 J']],
                ['辐射数据', ['辐射光谱 F_ν', 'SED νL_ν', '光变曲线', '偏振度', '光子指数 Γ']],
                ['动力学量', ['吸积率 Ṁ', '喷流功率 L_j', '喷流准直度', 'MRI增长率', '角动量传输']],
                ['网格信息', ['自适应网格层级', '细胞尺寸', '时间步长', 'CFL条件数', '收敛残差']],
                ['元数据', ['黑洞质量 M', '自旋 a*', '倾角 i', '运行时长', '总能量守恒']],
              ].map(([cat, fields]: any, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <p className="text-slate-300 font-medium mb-2">{cat}</p>
                  <div className="space-y-0.5">
                    {fields.map((f: string, j: number) => (
                      <div key={j} className="flex items-center gap-1.5 text-slate-500 font-mono">
                        <span className="w-1 h-1 rounded-full bg-magnetic-500/50" /> {f}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {filteredSims.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="section-title text-base mb-3">待导出的模拟 ({filteredSims.length})</h3>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {filteredSims.slice(0, 10).map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.02] text-xs">
                    <span className={`badge-status border ${STATUS_COLORS[s.status]} text-[10px] py-0.5`}>
                      {STATUS_LABELS[s.status]}
                    </span>
                    <span className="text-slate-200 flex-1 truncate">{s.name}</span>
                    <span className="font-mono text-slate-500">a*={s.params.spin.toFixed(2)}</span>
                    <span className="font-mono text-slate-500">B={s.magneticField.strength.toFixed(1)}</span>
                    <span className="font-mono text-slate-500">{TOPOLOGY_LABELS[s.magneticField.topology]}</span>
                    <span className="font-mono text-slate-500">{formatScientificNotation(s.params.mass, 1)}M☉</span>
                  </div>
                ))}
                {filteredSims.length > 10 && (
                  <p className="text-center text-xs text-slate-500 pt-2">... 及另外 {filteredSims.length - 10} 个模拟</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
