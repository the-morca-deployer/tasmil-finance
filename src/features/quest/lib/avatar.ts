// Deterministic gradient avatar from a seed (ported from tasmil-app-quest).

export function qHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function qAvatar(seed: string): string {
  const h = qHash(seed);
  const a = h % 360;
  const b = (h * 3 + 90) % 360;
  return `radial-gradient(circle at 32% 28%,hsl(${a} 80% 70%),hsl(${b} 75% 42%) 75%)`;
}
