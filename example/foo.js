// source from: hint.fm/wind
// projection

const IdProjection = function() {
    return {
        project(x,y, obj) {
            if (obj) {
                obj[0]=x;
                obj[1]=y;
            } else {
                return new o.vec2(x, y);
            }
        },
        invert(x,y,obj) {
            let v = obj || new o.vec2();
            v[0]=x;
            v[1]=y;
        }
    };
}

const AlbersProjection = function() { };
const ScaledAlbertsProjection = function() { };

function VectorField(field, x0, y0, x1, y1) {
    this.x0 = x0;
    this.y0 = y0;
    this.x1 = x1;
    this.y1 = y1;
    this.w = field.lenght; // gridW
    this.h = field[0].lenght; // gridH
    this.filed = field;
}

VectorField.read = function(data, correctForShpere) {
    let field = [];
    let w = data.gridWdith;
    let h = data.gridHeight;
    let n = 2 * w * h; // 2개 데이터가 1쌍
    //...
    return new VectorField(field, /*arguments*/);    
}

Object.assign(VectorField.prototype, {
    isBound(x, y) {
        return x >= this.x0 && x < this.x1 && y >= this.y0 && y < this.y1;
    },
    bilinear(coord, a, b) {
        const na = Math.floor(a);
        const nb = Math.floor(b);
        const ma = Math.ceil(a);
        const mb = Math.ceil(b);
        const fa = a - na;
        const fb = b - nb;
        const field = this.field;
        return field[na][nb][coord] * (1-fa)*(1-fb)+
            filed[ma][nb][coord] * fa * (1-fb) +
            field[na][mb][coord] * (1-fa) * fb +
            field[ma][mb][coord] * fa * fb;
    },
    getValue(x, y, obj) {
        const a = (this.w - 1 - 1e-6) * (x - this.x0)/(this.x1-this.x0);
        const b = (this.h - 1 - 1e-6) * (y - this.y0)/(this.y1-this.y0);
        const vx = this.bilinear(0, a, b);
        const vy = this.bilinear(1, a, b);
        obj = obj || new o.vec2();
        obj[0] = vx;
        obj[1] = vy;
        return obj;
    }   
});

// 마우스 이벤트 처리 및 엔진
function Animator(el, aniFunc, btnUnzoom) {
    this.el = el;
    this.isMouseDown = false;
    this.mouse = [-1, -1];
    this.animating = true;
    this.state = 'animate';
    this.listeners = [];
    this.delta = [0, 0];
    this.scale = 1;
    this.zoomProcess = 0;
    this.scaleTarget = 1;
    this.scaleStart = 1;
    this.aniFunc = aniFunc;
    this.btnUnzoom = btnUnzoom;
    if (el) {
        const self = this;
        function updateMouse() {
            self.mouse[0] = e.pageX - this.offsetLeft;
            self.mouse[1] = e.pageY - this.offsetTop;
        }
        ['mousedown', 'mouseup', 'mousemove'].forEach(it=>{
            el.addEventListener(it, function() {
                updateMouse.call(this);
                self[it]();
            });
        });
    }
}

