import { LogSegment } from '@fxmanager/types';

export function getHexColourFromAnsi(index: number): string {
  const palette: Record<number, string> = {
    21: '#0000ff',
    23: '#005f5f',
    33: '#0087ff',
    42: '#00d787',
    46: '#00ff00',
    51: '#00ffff',
    66: '#5f8787',
    73: '#5fafaf',
    83: '#5af761',
    135: '#af5fff',
    161: '#d7005f',
    165: '#d700ff',
    177: '#d787ff',
    196: '#ff0000',
    208: '#ff8700',
    220: '#ffd700',
    226: '#ffff00',
    201: '#ff00ff',
    231: '#ffffff',
    232: '#080808',
    244: '#808080',
    250: '#bcbcbc',
  };

  if (palette[index]) return palette[index];

  DEV: console.warn(`[core - utils] No colour found for index: ${index}`);

  return '#ffffff';
}

export function parseAnsiToSegments(ansiStr: string): LogSegment[] {
  // look into 'ansi-to-json' package
  const ansiRegex = /\x1B\[([0-9;]*)m/g;
  let parts = ansiStr.split(ansiRegex);
  const segments: LogSegment[] = [];

  let currentColor = '';

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      // This is text
      if (parts[i]) {
        segments.push({ text: parts[i], color: currentColor });
      }
    } else {
      // This is an ANSI code
      const code = parts[i];
      if (code === '0') currentColor = '';
      else if (code.startsWith('38;5;')) {
        // fxserver uses 256-color palette
        const colorIndex = code.split(';')[2];
        currentColor = getHexColourFromAnsi(parseInt(colorIndex));
      }
    }
  }
  return segments;
}
