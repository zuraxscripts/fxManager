import { useEffect, useState } from 'react';
import type { Player } from '@fxmanager/types';

export default function Players() {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    fetch('/players')
      .then((r) => r.json())
      .then(setPlayers);
  }, []);

  return (
    <div>
      <h1 style={{ fontWeight: 800, fontSize: 22, marginBottom: 24 }}>Players</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr
            style={{
              borderBottom: '1px solid var(--border)',
              color: 'var(--text-muted)',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            <th style={{ textAlign: 'left', padding: '8px 12px' }}>Name</th>
            <th style={{ textAlign: 'left', padding: '8px 12px' }}>License</th>
            <th style={{ textAlign: 'left', padding: '8px 12px' }}>Last Seen</th>
            <th style={{ textAlign: 'left', padding: '8px 12px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '10px 12px', fontWeight: 600 }}>{p.name}</td>
              <td
                style={{
                  padding: '10px 12px',
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  color: 'var(--text-muted)',
                }}
              >
                {p.license}
              </td>
              <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                {new Date(p.lastSeen).toLocaleString()}
              </td>
              <td style={{ padding: '10px 12px' }}>
                <button
                  style={{
                    fontSize: 12,
                    padding: '4px 10px',
                    borderRadius: 5,
                    border: '1px solid var(--red)',
                    background: 'transparent',
                    color: 'var(--red)',
                    cursor: 'pointer',
                  }}
                >
                  Ban
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
