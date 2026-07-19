/**
 * Mengklasifikasikan data menggunakan algoritma Jenks Natural Breaks (Fisher-Jenks).
 * Membagi data numerik menjadi numClass kelompok yang homogen secara internal.
 * Mengembalikan array batas kelas: [min, break1, break2, max]
 *
 * @param {number[]} data - Array data angka yang akan dikelompokkan
 * @param {number} numClass - Jumlah kelas (misal: 3)
 * @returns {number[]} Batas kelas
 */
export function getJenksBreaks(data, numClass) {
  if (!data || data.length === 0) return [];
  
  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;
  
  if (n <= numClass) {
    const res = [sorted[0]];
    for (let i = 0; i < numClass; i++) {
      res.push(sorted[Math.min(i, n - 1)]);
    }
    return res;
  }
  
  const mat1 = Array.from({ length: n + 1 }, () => Array(numClass + 1).fill(0));
  const mat2 = Array.from({ length: n + 1 }, () => Array(numClass + 1).fill(0));
  
  for (let i = 1; i <= numClass; i++) {
    mat1[1][i] = 1;
    mat2[1][i] = 0;
    for (let j = 2; j <= n; j++) {
      mat2[j][i] = Infinity;
    }
  }

  let v = 0;
  for (let l = 2; l <= n; l++) {
    let s1 = 0;
    let s2 = 0;
    let w = 0;
    for (let m = 1; m <= l; m++) {
      const i3 = l - m + 1;
      const val = sorted[i3 - 1];
      s1 += val;
      s2 += val * val;
      w += 1;
      v = s2 - (s1 * s1) / w;
      const i4 = i3 - 1;
      if (i4 !== 0) {
        for (let j = 2; j <= numClass; j++) {
          if (mat2[l][j] >= v + mat2[i4][j - 1]) {
            mat1[l][j] = i3;
            mat2[l][j] = v + mat2[i4][j - 1];
          }
        }
      }
    }
    mat1[l][1] = 1;
    mat2[l][1] = v;
  }

  let k = n;
  const kclass = [];
  kclass[numClass] = sorted[n - 1];
  kclass[0] = sorted[0];

  for (let j = numClass; j >= 2; j--) {
    const id = mat1[k][j] - 2;
    kclass[j - 1] = sorted[id];
    k = mat1[k][j] - 1;
  }

  return kclass;
}
