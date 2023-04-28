(function (w, o) {
  const unitRadian = 180.0 / Math.PI;
  const unitDegree = Math.PI / 180.0;

  // 변환: 오일러 > 쿼터니언
  function euler2Quaternion(euler) {
    const radians = euler.map((it) => 0.5 * (it || 0) * unitDegree);
    const sin = radians.map(Math.sin);
    const cos = radians.map(Math.cos);
    return [
      cos[0] * cos[1] * cos[2] + sin[0] * sin[1] * sin[2],
      sin[0] * cos[1] * cos[2] - cos[0] * sin[1] * sin[2],
      cos[0] * sin[1] * cos[2] + sin[0] * cos[1] * sin[2],
      cos[0] * cos[1] * sin[2] - sin[0] * sin[1] * cos[2],
    ];
  }
  o.euler2Quaternion = euler2Quaternion;

  // 변환: 쿼터니언 > 오일러
  function quaternion2Euler(quat) {
    return [
      Math.atan2(
        2 * (quat[0] * quat[1] + quat[2] * quat[3]),
        1 - 2 * (quat[1] * quat[1] + quat[2] * quat[2])
      ),
      Math.asin(
        Math.max(-1, Math.min(1, 2 * (quat[0] * quat[2] - quat[3] * quat[1])))
      ),
      Math.atan2(
        2 * (quat[0] * quat[3] + quat[1] * quat[2]),
        1 - 2 * (quat[2] * quat[2] + quat[3] * quat[3])
      ),
    ];
  }
  o.quaternion2Euler = quaternion2Euler;

  // 변환: 극좌표계 > 회전좌표계
  function polar2orthogonal(pt) {
    const l = Math.cos(pt[1]);
    return [l * Math.cos(pt[0]), l * Math.sin(pt[0]), Math.sin(pt[1])];
  }
  o.polar2orthogonal = polar2orthogonal;

  // 변환: 회전축/각 > 회전행렬
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
  o.axisAngle2Matrix = axisAngle2Matrix;

  // 변환: 오일러 회전 > 회전행렬
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
  o.eularZYX2Matrix = eularZYX2Matrix;

  // 쿼터니언 곱
  function multiplyQuaternion(l, r) {
    return [
      l[0] * r[0] - l[1] * r[1] - l[2] * r[2] - l[3] * r[3],
      l[0] * r[1] + l[1] * r[0] + l[2] * r[3] - l[3] * r[2],
      l[0] * r[2] - l[1] * r[3] + l[2] * r[0] + l[3] * r[1],
      l[0] * r[3] + l[1] * r[2] - l[2] * r[1] + l[3] * r[0],
    ];
  }
  o.multiplyQuaternion = multiplyQuaternion;

  // 두좌표의 각도를 단위 쿼터니언으로 변환
  function quaternionBetween(l, r) {
    if (!l || !r) return;
    const axis = cross(l, r);
    const len = Math.sqrt(dot(axis, axis));
    const angle = 0.5 * Math.acos(dot(l, r));
    const res = Math.sin(angle) / len;
    return (
      len && [Math.cos(angle), axis[2] * res, -axis[1] * res, axis[0] * res]
    );
  }
  o.quaternionBetween = quaternionBetween;

  // 변환: 회전행렬 > 오일러회전
  function matrix2EulerZYX(mat) {
    return [
      Math.atan2(mat[1][0], mat[0][0]),
      Math.asin(-mat[2][0]),
      Math.atan2(mat[2][1], mat[2][2]),
    ];
  }
  o.matrix2EulerZYX = matrix2EulerZYX;

  // 내적
  function dot(l, r) {
    let ret = 0;
    for (let i = 0; i < l.length; ++i) {
      ret += l[i] * r[i];
    }
    return ret;
  }
  o.dot = dot;

  // 외적
  function cross(l, r) {
    let i = 0;
    let n = 1;
    if (2 < l.length) {
      l = l.concat(l[0], l[1]);
      r = r.concat(r[0], r[1]);
      i = 1;
      n = l.length - 1;
    }

    let ret = [];
    for (; i < n; ++i) {
      ret.push(l[i] * r[i + 1] - l[i + 1] * r[i]);
    }

    return ret;
  }
  o.cross = cross;

  // 단위행렬변환
  function toUnit(v) {
    const l = Math.sqrt(dot(v, v));
    return v.map((it) => it / l);
  }

  o.toUnit = toUnit;

  // l은 1 * n 행렬곱
  function mmulCol(l, r) {
    return l.map((v, i) => r[0].reduce((p, c, j) => p + l[j] * r[j][i], 0));
  }

  // 행렬곱
  function mmul(l, r) {
    return Array.isArray(l[0]) ? l.map((it) => mmulCol(it, r)) : mmulCol(l, r);
  }
  o.mmul = mmul;

  // 역행렬3x3
  // ref: https://namu.wiki/w/%EC%97%AD%ED%96%89%EB%A0%AC
  function inverseMatrix3(m) {
    const k =
      m[0][0] * m[1][1] * m[2][2] -
      m[0][0] * m[1][2] * m[2][1] -
      m[0][1] * m[1][0] * m[2][2] +
      m[0][1] * m[1][2] * m[2][0] +
      m[0][2] * m[1][0] * m[2][1] -
      m[0][2] * m[1][1] * m[2][0];
    return [
      [
        (m[1][1] * m[2][2] - m[1][2] * m[2][1]) / k,
        (m[0][2] * m[2][1] - m[0][1] * m[2][2]) / k,
        (m[0][1] * m[1][2] - m[0][2] * m[1][1]) / k,
      ],
      [
        (m[1][2] * m[2][1] - m[1][0] * m[2][2]) / k,
        (m[0][0] * m[2][2] - m[0][2] * m[2][0]) / k,
        (m[0][2] * m[1][0] - m[0][0] * m[1][2]) / k,
      ],
      [
        (m[1][0] * m[2][1] - m[1][1] * m[2][0]) / k,
        (m[0][1] * m[2][0] - m[0][0] * m[2][1]) / k,
        (m[0][0] * m[1][1] - m[0][1] * m[1][0]) / k,
      ],
    ];
  }
  o.inverseMatrix3 = inverseMatrix3;

  // 배열 라디안 단위 변환
  function toRadian(val) {
    return val && val.map((it) => it * unitDegree);
  }
  o.toRadian = toRadian;

  // 배열 도단위 변환
  function toDegree(val) {
    return val && val.map((it) => it * unitRadian);
  }
  o.toDegree = toDegree;

  function mix(l, r, f) {
    return l * (1 - f) + r * f;
  }
  o.mix = mix;

  function random2(val1, val2) {
    return function (val) {
      const ret = (Math.sin(val * val1) * val2) % 1;
      return 0 > ret ? 1 + ret : ret;
    };
  }
  o.random2 = random2;

  function randomInt(max) {
    return ~~(Math.random() * max);
  }
  o.randomInt = randomInt;

  function rotate(angle, x, y) {
    let s = Math.sin(angle);
    let c = Math.cos(angle);

    return [x * c - y * s, x * s + y * c];
  }
  o.rotate = rotate;

  // 두개 영역이 겹치는지 여부
  // # http://cykod.github.com/AlienInvasion/
  function overlap(l, r) {
    return !(
      l.y + l.h - 1 < r.y ||
      l.y > r.y + r.h - 1 ||
      l.x + l.w - 1 < r.x ||
      l.x > r.x + r.w - 1
    );
  }
  o.overlap = overlap;

  // 영역(a)에 점(p)이 겹치는지 여부
  function includePoint(a, p) {
    return !(a.x > p.x || a.y > p.y || a.x + a.w < p.x || a.y + a.h < p.y);
  }
  o.includePoint = includePoint;

  // s 영역에 t 영역이 포함되었는지 여부
  function includeArea(s, t) {
    return !(
      s.x > t.x ||
      s.y > t.y ||
      s.x + s.w < t.x + t.w ||
      s.y + s.h < t.y + t.h
    );
  }
  o.includeArea = includeArea;

  function Animate(callback) {
    this.last = Date.now();
    this.isStop = false;
    this.callback = callback;
    this.run = () => {
      let now = Date.now();
      const dt = (now - this.last) / 1000.0;
      this.callback(dt);
      this.last = now;
      this.isStop || requestAnimationFrame(this.run);
    };
  }

  Object.assign(Animate.prototype, {
    start: function () {
      this.isStop = false;
      this.last = Date.now();
      requestAnimationFrame(this.run);
    },
    stop: function () {
      this.isStop = true;
    },
  });

  o.animate = function (callback) {
    return new Animate(callback);
  };

  function clone(obj, attrs) {
    let ret = Object.create(obj);
    Object.assign(ret, attrs);

    return ret;
  }
  o.clone = clone;
})(window, (window.o = {}));
