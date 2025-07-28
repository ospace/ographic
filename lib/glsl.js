(function (root, f) {
  "function" === typeof define && define.amd
    ? define("o", f({}))
    : f(root.o || (root.o = {}));
})("undefined" !== typeof window ? window : this, (o) => {
    
  "use strict";
  function glsl(canvas) {
    if (!canvas) throw Error("must be canvas");
    this.canvas = canvas;
    let gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      throw new Error(
        "Failed to get WebGL context." +
          "Your browser or device may not support WebGL."
      );
    }
    this.gl = gl;
  }

  const uniformRe = /\s*uniform\s+([\w\d]+)\s+(\S+);/g;

  const VERTEXT_STRING = `#ifdef GL_ES
  precision mediump float;
  #endif
  void main() {
    gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
    gl_PointSize = 1024.0;
  }`;

  const FRAGMENT_STRING = `#ifdef GL_ES
    precision mediump float;
    #endif
    varying vec2 v_texcoord;
    void main(){
        gl_FragColor = vec4(0.0);
    }`;

  function load(fragmentScript, vertextScript) {
    let self = this;
    let gl = this.gl;

    vertextScript = vertextScript || VERTEXT_STRING;
    let vertexShader = createShader(gl, vertextScript, gl.VERTEX_SHADER);
    fragmentScript = fragmentScript || FRAGMENT_STRING;
    let fragmentShader = createShader(gl, fragmentScript, gl.FRAGMENT_SHADER);

    let program = buildShader(gl, vertexShader, fragmentShader);
    this.program = program;
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      var linkErrLog = gl.getProgramInfoLog(program);
      // cleanup();
      if (linkErrLog) {
        console.error(linkErrLog);
        throw new Error(
          `Shader program did not link successfully.
            Error log:
            ${linkErrLog}`
        );
      }
      return;
    }

    let uniforms = [];
    let each;
    while ((each = uniformRe.exec(fragmentScript))) {
      // const type = each[1];
      const name = each[2];
      console.log("> uniform - type:", each[1], "name:", name);
      let type, getter;
      switch (name) {
        case "u_name":
          type = "1f";
          getter = () => performance.now() / 1000;
          break;
        case "u_resolution":
          type = "2fv";
          getter = () => [this.canvas.width, this.canvas.height];
          break;
        case "u_mouse":
          {
            let ptMouse = [0.0, 0.0];
            self.canvas.addEventListener(
              "mousemove",
              function ({ offsetX, offsetY }) {
                ptMouse = [offsetX, offsetY];
              }
            );
            type = "2fv";
            getter = () => ptMouse;
          }
          break;
        case "u_time":
          type = "1f";
          getter = () => performance.now() / 1000;
          break;
      }

      if (getter) {
        uniforms.push(defineUniform(gl, program, name, type, getter));
      }
    }

    let buffer = initializeAttributes(gl);

    // uniforms.push(
    //   defineUniform(gl, program, "u_time", "1f", () => performance.now() / 1000)
    // );
    // uniforms.push(
    //   defineUniform(gl, program, "u_resolution", "2fv", () => [
    //     this.canvas.width,
    //     this.canvas.height,
    //   ])
    // );
    // let ptMouse = [0.0, 0.0];
    // this.canvas.addEventListener("mousemove", function ({ offsetX, offsetY }) {
    //   ptMouse = [offsetX, offsetY];
    // });
    // uniforms.push(defineUniform(gl, program, "u_mouse", "2fv", () => ptMouse));

    (function render() {
      self.clear(gl);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      uniforms.forEach((it) => it.update());
      //gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 0, 0);
      //var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
      //gl.enableVertexAttribArray(positionAttributeLocation);
      gl.drawArrays(gl.POINTS, 0, 1);
      //gl.drawArrays(gl.LINES, 0, 2);
      self.renderer = requestAnimationFrame(render);
    })();
    console.log("glsl loaded...");
  }

  function stop() {
    if (this.renderer) {
      cancelAnimationFrame(this.renderer);
      this.renderer = undefined;
    }
    let gl = this.gl;
    gl.useProgram(null);
    if (this.buffer) {
      gl.deleteBuffer(this.buffer);
      this.buffer = undefined;
    }
    if (this.program) {
      gl.deleteProgram(this.program);
      this.program = undefined;
    }
  }

  function clear() {
    let gl = this.gl;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
  Object.assign(glsl.prototype, {
    load,
    clear,
    stop,
  });
  o.glsl = glsl;
  function defineUniform(gl, program, name, type, getter) {
    const method = gl[`uniform${type}`];
    if (!method) throw TypeError(`gl not support uniform type: ${type}`);
    const location = gl.getUniformLocation(program, name);
    return {
      update() {
        const value = getter();
        if (value === this.value) return;
        //method.apply(gl, [location].concat(value));
        method.call(gl, location, value);
        this.value = value;
      },
    };
  }

  function buildShader(gl, vertexShader, fragmentShader) {
    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.detachShader(program, vertexShader);
    gl.detachShader(program, fragmentShader);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return program;
  }

  function createShader(gl, source, type) {
    var ret = gl.createShader(type);
    gl.shaderSource(ret, source);
    gl.compileShader(ret);
    if (!gl.getShaderParameter(ret, gl.COMPILE_STATUS)) {
      let err = gl.getShaderInfoLog(ret);
      gl.deleteShader(ret);
      throw new Error("Error compiling: ", err);
    }
    return ret;
  }

  function initializeAttributes(gl) {
    gl.enableVertexAttribArray(0);
    let buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 0, 0);
    return buffer;
  }

  o.loadGlsl = function (canvas, flagmentStr, vertextStr) {
    let ret = new glsl(canvas);
    ret.load(flagmentStr, vertextStr);
    return ret;
  };
});
