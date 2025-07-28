(function (root, f) {
  "function" === typeof define && define.amd
    ? define("o", f({}))
    : f(root.o || (root.o = {}));
})("undefined" !== typeof window ? window : this, (o) => {
  function Vec2(v) {
    let ret = new Proxy(v, {
      get(t, k, r) {
        let fn = Vec2.fn[k];
        return fn ? fn.bind(Vec2, ret) : Reflect.get(t, k, r);
      },
      set(t, k, v, r) {
        return Reflect.set(t, k, v, r);
      }
    });
    return ret;
  }
  o.Vec2 = Vec2;

  Vec2.fn = {
    dot(l, r) {
      return l[0] * r[0] + l[1] * r[1];
    },
    cross(l, r) {
      return l[0] * r[1] - l[1] * r[1];
    },
    mag(v) {
      return Math.sqrt(Vec2.dot(v, v));
    },
    projection(l, r) {
      return mul(r, Vec2.dot(l, r) / Vec2.dot(r, r));
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
    }
  };

  return o;
});