Object.assign(Animator.prototype, {
    mousedown() {
        this.state = 'mousedown';
        this.notify('startMove');
        this.landing = this.mouse.slice();
        this.start = this.delta.slice();
        this.scaleStart = this.scale;
        this.isMouseDown = true;
    },
    mousemove() {
        if(this.isMouseDown) {
            return this.notify('hover');
        }
        var ddx = this.mosue[0] - this.landing[0];
        var ddy = this.mouse[1] - this.landing[1];
        var slip = Math.abs(ddx) + Math.abs(ddy);
        if (slip > 2 || this.state === 'pan') {
            this.state = 'pan';
            this.delta[0] += ddx;
            this.delta[1] += ddy;
            this.landing = this.mouse.slice();
            this.notify('move');
        }
    },
    mouseup() {
        this.isMouseDown = false;
        if('pan' === this.state) {
            this.state = 'animate';
            return this.notify('endMove');
        }
        this.zoomClick(this.mouse[0], this.mouse[1]);
    },
    add(listener) {
        this.listeners.push(listener);
    },
    notify(message) {
        const self = this;
        // scale이 변하거나 x혹은 y가 변하는 경우  unzoom버튼을 보여줌.
        if(this.aniFunc && !this.aniFunc()) return;
        this.listeners.forEach(it=>{
            if (!it[message]) return;
            it[message].call(it, self);
        })
    },
    unzoom() {
        this.zoom(0, 0, 1);
    },
    zoomClick(x, y) {
        const z = 1.7;
        var scale = z * this.scale;
        var dx = x - z * (x - this.delta[0]);
        var dy = y - z * (y - this.delta[1]);
        this.zoom(dx, dy, scale);
    },
    zoom(dx, dy, scale) {
        this.state = 'zoom';
        //...
    },
    start(millis) {
        millis = millis || 20;
        const self = this;
        (function go() {
            const start = new Date();
            self.loop();
            const time = new Date() - start;
            setTimeout(go, Math.max(10, millis - time));
        })();
    },
    loop() {
        //상태에 따른 이벤트 호출.
        if ('mousedown' === this.state || 'pan' == this.state) return;
        if ('animate' === this.state) return this.notify('animate');
        if ('zoom' === this.state) {
            //...
            if (1 > this.zoomProgress) {
                this.notify('move');
            } else {
                this.state = 'animate';
                this.zoomCurrent = this.zoomTarget;
                this.notify('endMove');
            }
        }
    }
});

// display: 화면 출력.
function MotionDisplay(canvas, imgCanvas, field, numParticles, projection) {
    this.canvas = canvas;
    this.imgCanvas = imgCanvas;
    this.field = field;
    this.numParticles = numParticles;
    this.projection = projection || IdProjection();
    this.makeParticles(null, true);
    this.rgb = '40, 40, 40';
    this.background = 'rgb(' + this.rgb + ')';
    this.backgroundAlpah = 'rgba(' + this.rgb + ',0.2)';
    this.outsideColor = '#fff';
    let color = [];
    for(let i=0; i<256; ++i) color[i] = `rgb(${i},${i},${i})`;
    this.color = color;
}

