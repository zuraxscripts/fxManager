export function renderShell(opts: {
  title?: string;
  initialData?: Record<string, unknown>;
}) {
  const { title = "FiveM Wrapper", initialData = {} } = opts;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg:       #0a0c10;
      --bg2:      #111418;
      --bg3:      #181c22;
      --border:   #1e2530;
      --accent:   #f97316;
      --accent2:  #fb923c;
      --green:    #22c55e;
      --red:      #ef4444;
      --yellow:   #eab308;
      --text:     #e2e8f0;
      --muted:    #64748b;
      --font-ui:  'Syne', sans-serif;
      --font-mono:'JetBrains Mono', monospace;
    }
    html, body { height: 100%; background: var(--bg); color: var(--text); font-family: var(--font-ui); }
    #root { height: 100%; }
    body::-webkit-scrollbar { width: 6px; }
    body::-webkit-scrollbar-track { background: var(--bg2); }
    body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};</script>
  <script type="module" src="/dist/entry.js"></script>
</body>
</html>`;
}
