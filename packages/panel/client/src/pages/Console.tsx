import { useEffect, useRef, useState } from 'react';
import type { ConsoleOutputEvent } from '@fxmanager/types';

interface Props {
  logs: ConsoleOutputEvent[];
  sendCommand: (cmd: string) => void;
}

export default function Console({ logs, sendCommand }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const submit = () => {
    const cmd = input.trim();
    if (!cmd) return;
    sendCommand(cmd);
    setHistory((h) => [cmd, ...h].slice(0, 50));
    setHistIdx(-1);
    setInput('');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') return submit();
    if (e.key === 'ArrowUp') {
      const idx = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(idx);
      setInput(history[idx] ?? '');
    }
    if (e.key === 'ArrowDown') {
      const idx = Math.max(histIdx - 1, -1);
      setHistIdx(idx);
      setInput(idx === -1 ? '' : history[idx]);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h1 style={{ fontWeight: 800, fontSize: 22 }}>Console</h1>

      <div
        style={{
          flex: 1,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '14px 16px',
          overflowY: 'auto',
          fontFamily: 'var(--mono)',
          fontSize: 12,
          lineHeight: 1.7,
        }}
      >
        {logs.map((log, i) => (
          <div key={i} style={{ color: log.source === 'stderr' ? 'var(--red)' : 'var(--text)' }}>
            {log.line}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent)', lineHeight: '36px' }}>
          ›
        </span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Enter server command..."
          style={{
            flex: 1,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 7,
            padding: '8px 14px',
            color: 'var(--text)',
            fontFamily: 'var(--mono)',
            fontSize: 13,
            outline: 'none',
          }}
        />
        <button
          onClick={submit}
          style={{
            padding: '8px 18px',
            background: 'var(--accent-dim)',
            border: '1px solid var(--accent)',
            borderRadius: 7,
            color: 'var(--accent)',
            fontFamily: 'var(--sans)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
