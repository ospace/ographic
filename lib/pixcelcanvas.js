(function (w) {
  function PixelCanvas(canvas) {
    this.ctx = canvas.getContext("2d");
    this.width = canvas.width;
    this.height = canvas.height;
    this.image = this.ctx.getImageData(0, 0, this.w, this.h);
    this.data = this.image.data;
  }

  Object.assign(PixelCanvas.prototype, {
    draw(handler) {
      for (let j = 0; j < this.h; ++j) {
        const preJ = j * this.w;
        for (let i = 0; i < this.w; ++i) {
          const color = handler(i, j) || 0;
          const idx = (i + preJ) * 4;
          this.data[idx] = this.data[idx + 1] = this.data[idx + 2] = color;
          this.data[idx + 3] = 256;
        }
      }
      this.ctx.putImageData(this.image, 0, 0);
    },
    drawUV(handler) {
      this.draw((x, y) => {
        handler(x / this.width, y / this.height);
      });
    },
  });

  w.PixelCanvas = PixelCanvas;
})(window);
