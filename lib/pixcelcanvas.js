(function (w) {
  function PixelCanvas(canvas, opts) {
    this.ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    this.image = this.ctx.getImageData(0, 0, width, height);
    this.data = this.image.data;
    this.width = width;
    this.height = height;
    this.frames = 0;
    this.framesAt = performance.now() + 1000;
    this.fps = 0;
    this.opts = Object.assign({ frame: false }, opts);
  }
  Object.assign(PixelCanvas.prototype, {
    draw(handler) {
      if ("function" === typeof handler) {
        for (let j = 0; j < this.height; ++j) {
          const preJ = j * this.width;
          for (let i = 0; i < this.width; ++i) {
            const idx = (i + preJ) * 4;
            const color =
              handler(
                i,
                j,
                this.data[idx],
                this.data[idx + 1],
                this.data[idx + 2],
                this.data[idx + 3]
              ) || 0;
            this.setColorAt(idx, color);
          }
        }
      }
      this.update();
      this.showFps();
    },
    showFps() {
      if (!this.opts.frame) return;
      ++this.frames;
      if (this.framesAt < performance.now()) {
        const framesAt = performance.now();
        this.fps = this.frames / ((framesAt - this.framesAt) / 1000 + 1);
        this.framesAt = framesAt + 1000;
        this.frames = 0;
      }
      const strFps = "FPS: " + Math.round(this.fps);
      this.ctx.save();
      this.ctx.fillStyle = "rgba(0, 0, 0, .2)";
      this.ctx.font = "9px Verdana";
      for (let i = -2; i < 2; ++i) {
        for (let j = -2; j < 2; ++j) {
          this.ctx.fillText(strFps, 3 + i, 10 + j);
        }
      }
      this.ctx.fillStyle = "rgba(255, 255, 255, .75)";
      this.ctx.fillText(strFps, 3, 10);
      this.ctx.restore();
    },
    drawUV(handler) {
      this.draw((x, y, r, g, b, a) =>
        handler(x / this.width, y / this.height, r, g, b, a)
      );
    },
    update() {
      this.ctx.putImageData(this.image, 0, 0);
    },
    point(x, y, color) {
      if (this.isOver(x, y)) return;
      const idx = (parseInt(x) + parseInt(y) * this.width) * 4;
      this.setColorAt(parseInt(idx), color);
    },
    isOver(x, y) {
      return 0 > x || x >= this.width || 0 > y || y >= this.height;
    },
    setColorAt(idx, color, alpha = 1.0) {
      if (Array.isArray(color)) {
        this.data[idx] = this.data[idx] * (1 - alpha) + color[0] * alpha;
        this.data[idx + 1] =
          this.data[idx + 1] * (1 - alpha) + color[1] * alpha;
        this.data[idx + 2] =
          this.data[idx + 2] * (1 - alpha) + color[2] * alpha;
        this.data[idx + 3] = undefined === color[3] ? 256 : color[3];
      } else {
        this.data[idx] = this.data[idx] * (1 - alpha) + color * alpha;
        this.data[idx + 1] = this.data[idx + 1] * (1 - alpha) + color * alpha;
        this.data[idx + 2] = this.data[idx + 2] * (1 - alpha) + color * alpha;
        this.data[idx + 3] = 256;
      }
    },
    background(value, alpha = 1.0) {
      for (let i = 0, n = this.data.length; i < n; i += 4) {
        this.setColorAt(i, value, alpha);
      }
    },
  });
  w.PixelCanvas = PixelCanvas;
})(window);
