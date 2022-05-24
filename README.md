# ographic

# CDN

기본

```
<script src="http://cdn.jsdelivr.net/gh/ospace/ographic/lib/pixcelcanvas.js"></script>
```

특정커밋

```
<script src="http://cdn.jsdelivr.net/gh/ospace/ographic@f254fc4/lib/pixcelcanvas.js"></script>
```

# Particle Canvas 사용법

```
function field(x, y) {
    let x; // 벡터 x 좌표
    let y; // 벡터 y 좌표
    let m; // 크기 (없으면 벡터크기를 사용)
    //...
    return [x, y, m]
}

const particleCanvas = new ParticleCanvas(canvas, field);
particleCanvas.render();
```

## 옵션

- maxAge: particle 수명
- colorStyles: field()의 크기값으로 색상 결정
- particles: 파티클 개수
