const unitRadian = 180.0 / Math.PI;
const unitDegree = Math.PI / 180.0;

// 변환: 극좌표계->회전좌표계
function polar2orthogonal(pt) {
  const l = Math.cos(pt[1]);
  return [l * Math.cos(pt[0]), -l * Math.sin(pt[0]), Math.sin(pt[1])];
}

// 변환: 회전축/각 -> 회전행렬
function axisAngle2Matrix(axis, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const t = 1 - c;
  const [x, y, z] = axis;
  return [
    [c + x * x * t, x * y * t - z * s, x * z * t + y * s],
    [x * y * t + z * s, c + y * y * t, y * z * t - x * s],
    [x * z * t - y * s, y * z * t + x * s, c + z * z * t],
  ];
}

// 변환: 오일러 회전 -> 회전행렬
function eularZYX2Matrix(r) {
  const c2 = Math.cos(r[2]);
  const s2 = Math.sin(r[2]);
  const c1 = Math.cos(r[1]);
  const s1 = Math.sin(r[1]);
  const c0 = Math.cos(r[0]);
  const s0 = Math.sin(r[0]);
  return [
    [c1 * c0, c1 * s0, -s1],
    [s2 * s1 * c0 - c2 * s0, s0 * s1 * s2 + c0 * c2, s2 * c1],
    [c0 * s1 * c2 + s0 * s2, c2 * s1 * s0 - s2 * c0, c2 * c1],
  ];
}

// 변환: 회전행렬 -> 오일러회전
function matrix2EulerZYX(mat) {
  return [
    Math.atan2(mat[1][0], mat[0][0]),
    Math.asin(-mat[2][0]),
    Math.atan2(mat[2][1], mat[2][2]),
  ];
}

// 내적
function dot(l, r) {
  let ret = 0;
  for (let i = 0; i < l.length; ++i) {
    ret += l[i] * r[i];
  }
  return ret;
}

// 외적: only 3x3
function cross(l, r) {
  return [
    l[1] * r[2] - l[2] * r[1],
    l[2] * r[0] - l[0] * r[2],
    l[0] * r[1] - l[1] * r[0],
  ];
}

// 단위행렬변환
function toUnit(v) {
  const l = Math.sqrt(dot(v, v));
  return v.map((it) => it / l);
}

// l은 1 * n 행렬곱
function mmulCol(l, r) {
  return l.map((v, i) => r[0].reduce((p, c, j) => p + l[j] * r[j][i], 0));
}

// 행렬곱
function mmul(l, r) {
  return Array.isArray(l[0]) ? l.map((it) => mmulCol(it, r)) : mmulCol(l, r);
}

// 배열 라디안 단위 변환
function toRadian(val) {
  return val && val.map((it) => it * unitDegree);
}

// 배열 도단위 변환
function toDegree(val) {
  return val && val.map((it) => it * unitRadian);
}
