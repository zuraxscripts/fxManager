import { Play, Square, RefreshCw } from 'lucide-react';
import type { ServerState } from '@fxmanager/types';

interface Props {
  serverState: ServerState | null;
}

async function serverAction(action: 'start' | 'stop' | 'restart') {
  await fetch(`/server/${action}`, { method: 'POST' });
}

export default function Dashboard({ serverState }: Props) {
  const status = serverState?.status ?? 'stopped';
  const isRunning = status === 'running';

  return (
    <div>
      <h1 style={{ fontWeight: 800, fontSize: 22, marginBottom: 24 }}>Dashboard</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        <StatCard
          label="Status"
          value={status}
          accent={isRunning ? 'var(--green)' : 'var(--text-muted)'}
        />
        <StatCard label="PID" value={serverState?.pid?.toString() ?? '—'} />
        <StatCard label="Restarts" value={serverState?.restarts?.toString() ?? '0'} />
        <StatCard
          label="Uptime"
          value={serverState?.startedAt ? formatUptime(serverState.startedAt) : '—'}
        />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <ActionButton
          icon={<Play size={14} />}
          label="Start"
          disabled={isRunning}
          onClick={() => serverAction('start')}
          color="var(--green)"
        />
        <ActionButton
          icon={<Square size={14} />}
          label="Stop"
          disabled={!isRunning}
          onClick={() => serverAction('stop')}
          color="var(--red)"
        />
        <ActionButton
          icon={<RefreshCw size={14} />}
          label="Restart"
          disabled={!isRunning}
          onClick={() => serverAction('restart')}
          color="var(--accent)"
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '18px 20px',
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: accent ?? 'var(--text)' }}>{value}</div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  disabled,
  onClick,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '9px 18px',
        borderRadius: 7,
        border: `1px solid ${disabled ? 'var(--border)' : color}`,
        background: disabled ? 'transparent' : `${color}18`,
        color: disabled ? 'var(--text-muted)' : color,
        fontFamily: 'var(--sans)',
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function formatUptime(startedAt: Date): string {
  const diff = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  return `${h}h ${m}m ${s}s`;
}
