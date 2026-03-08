import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Terminal, Users, ShieldBan, Settings, Circle } from 'lucide-react';
import type { ServerState } from '@fxmanager/types';
import styles from './Layout.module.css';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/console', icon: Terminal, label: 'Console' },
  { to: '/players', icon: Users, label: 'Players' },
  { to: '/bans', icon: ShieldBan, label: 'Bans' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

interface LayoutProps {
  children: React.ReactNode;
  serverState: ServerState | null;
  connected: boolean;
}

export default function Layout({ children, serverState, connected }: LayoutProps) {
  const status = serverState?.status ?? 'stopped';

  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoAccent}>FX</span>Panel
        </div>

        <nav className={styles.nav}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.statusBar}>
          <Circle
            size={8}
            fill={
              status === 'running'
                ? 'var(--green)'
                : status === 'crashed'
                  ? 'var(--red)'
                  : 'var(--text-muted)'
            }
            stroke="none"
          />
          <span className={styles.statusText}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
          {!connected && <span className={styles.wsDisconnected}>WS offline</span>}
        </div>
      </aside>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
