(function (w) {
  function randomRange(minVal, maxVal) {
    return minVal + Math.floor(Math.random() * (maxVal - minVal + 1));
  }

  function ParticleCanvas(canvas, field, opts) {
    console.assert("function" === typeof field, "field is not function");

    this.ctx = canvas.getContext("2d");
    this.width = canvas.width;
    this.height = canvas.height;
    this.frames = 0;
    this.framesAt = performance.now() + 1000;
    this.fps = 0;
    this.field = field;
    this.opts = Object.assign(
      {
        frame: false,
        maxAge: 50,
        colorStyles: [],
        particles: 100,
      },
      opts
    );

    this.init();
  }

  Object.assign(ParticleCanvas.prototype, {
    init() {
      let colorStyles = this.opts.colorStyles;
      if (colorStyles && 0 === colorStyles.length) {
        for (let i = 128; i <= 255; i += 10) {
          colorStyles.push(`rgb(${i},${i},${i})`);
        }
      }

      this.buckets = colorStyles.map((it) => []);
      this.particles = particles = new Array(this.opts.particles);
      for (let i = 0; i < particles.length; ++i) {
        particles[i] = {
          x: this.random(this.width),
          y: this.random(this.height),
          age: Math.floor(Math.random() * this.opts.maxAge),
        };
      }

      this.ctx.fillStyle = "rgba(64, 64, 64, 0.97)";
    },
    update() {
      const lenColorStyles = this.opts.colorStyles.length - 1;
      this.buckets.forEach((it) => (it.length = 0));

      let res;
      this.particles.forEach((it) => {
        let cnt = 10;
        while (cnt--) {
          if (this.isOver(it.x, it.y) || 0 > it.age) {
            it.x = this.random(this.width);
            it.y = this.random(this.height);
            it.age = this.opts.maxAge;
          }
          res = this.field(it.x, it.y);
          if (res) break;
          it.age = -1;
        }
        if (!res) return;
        it.x1 = it.x + res[0];
        it.y1 = it.y + res[1];
        const m =
          2 < res.length
            ? res[2]
            : Math.sqrt(res[0] * res[0] + res[1] * res[1]);
        this.buckets[Math.min(Math.floor(m), lenColorStyles)].push(it);
      });
    },
    draw() {
      const ctx = this.ctx;
      const colorStyles = this.opts.colorStyles;
      let prev = ctx.globalCompositeOperation;
      ctx.globalCompositeOperation = "destination-in";
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.globalCompositeOperation = prev;

      for (let i = 0; i < this.buckets.length; ++i) {
        const pts = this.buckets[i];
        ctx.beginPath();
        ctx.strokeStyle = colorStyles[i];
        for (let j = 0; j < pts.length; ++j) {
          let pt = pts[j];
          ctx.moveTo(pt.x, pt.y);
          ctx.lineTo(pt.x1, pt.y1);
          pt.x = pt.x1;
          pt.y = pt.y1;
          --pt.age;
        }
        ctx.stroke();
      }
    },
    render() {
      const begin = performance.now();
      this.update();
      this.draw();
      const runtime = performance.now() - begin;
      setTimeout(this.render.bind(this), Math.max(40 - runtime, 0));
    },
    random(val) {
      return Math.floor(Math.random() * (val + 1));
    },
    isOver(x, y) {
      return 0 > x || x > this.width || 0 > y || y > this.height;
    },
  });
  w.ParticleCanvas = ParticleCanvas;
})(window);
