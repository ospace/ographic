(function (root, f) {
  "function" === typeof define && define.amd
    ? define("o", f({}))
    : f(root.o || (root.o = {}));
})("undefined" !== typeof window ? window : this, (o) => {
  function Vec2(v) {
    let ret = new Proxy(v, {
      get(t, k, r) {
        let fn = Vec2.fn[k];
        return fn ? fn.bind(v, ret) : Reflect.get(t, k, r);
      },
      set(t, k, v, r) {
        return Reflect.set(t, k, v, r);
      }
    });
    return ret;
  }
  o.Vec2 = Vec2;

  const fn = {
    dot(l, r) {
      return l[0] * r[0] + l[1] * r[1];
    },
    cross(l, r) {
      return l[0] * r[1] - l[1] * r[1];
    },
    mag(v) {
      return Math.sqrt(fn.dot(v, v));
    },
    projection(l, r) {
      return mul(r, fn.dot(l, r) / fn.dot(r, r));
    },
    add(l, r, ret = Vec2([0, 0])) {
      ret[0] = l[0] + r[0];
      ret[1] = l[1] + r[1];
      return ret;
    },
    sub(l, r, ret = Vec2([0, 0])) {
      ret[0] = l[0] - r[0];
      ret[1] = l[1] - r[1];
      return ret;
    },
    mul(l, r, ret = Vec2([0, 0])) {
      ret[0] = l[0] * r;
      ret[1] = l[1] * r;
      return ret;
    },
    div(l, r, ret = Vec2([0, 0])) {
      ret[0] = l[0] / r;
      ret[1] = l[1] / r;
      return ret;
    },
    unitOf(v) {
      let len = mag(v);
      return Vec2(len ? [v[0] / len, v[1] / len] : [0, 0]);
    },
    equal(l, r) {
        return l[0] === r[0] && l[1] === r[1];
    },
    toRaw() { return this; }
  };
  Vec2.fn = fn;
  
  function distancePointToSegment(pt, seg1, seg2) {
    return fn.mag(fn.sub(pt, pointToSegment(pt, seg1, seg2)));
  }
  o.distancePointToSegment = distancePointToSegment;

  function pointToSegment(pt, seg1, seg2) {
    let axis = fn.sub(seg2, seg1, []);
    let l = fn.dot(axis, axis);
    return 0 === l ? seg1 : fn.projection(fn.sub(pt, seg1, []), axis);
  }
  o.pointToSegment = pointToSegment;

  return o;
});