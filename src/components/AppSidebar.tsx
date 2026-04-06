import { LayoutDashboard, MessageSquare, Shield, Tag } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { LockdownStatus } from './LockdownStatus';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/chat', icon: MessageSquare, label: 'Guardian Chat' },
  { to: '/labels', icon: Tag, label: 'Studio Labels' },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg">A</div>
          <div>
            <h1 className="font-bold text-lg text-primary tracking-wider">ALFA</h1>
            <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Guardian v2</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-sidebar-accent text-primary border border-primary/10'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="rounded-lg bg-secondary/40 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-3 h-3 text-cyan-400" />
            <p className="text-[10px] text-muted-foreground font-mono tracking-wide">GUARDIAN PIPELINE</p>
          </div>
          <p className="text-[10px] text-muted-foreground">yesterday · today · tomorrow</p>
          <p className="text-[10px] text-muted-foreground mt-1 opacity-60">Studio Labels {'->'} Partition Router</p>
          <div className="mt-3">
            <LockdownStatus compact />
          </div>
        </div>
      </div>
    </aside>
  );
}
