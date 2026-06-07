import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ListTodo,
  PlusCircle,
  Activity,
  FileCheck2,
  FileDown,
  BarChart3,
  Sparkles,
  Atom,
  Bell,
  User,
} from 'lucide-react';
import { useSimulationStore } from '../../stores/simulationStore';
import { useEffect, useState } from 'react';

const navItems = [
  { path: '/', label: '综合仪表盘', icon: LayoutDashboard },
  { path: '/simulations', label: '模拟任务', icon: ListTodo },
  { path: '/simulations/new', label: '新建模拟', icon: PlusCircle },
  { path: '/monitoring', label: '实时监控', icon: Activity },
  { path: '/approvals', label: '审批工作流', icon: FileCheck2 },
  { path: '/recommendations', label: '智能推荐', icon: Sparkles },
  { path: '/exports', label: '报告导出', icon: FileDown },
  { path: '/analytics', label: '统计看板', icon: BarChart3 },
];

function Sidebar() {
  const { getStatistics } = useSimulationStore();
  const stats = getStatistics();
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-space-900/80 backdrop-blur-xl border-r border-white/10 flex flex-col z-40">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-plasma-500 to-magnetic-500 flex items-center justify-center shadow-[0_0_25px_rgba(0,212,255,0.35)]">
            <Atom className="w-6 h-6 text-white animate-spin-slow" />
          </div>
          <div>
            <h1 className="font-orbitron text-base font-bold text-slate-100 tracking-wider leading-tight">GRMHD</h1>
            <p className="text-[10px] text-slate-400 tracking-widest uppercase">Jet Feedback Lab</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
          return (
            <NavLink
              key={path}
              to={path}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-300 group ${
                isActive
                  ? 'bg-plasma-500/15 border border-plasma-500/30 text-plasma-200 shadow-[0_0_15px_rgba(0,212,255,0.1)]'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-plasma-400' : 'group-hover:text-plasma-400'} transition-colors`} />
              <span className="font-medium tracking-wide">{label}</span>
              {path === '/monitoring' && stats.activeWarnings > 0 && (
                <span className="ml-auto bg-alert-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                  {stats.activeWarnings}
                </span>
              )}
              {path === '/approvals' && stats.pendingApprovals > 0 && (
                <span className="ml-auto bg-accretion-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {stats.pendingApprovals}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-2">
        <div className="glass-card p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="data-label">系统状态</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gravity-500 animate-pulse" />
              <span className="text-xs text-gravity-400">在线</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-slate-500">运行中</p>
              <p className="font-mono text-plasma-300 text-sm font-semibold">{stats.running}</p>
            </div>
            <div>
              <p className="text-slate-500">今日完成</p>
              <p className="font-mono text-accretion-300 text-sm font-semibold">{stats.completed}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-magnetic-500 to-plasma-500 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-200 font-medium truncate">天体物理学家</p>
            <p className="text-xs text-slate-500 truncate">astro@observatory.edu</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function TopBar() {
  const { getWarnings } = useSimulationStore();
  const warnings = getWarnings(true).slice(0, 5);
  const [showNotif, setShowNotif] = useState(false);

  return (
    <header className="h-16 bg-space-900/60 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-8 sticky top-0 z-30">
      <div>
        <h2 className="font-orbitron text-sm tracking-[0.2em] text-slate-400 uppercase">Black Hole Accretion Disk</h2>
        <p className="text-xs text-slate-500 font-mono">General Relativistic MHD Simulation Platform</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
          <div className="w-2 h-2 rounded-full bg-gravity-500 animate-pulse" />
          <span className="text-xs text-slate-300 font-mono">GRMHD Solver v2.3.1 就绪</span>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-plasma-500/40 transition-all"
          >
            <Bell className="w-4.5 h-4.5 text-slate-300" />
            {warnings.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-alert-500 text-[10px] text-white rounded-full flex items-center justify-center font-bold animate-pulse">
                {warnings.length}
              </span>
            )}
          </button>
          {showNotif && (
            <div className="absolute right-0 top-14 w-80 glass-card p-2 shadow-2xl border border-white/10">
              <p className="text-xs text-slate-400 px-3 py-2 border-b border-white/5 font-medium">预警通知</p>
              {warnings.length === 0 ? (
                <p className="text-xs text-slate-500 px-3 py-4 text-center">暂无未处理预警</p>
              ) : (
                <div className="max-h-72 overflow-y-auto">
                  {warnings.map((w) => (
                    <div key={w.id} className="px-3 py-2.5 hover:bg-white/5 rounded-lg cursor-pointer border-l-2 border-alert-500 mb-1">
                      <p className="text-sm text-slate-200">{w.description}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{(w as any).simName} · {new Date(w.timestamp).toLocaleTimeString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default function Layout() {
  const { initializeMockData, tickSimulation, simulations } = useSimulationStore();

  useEffect(() => {
    if (simulations.length === 0) initializeMockData();
    const iv = setInterval(tickSimulation, 1500);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="min-h-screen bg-space-950 text-slate-200">
      <div className="fixed inset-0 stars-bg opacity-60 pointer-events-none" />
      <div className="fixed inset-0 bg-grid-glow pointer-events-none" />
      <Sidebar />
      <div className="ml-64 min-h-screen flex flex-col relative z-10">
        <TopBar />
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