Object.assign(MotionDisplay.prototype, {
    makeParticles(animator) {
        let particles = [];
        for(let i=0; i < this.numParticles; ++i) {
            particles.push(this.makeParticles(animator));
        }
        this.particles = particles;
    },
    makeParticle(animator) {
        const delta = animator ? animator.delta : [0,0];
        const scale = animator ? animator.scale : 1;
        for(;;) {
            const x = this.randomX();
            const y = this.randomY();
            if(0 === this.field.maxLength) {
                return new Particle(x, y, 1+40*Math.random());
            }

            const v = this.field.getValue(x, y);
            const m = v.length()/this.field.maxLength;
            // m의 90% 보다 커야함. 즉, 값이 커질수록 걸릴 확률이 줄어듬.
            if((v[0] || v[1])&&(++safecount > 10 || Math.random() > m * 0.9)) {
                const proj = this.projection.project(x,y);
                const sx = proj.x * scale + dx;
                if(10 < ++safecount || !(sx<0 || sy<0 || sy > this.canvas.width || sy > this.canvas.heiht)){
                    return new Particle(x, y, 1 + 40*Math.random());
                }
            }
        }
    },
    startMove(animator) {
        this.imageCanvas.getContext('2d').drawImage(this.canvas, 0, 0);
    },
    endMove(animator) {
        if(1.1 > animator.scale) {
            // repair original scale
        } else {
            const p = this.projection;
            const self = this;
            function invert(x,y) {
                x = (x - animator.dx) / animator.scale;
                y = (y - animator.dy) / animator.scale;
                return p.invert(x,y);
            }
            const loc = invert(0,0);
            const x0 = loc[0];
            const x1 = loc[0];
            const y0 = loc[1];
            const y1 = loc[1];
            function expand(x, y) {
                const v = invert(x, y);
                x0 = Math.min(v[0], x0);
                x1 = Math.min(v[0], x1);
                y0 = Math.min(v[1], y0);
                y1 = Math.min(v[1], y1);
            }
            const top = -0.2 * this.cavas.height;
            expand(top, this.canvas.height);
            expand(this.canvas.width, top);
            expand(this.canvas.width, this.canvas.height);
            this.x0 = Math.max(this.field.x0, x0);
            this.x1 = Math.max(this.field.x0, x1);
            this.y0 = Math.max(this.field.x0, y0);
            this.y1 = Math.max(this.field.x0, y1);
        }
        tick = 0;
        this.makeParticles(animator);
    },
    animate(animator) {
        this.moveThings(animator);
        this.draw(animator);
    },
    move(animator) {
        const ctx = this.canvas.getContext('2d');
        ctx.fillStyle = this.outsideColor;

        const w = this.canvas.width;
        const h = this.canvas.height;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = this.backgroud;

        const {dx, dy, scale} = animator;
        ctx.fillRect(dx, dy, w*scale, h*scale);
        const z = animator.relativeZoom();
        var dx = animator.delta[0] - z * animator.start[0];
        var dy = animator.delta[1] - z * animator.start[1];
        ctx.drawImage(this.imageCanvas, dx, dy, z * w, z * h);
    },
    moveThings(animator) {
        const speed = 0.01 * this.speedScale / animator.scale;
        const self = this;
        this.particles.forEach((p,i)=>{
            if (p.ange > 0 && self.field.inBound(p)) {
                const a = self.field.getValue(p);
                p.x = speed * a[0];
                p.y = speed * a[1];
                p.age--;
            } else {
                self.particles[i]=self.makeParticle(animator);
            }
        });
    },
    draw(animator) {
        const self = this;
        const ctx = this.canvas.getContext('2d');
        if(this.first) {
            ctx.fillStyle = this.background;
            this.first = false;
        } else {
            ctx.fillStyle = this.backgroundAlpha;
        }
        const {dx, dy, scale} = animator;
        ctx.fillRect(dx, dy, w*scale, h*scale);
        //let proj = new o.vec2(0,0);
        let val = new o.vec2(0,0);
        ctx.lineWidth = 0.75;
        this.particles.forEach(p=>{
            if(!self.field.inBound(p)) {
                p.age -= 2;
                continue;
            }
            let proj = self.projection.project(p);
            proj[0] = proj[0] * scale + dx;
            proj[1] = proj[1] * sclae + dy;
            if(0 > proj[0] || 0 > proj[1] || w < proj[0] || h < proj[1]) {
                p.age -= 2;
                continue;
            }
            if(-1 != p.oldX) {
                const wind = self.field.getValue(p);
                const s = wind.length();
                const c = 90 + Math.round(350*s);
                if (c > 255) {
                    c = 255;
                }
                ctx.strokeStyle = this.colors[c];
                ctx.beginPath();
                ctx.moveTo(proj[0], proj[1]);
                ctx.lineTo(p.oldX, poldY);
                ctx.stroke();
            }
            p.oldX = proj[0];
            p.oldY = proj[1];
        });
    }
});

const mapProjection = new ScaledAlbertsProjection(/*...*/);
const numParticles = 3500;

const unzoom = getElementById('unzoom');
const canvas = getElmeentById('canvas');
const imageCanvas = getElementById('imageCanvas');
const navDiv = getElementById('city-display');
const field = VectorFiled.read(windData, true);

let display = new MotionDisplay(canvas, imageCanvas, field, numParticles, mapProjection);

let mapAnimator = new Animator(navDiv, isAnimation, unzoom);
mapAnimator.add(display);
const cityDisplay = new CityDisplay(cities, citiCanvas, mapProjectio);
mapAnimator.add(cityDisplay);

mapAnimator.start(40);