import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
const I = process.env.MAKEFUN_INPUT_DIR ?? '/input', O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output', E = new TextEncoder();
// Per opcode (0..83): pops (9 = no such opcode) and pushes, as digit strings.
const Q = '000112239999999922222221222122292229999999999999011009999999999912999999999999991101';
const H = '011022339999999911111111111111191119999999999999000009999999999910999999999999990010';
// Binary ops ADD..LTU (index: 16-22 -> 0-6, 24-26 -> 7-9, 28-30 -> 10-12, 32-34 -> 13-15).
const F = [(a, b) => (a + b) | 0, (a, b) => (a - b) | 0, Math.imul,
  (a, b) => a === -2147483648 && b === -1 ? a : (a / b) | 0,
  (a, b) => b === -1 ? 0 : (a % b) | 0,
  (a, b) => Math.floor((a >>> 0) / (b >>> 0)) | 0,
  (a, b) => ((a >>> 0) % (b >>> 0)) | 0,
  (a, b) => a & b, (a, b) => a | b, (a, b) => a ^ b,
  (a, b) => a << (b & 31), (a, b) => a >> (b & 31), (a, b) => (a >>> (b & 31)) | 0,
  (a, b) => a === b ? 1 : 0, (a, b) => a < b ? 1 : 0, (a, b) => (a >>> 0) < (b >>> 0) ? 1 : 0];
function R(P, N) {
  const D = new Int32Array(256), C = new Int32Array(64), M = new Int32Array(256), o = new Uint8Array(65536), n = P.length;
  let s = 0, c = 0, p = 0, t = 0, l = 0, g = 0, w = 0;
  const T = e => [o.slice(0, l), e];
  for (;;) {
    if (t === 1000000) return T(10);
    if (p < 0 || p >= n) return T(9);
    const b = P[p], q = b < 84 ? Q.charCodeAt(b) - 48 : 9;
    if (q === 9) return T(5);
    const m = b === 1 ? 1 : b === 2 ? 4 : b >= 48 && b <= 51 ? 2 : 0;
    if (p + m >= n) return T(9);
    t++;
    const x = p + 1 + m;
    if (s < q || s - q + H.charCodeAt(b) - 48 > 256) return T(s < q ? 2 : 3);
    p = x;
    switch (b) {
      case 0: return T(0);
      case 1: D[s++] = (P[x - 1] << 24) >> 24; break;
      case 2: D[s++] = P[x - 4] | (P[x - 3] << 8) | (P[x - 2] << 16) | (P[x - 1] << 24); break;
      case 3: s--; break;
      case 4: D[s] = D[s - 1]; s++; break;
      case 5: w = D[s - 1]; D[s - 1] = D[s - 2]; D[s - 2] = w; break;
      case 6: D[s] = D[s - 2]; s++; break;
      case 7: w = D[s - 3]; D[s - 3] = D[s - 2]; D[s - 2] = D[s - 1]; D[s - 1] = w; break;
      case 23: D[s - 1] = -D[s - 1] | 0; break;
      case 27: D[s - 1] = ~D[s - 1]; break;
      case 16: case 17: case 18: case 19: case 20: case 21: case 22:
      case 24: case 25: case 26: case 28: case 29: case 30: case 32: case 33: case 34: {
        const y = D[s - 1], a = D[s - 2];
        if (!y && b >= 19 && b <= 22) return T(4);
        s -= 2; D[s++] = F[b < 23 ? b - 16 : b < 27 ? b - 17 : b < 31 ? b - 18 : b - 19](a, y); break;
      }
      case 48: case 49: case 50: {
        const r = ((P[x - 2] | (P[x - 1] << 8)) << 16) >> 16;
        let k = true;
        if (b !== 48) { const v = D[--s]; k = b === 49 ? v === 0 : v !== 0; }
        if (k) p = x + r; break;
      }
      case 51: if (c === 64) return T(7); C[c++] = x; p = P[x - 2] | (P[x - 1] << 8); break;
      case 52: if (!c) return T(8); p = C[--c]; break;
      case 64: w = D[s - 1]; if (w < 0 || w > 255) return T(6); D[s - 1] = M[w]; break;
      case 65: w = D[s - 1]; if (w < 0 || w > 255) return T(6); s -= 2; M[w] = D[s]; break;
      case 80: {
        const u = E.encode(String(D[s - 1]));
        if (l + u.length > 65536) return T(11);
        s--; o.set(u, l); l += u.length; break;
      }
      case 81: if (l + 1 > 65536) return T(11); o[l++] = D[--s] & 255; break;
      case 82: D[s++] = g < N.length ? N[g++] : -1; break;
      case 83: return T(D[--s] & 255);
    }
  }
}
for (const d of readdirSync(I).sort()) {
  const [u, e] = R(readFileSync(I + '/' + d + '/program.bin'), readFileSync(I + '/' + d + '/input.bin'));
  mkdirSync(O + '/' + d, { recursive: true });
  writeFileSync(O + '/' + d + '/stdout.bin', u);
  writeFileSync(O + '/' + d + '/exit.txt', e + '\n');
}
