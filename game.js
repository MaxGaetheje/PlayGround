import * as THREE from './vendor/three.module.js';

/* ------------------------------------------------------------------ */
/*  COURTSIDE 3D — a one-minute half-court run                          */
/* ------------------------------------------------------------------ */

const gameEl = document.getElementById('game');
const canvasHost = gameEl;

// UI bindings live with the 3v3 game state below.


/* ------------------------------ renderer ------------------------------ */

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.domElement.id = 'court';
canvasHost.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x061110);
scene.fog = new THREE.FogExp2(0x061110, 0.021);

const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(0, 4.4, 10.5);

/* ------------------------------ lighting ------------------------------ */

const hemi = new THREE.HemisphereLight(0x9fd8c4, 0x101a16, 1.05);
scene.add(hemi);

const keyLight = new THREE.DirectionalLight(0xfff0d2, 2.7);
keyLight.position.set(-6.5, 13, 6.5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.left = -12;
keyLight.shadow.camera.right = 12;
keyLight.shadow.camera.top = 16;
keyLight.shadow.camera.bottom = -16;
keyLight.shadow.camera.near = 2;
keyLight.shadow.camera.far = 34;
keyLight.shadow.bias = -0.0006;
keyLight.shadow.radius = 3;
keyLight.target.position.set(0, 0, -6);
scene.add(keyLight, keyLight.target);

const fillLight = new THREE.DirectionalLight(0x7effd0, 0.75);
fillLight.position.set(8, 6, -14);
fillLight.target.position.set(0, 1.5, -4);
scene.add(fillLight, fillLight.target);

const rackLight = new THREE.PointLight(0xd8ff3e, 55, 16, 2);
rackLight.position.set(0, 5.4, -11.5);
scene.add(rackLight);

const warmLight = new THREE.PointLight(0xffb26b, 45, 20, 2);
warmLight.position.set(2.5, 7.5, 4);
scene.add(warmLight);

/* ------------------------------ textures ------------------------------ */

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function canvasTexture(c) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}

function makeEnvironmentTexture() {
  const c = makeCanvas(1024, 512);
  const g = c.getContext('2d');
  const sky = g.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, '#132b25');
  sky.addColorStop(0.42, '#0a1a17');
  sky.addColorStop(1, '#040a09');
  g.fillStyle = sky; g.fillRect(0, 0, 1024, 512);
  const glows = [
    [170, 110, 130, 'rgba(216,255,62,0.5)'],
    [500, 80, 170, 'rgba(255,245,220,0.64)'],
    [830, 120, 150, 'rgba(160,255,214,0.4)'],
    [330, 230, 90, 'rgba(255,178,107,0.28)'],
    [720, 250, 100, 'rgba(216,255,62,0.24)']
  ];
  for (const [x, y, r, color] of glows) {
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, color);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const envTex = makeEnvironmentTexture();
scene.environment = envTex;

function makeGlowTexture() {
  const c = makeCanvas(256, 256);
  const g = c.getContext('2d');
  const rg = g.createRadialGradient(128, 128, 0, 128, 128, 126);
  rg.addColorStop(0, 'rgba(255,255,240,1)');
  rg.addColorStop(0.22, 'rgba(230,255,188,0.72)');
  rg.addColorStop(0.55, 'rgba(180,255,140,0.15)');
  rg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = rg; g.fillRect(0, 0, 256, 256);
  return canvasTexture(c);
}
const glowTex = makeGlowTexture();


function makeCourtTexture() {
  const W = 1024;
  const c = makeCanvas(W, W);
  const g = c.getContext('2d');

  const base = g.createLinearGradient(0, 0, 0, W);
  base.addColorStop(0, '#c08051');
  base.addColorStop(0.45, '#b9794a');
  base.addColorStop(1, '#a86840');
  g.fillStyle = base;
  g.fillRect(0, 0, W, W);

  // vertical planks
  for (let x = 0; x < W; x += 38) {
    g.fillStyle = Math.random() < 0.5 ? 'rgba(60,30,15,0.035)' : 'rgba(255,225,190,0.035)';
    g.fillRect(x, 0, 38, W);
    g.strokeStyle = 'rgba(70,35,18,0.20)';
    g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x, W); g.stroke();
    const joints = 2 + Math.floor(Math.random() * 3);
    for (let j = 0; j < joints; j++) {
      const y = 70 + Math.random() * (W - 140);
      g.strokeStyle = 'rgba(70,35,18,0.13)';
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + 38, y); g.stroke();
    }
  }

  // grain
  for (let i = 0; i < 150; i++) {
    const x = Math.random() * W;
    g.strokeStyle = `rgba(80,40,20,${0.02 + Math.random() * 0.045})`;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x, 0);
    g.bezierCurveTo(x + 7, 320, x - 6, 680, x + 3, W);
    g.stroke();
  }

  // soft overhead light pools baked into the floor
  g.globalCompositeOperation = 'lighter';
  for (const [x, y, r, a] of [[300, 390, 300, .13], [730, 410, 320, .12], [512, 810, 380, .14], [512, 140, 260, .12]]) {
    const rg = g.createRadialGradient(x, y, 10, x, y, r);
    rg.addColorStop(0, `rgba(255,240,205,${a})`);
    rg.addColorStop(1, 'rgba(255,240,205,0)');
    g.fillStyle = rg;
    g.fillRect(0, 0, W, W);
  }
  g.globalCompositeOperation = 'source-over';

  // painted key
  const keyX = 345, keyW = 334, keyY = 0, keyH = 424;
  const keyGrad = g.createLinearGradient(0, keyY, 0, keyH);
  keyGrad.addColorStop(0, 'rgba(31,78,64,0.88)');
  keyGrad.addColorStop(1, 'rgba(37,89,74,0.82)');
  g.fillStyle = keyGrad;
  g.fillRect(keyX, keyY, keyW, keyH);

  g.strokeStyle = 'rgba(250,240,218,0.92)';
  g.lineWidth = 5.5;
  g.lineCap = 'round';

  // court border
  g.strokeRect(9, 9, W - 18, W - 18);
  // halfcourt sideline emphasis
  g.strokeRect(9, 9, W - 18, W - 18);

  // key outline
  g.strokeRect(keyX, keyY, keyW, keyH);
  // free throw circle
  g.beginPath(); g.arc(512, keyH, 132, 0, Math.PI * 2); g.stroke();

  // three point line: arc centered on the rim + corner lines
  const rimY = (1.5 / 14) * W;
  const arcR = (6.75 / 15) * W;
  const cornerX = (6.6 / 15) * W;
  const dx = cornerX;
  const dy = Math.sqrt(Math.max(0, arcR * arcR - dx * dx));
  const ang = Math.atan2(dy, dx);
  g.beginPath(); g.arc(512, rimY, arcR, ang, Math.PI - ang); g.stroke();
  g.beginPath(); g.moveTo(512 - cornerX, 9); g.lineTo(512 - cornerX, rimY + dy); g.stroke();
  g.beginPath(); g.moveTo(512 + cornerX, 9); g.lineTo(512 + cornerX, rimY + dy); g.stroke();

  // restricted area
  g.beginPath(); g.arc(512, rimY + 6, (1.25 / 15) * W, 0, Math.PI); g.stroke();

  // center circle / halfcourt mark
  g.beginPath(); g.arc(512, W - 9, 118, Math.PI, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(0, W - 9); g.lineTo(W, W - 9); g.stroke();

  // center-court wordmark
  g.fillStyle = 'rgba(250,240,218,0.28)';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.letterSpacing = '10px';
  g.font = '900 26px system-ui,sans-serif';
  g.fillText('COURTSIDE', 512, 948);
  g.letterSpacing = '4px';
  g.font = '700 11px system-ui,sans-serif';
  g.fillStyle = 'rgba(216,255,62,0.55)';
  g.fillText('THE RUN', 512, 976);

  return canvasTexture(c);
}

function makeBallTexture() {
  const c = makeCanvas(256, 256);
  const g = c.getContext('2d');
  const rg = g.createRadialGradient(88, 78, 8, 128, 128, 190);
  rg.addColorStop(0, '#e08b4d');
  rg.addColorStop(0.55, '#c96a34');
  rg.addColorStop(1, '#8d3f1c');
  g.fillStyle = rg;
  g.fillRect(0, 0, 256, 256);

  g.strokeStyle = '#35190c';
  g.lineWidth = 4.5;
  g.beginPath(); g.moveTo(128, -4); g.lineTo(128, 260); g.stroke();
  g.beginPath(); g.moveTo(-4, 128); g.lineTo(260, 128); g.stroke();
  g.beginPath(); g.moveTo(-10, 54); g.bezierCurveTo(94, 100, 94, 156, -10, 202); g.stroke();
  g.beginPath(); g.moveTo(266, 54); g.bezierCurveTo(162, 100, 162, 156, 266, 202); g.stroke();

  // dimples / grain
  for (let i = 0; i < 600; i++) {
    g.fillStyle = `rgba(70,30,12,${Math.random() * 0.16})`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 1.6, 1.6);
  }
  return canvasTexture(c);
}

function makeBoardTexture() {
  const c = makeCanvas(512, 300);
  const g = c.getContext('2d');
  g.clearRect(0, 0, 512, 300);
  g.strokeStyle = 'rgba(245,248,238,0.95)';
  g.lineWidth = 13;
  g.strokeRect(9, 9, 494, 282);
  g.lineWidth = 9;
  g.strokeRect(155, 128, 202, 140);
  return canvasTexture(c);
}

function makeSignTexture() {
  const c = makeCanvas(1024, 256);
  const g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, 256);
  bg.addColorStop(0, '#0b1a18');
  bg.addColorStop(1, '#071211');
  g.fillStyle = bg; g.fillRect(0, 0, 1024, 256);
  g.strokeStyle = 'rgba(216,255,62,0.85)'; g.lineWidth = 5;
  g.strokeRect(12, 12, 1000, 232);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.letterSpacing = '18px';
  g.font = '900 104px system-ui,sans-serif';
  g.fillStyle = '#d8ff3e';
  g.shadowColor = '#d8ff3e'; g.shadowBlur = 26;
  g.fillText('COURTSIDE', 512, 112);
  g.shadowBlur = 0;
  g.letterSpacing = '12px';
  g.font = '800 25px system-ui,sans-serif';
  g.fillStyle = 'rgba(238,245,228,0.7)';
  g.fillText('THE RUN  ·  3D ARENA', 512, 198);
  return canvasTexture(c);
}

function makeRibbonTexture() {
  const c = makeCanvas(1024, 96);
  const g = c.getContext('2d');
  g.fillStyle = '#081412'; g.fillRect(0, 0, 1024, 96);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.letterSpacing = '6px';
  g.font = '900 40px system-ui,sans-serif';
  g.fillStyle = '#d8ff3e';
  g.fillText('COURTSIDE   ·   THE RUN   ·   ', 512, 50);
  const t = canvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.repeat.x = 3;
  return t;
}

function makeNumberTexture(n) {
  const c = makeCanvas(128, 128);
  const g = c.getContext('2d');
  g.clearRect(0, 0, 128, 128);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '900 88px system-ui,sans-serif';
  g.fillStyle = 'rgba(250,248,238,0.95)';
  g.fillText(n, 64, 68);
  return canvasTexture(c);
}

/* ------------------------------ arena ------------------------------ */

const floorMat = new THREE.MeshStandardMaterial({ color: 0x0b1715, roughness: 0.82, metalness: 0.05 });
const outerFloor = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), floorMat);
outerFloor.rotation.x = -Math.PI / 2;
outerFloor.position.y = -0.04;
outerFloor.receiveShadow = true;
scene.add(outerFloor);

const court = new THREE.Mesh(
  new THREE.PlaneGeometry(15, 14),
  new THREE.MeshStandardMaterial({ map: makeCourtTexture(), roughness: 0.28, metalness: 0.12, envMapIntensity: 0.55 })
);
court.rotation.x = -Math.PI / 2;
court.position.set(0, 0, -7);
court.receiveShadow = true;
scene.add(court);

// court edge trim
const trimMat = new THREE.MeshStandardMaterial({ color: 0x1a2b27, roughness: 0.5, metalness: 0.4 });
for (const [x, z, w, d] of [[0, 0.12, 15.4, 0.16], [0, -14.12, 15.4, 0.16], [-7.58, -7, 0.16, 14.4], [7.58, -7, 0.16, 14.4]]) {
  const trim = new THREE.Mesh(new THREE.BoxGeometry(w, 0.07, d), trimMat);
  trim.position.set(x, 0.015, z);
  trim.receiveShadow = true;
  scene.add(trim);
}

// dark arena walls
const wallMat = new THREE.MeshStandardMaterial({ color: 0x091412, roughness: 0.9, metalness: 0.05 });
const backWall = new THREE.Mesh(new THREE.BoxGeometry(56, 16, 0.6), wallMat);
backWall.position.set(0, 7.5, -24);
backWall.receiveShadow = true;
scene.add(backWall);
for (const s of [-1, 1]) {
  const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 16, 42), wallMat);
  sideWall.position.set(s * 21, 7.5, -6);
  sideWall.receiveShadow = true;
  scene.add(sideWall);
}

// signage
const sign = new THREE.Mesh(
  new THREE.PlaneGeometry(14, 3.5),
  new THREE.MeshBasicMaterial({ map: makeSignTexture(), transparent: true, opacity: 0.42, toneMapped: false })
);
sign.position.set(0, 7.1, -23.55);
scene.add(sign);

const ribbon = new THREE.Mesh(
  new THREE.PlaneGeometry(38, 0.62),
  new THREE.MeshBasicMaterial({ map: makeRibbonTexture(), transparent: true, opacity: 0.32, toneMapped: false })
);
ribbon.position.set(0, 4.35, -23.6);
scene.add(ribbon);

// light towers
const towerMat = new THREE.MeshStandardMaterial({ color: 0x101c19, roughness: 0.65, metalness: 0.5 });
const lampMat = new THREE.MeshBasicMaterial({ color: 0xe8ffe8, toneMapped: false });
for (const s of [-1, 1]) {
  const tower = new THREE.Mesh(new THREE.BoxGeometry(0.42, 11, 0.42), towerMat);
  tower.position.set(s * 10.5, 5.5, -22.5);
  scene.add(tower);
  for (let i = 0; i < 4; i++) {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.16, 0.34), lampMat);
    lamp.position.set(s * 10.5, 9.2 + i * 0.32, -22.25);
    scene.add(lamp);
  }
}

/* ------------------------------ crowd ------------------------------ */

const crowdGroup = new THREE.Group();
scene.add(crowdGroup);

const standMat = new THREE.MeshStandardMaterial({ color: 0x13201d, roughness: 0.92 });
const crowdColors = [0x1c2b28, 0x273733, 0x3a2f2a, 0x22302e, 0x2e3a34, 0x453630, 0x1a2523];
const headColors = [0x8d6247, 0x6b452f, 0xa97a58, 0x50362a, 0x7c5238];

const crowdSpots = [];
for (let r = 0; r < 6; r++) {
  const h = 0.5 + r * 0.42;
  const step = new THREE.Mesh(new THREE.BoxGeometry(31, h, 1.05), standMat);
  step.position.set(0, h / 2, -16.2 - r * 0.98);
  step.receiveShadow = true;
  crowdGroup.add(step);
  for (let i = 0; i < 29; i++) {
    if (Math.random() < 0.12) continue;
    const x = -14.4 + i * 1.03 + (Math.random() - 0.5) * 0.22;
    const z = -16.2 - r * 0.98 + (Math.random() - 0.5) * 0.24;
    const y = h + 0.34;
    crowdSpots.push({ x, y, z, ry: Math.PI, s: 0.9 + Math.random() * 0.2 });
  }
}
for (const s of [-1, 1]) {
  for (let r = 0; r < 4; r++) {
    const h = 0.45 + r * 0.4;
    const step = new THREE.Mesh(new THREE.BoxGeometry(1.05, h, 15.5), standMat);
    step.position.set(s * (9.0 + r * 1.0), h / 2, -7);
    step.receiveShadow = true;
    crowdGroup.add(step);
    for (let i = 0; i < 13; i++) {
      if (Math.random() < 0.18) continue;
      const z = -13.2 + i * 1.05 + (Math.random() - 0.5) * 0.3;
      crowdSpots.push({
        x: s * (9.0 + r * 1.0) + (Math.random() - 0.5) * 0.2,
        y: h + 0.32,
        z,
        ry: s > 0 ? -Math.PI / 2 : Math.PI / 2,
        s: 0.88 + Math.random() * 0.22
      });
    }
  }
}

const bodyGeo = new THREE.CapsuleGeometry(0.16, 0.34, 3, 6);
const headGeo = new THREE.SphereGeometry(0.105, 6, 5);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, emissive: 0x0a1512, emissiveIntensity: 0.7 });
const headMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });

const crowdBodies = new THREE.InstancedMesh(bodyGeo, bodyMat, crowdSpots.length);
const crowdHeads = new THREE.InstancedMesh(headGeo, headMat, crowdSpots.length);
crowdBodies.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
crowdHeads.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
const dummy = new THREE.Object3D();
const col = new THREE.Color();

crowdSpots.forEach((p, i) => {
  dummy.position.set(p.x, p.y, p.z);
  dummy.rotation.set(0, p.ry, 0);
  dummy.scale.set(p.s, p.s, p.s);
  dummy.updateMatrix();
  crowdBodies.setMatrixAt(i, dummy.matrix);
  const c1 = new THREE.Color(crowdColors[i % crowdColors.length]);
  c1.offsetHSL(0, 0, (Math.random() - 0.5) * 0.06);
  crowdBodies.setColorAt(i, c1);

  dummy.position.set(p.x, p.y + 0.43 * p.s, p.z);
  dummy.updateMatrix();
  crowdHeads.setMatrixAt(i, dummy.matrix);
  col.setHex(headColors[i % headColors.length]);
  col.offsetHSL(0, 0, (Math.random() - 0.5) * 0.08);
  crowdHeads.setColorAt(i, col);
});
crowdBodies.instanceMatrix.needsUpdate = true;
crowdHeads.instanceMatrix.needsUpdate = true;
crowdBodies.castShadow = false;
crowdBodies.receiveShadow = false;
crowdGroup.add(crowdBodies, crowdHeads);

// subtle spotlights in the air
const beamMat = new THREE.MeshBasicMaterial({
  color: 0xbcffd8, transparent: true, opacity: 0.028, depthWrite: false,
  blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false
});
for (const [x, z] of [[-5, -4], [5, -8], [0, 2]]) {
  const beam = new THREE.Mesh(new THREE.ConeGeometry(3.2, 10, 20, 1, true), beamMat);
  beam.position.set(x, 5.2, z);
  scene.add(beam);
}

// lens glows for the arena rig
for (const s of [-1, 1]) {
  for (let i = 0; i < 4; i++) {
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color: 0xe8ffd2, transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
    }));
    spr.position.set(s * 10.5, 9.2 + i * 0.32, -22.15);
    spr.scale.set(1.65, 1.65, 1);
    scene.add(spr);
  }
}

// floating dust in the light beams
const DUST_COUNT = 130;
const dustGeo = new THREE.BufferGeometry();
const dustPos = new Float32Array(DUST_COUNT * 3);
for (let i = 0; i < DUST_COUNT; i++) {
  dustPos[i * 3] = (Math.random() - 0.5) * 26;
  dustPos[i * 3 + 1] = 0.4 + Math.random() * 9;
  dustPos[i * 3 + 2] = -18 + Math.random() * 24;
}
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
const dustMat = new THREE.PointsMaterial({
  color: 0xdcffd0, size: 0.035, transparent: true, opacity: 0.32,
  blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
});
const dust = new THREE.Points(dustGeo, dustMat);
scene.add(dust);

/* ------------------------------ hoop ------------------------------ */

const HOOP = new THREE.Vector3(0, 3.05, -12.5);
const boardZ = -12.9;

const hoopGroup = new THREE.Group();
scene.add(hoopGroup);

const board = new THREE.Mesh(
  new THREE.PlaneGeometry(1.8, 1.05),
  new THREE.MeshBasicMaterial({ map: makeBoardTexture(), transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })
);
board.position.set(0, 3.45, boardZ);
hoopGroup.add(board);

const boardGhost = new THREE.Mesh(
  new THREE.PlaneGeometry(1.82, 1.07),
  new THREE.MeshBasicMaterial({ color: 0x0e2521, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })
);
boardGhost.position.set(0, 3.45, boardZ - 0.02);
hoopGroup.add(boardGhost);

const rimMat = new THREE.MeshStandardMaterial({ color: 0xe8612f, emissive: 0xff4a18, emissiveIntensity: 0.7, roughness: 0.35, metalness: 0.6 });
const rim = new THREE.Mesh(new THREE.TorusGeometry(0.235, 0.019, 8, 30), rimMat);
rim.rotation.x = Math.PI / 2;
rim.position.copy(HOOP);
hoopGroup.add(rim);

// rim connector
const connector = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.34), rimMat);
connector.position.set(0, HOOP.y, boardZ + 0.16);
hoopGroup.add(connector);

// pole + arm
const poleMat = new THREE.MeshStandardMaterial({ color: 0x1a2522, roughness: 0.55, metalness: 0.55 });
const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 3.9, 10), poleMat);
pole.position.set(0, 1.95, -14.6);
pole.castShadow = false;
scene.add(pole);
const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.22, 1.4), poleMat);
base.position.set(0, 0.11, -14.6);
base.castShadow = false;
base.receiveShadow = true;
scene.add(base);
const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 1.85), poleMat);
arm.position.set(0, 3.9, -13.75);
arm.castShadow = false;
scene.add(arm);
const pad = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.1, 0.35), new THREE.MeshStandardMaterial({ color: 0x1c332c, roughness: 0.9 }));
pad.position.set(0, 0.78, -14.48);
scene.add(pad);

// net: line strands and rings
const netGroup = new THREE.Group();
netGroup.position.copy(HOOP);
hoopGroup.add(netGroup);
const netPositions = [];
const netRings = 4;
const strands = 12;
const topR = 0.225, botR = 0.14;
for (let s = 0; s < strands; s++) {
  const a0 = (s / strands) * Math.PI * 2;
  for (let r = 0; r < netRings; r++) {
    const t0 = r / netRings, t1 = (r + 1) / netRings;
    const r0 = topR + (botR - topR) * t0;
    const r1 = topR + (botR - topR) * t1;
    const y0 = -0.02 - t0 * 0.46;
    const y1 = -0.02 - t1 * 0.46;
    netPositions.push(
      Math.cos(a0) * r0, y0, Math.sin(a0) * r0,
      Math.cos(a0) * r1, y1, Math.sin(a0) * r1
    );
  }
}
for (let r = 1; r <= netRings; r++) {
  const t = r / (netRings + 1);
  const rad = topR + (botR - topR) * t;
  const y = -0.02 - t * 0.46;
  for (let s = 0; s < strands; s++) {
    const a0 = (s / strands) * Math.PI * 2;
    const a1 = ((s + 1) / strands) * Math.PI * 2;
    netPositions.push(
      Math.cos(a0) * rad, y, Math.sin(a0) * rad,
      Math.cos(a1) * rad, y, Math.sin(a1) * rad
    );
  }
}
const netGeo = new THREE.BufferGeometry();
netGeo.setAttribute('position', new THREE.Float32BufferAttribute(netPositions, 3));
const net = new THREE.LineSegments(netGeo, new THREE.LineBasicMaterial({ color: 0xf3f3e6, transparent: true, opacity: 0.72 }));
netGroup.add(net);
const netBaseY = netGroup.position.y;

const hoopGlow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: glowTex, color: 0xd8ff3e, transparent: true, opacity: 0.26,
  blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
}));
hoopGlow.position.set(0, 3.15, -12.4);
hoopGlow.scale.set(2.9, 2.9, 1);
scene.add(hoopGlow);

/* ------------------------------ ball ------------------------------ */

const ball = new THREE.Mesh(
  new THREE.SphereGeometry(0.122, 22, 16),
  new THREE.MeshStandardMaterial({ map: makeBallTexture(), roughness: 0.5, metalness: 0.03, envMapIntensity: 0.7 })
);
ball.castShadow = true;
ball.position.set(0.4, 0.9, 1.4);
scene.add(ball);


/* ================================================================== */
/*  3v3 ROSTER + CHARACTERS                                           */
/* ================================================================== */

const ROSTER = [
  { id: 'curry',    name: 'Stephen Curry',          short: 'CURRY',   pos: 'PG', rating: 96, shoot: 99, speed: 93, height: 1.88, number: '30', skin: 0x8a5a3d, trait: 'SHARPSHOOTER' },
  { id: 'lebron',   name: 'LeBron James',           short: 'JAMES',   pos: 'SF', rating: 97, shoot: 88, speed: 92, height: 2.06, number: '23', skin: 0x70452c, trait: 'ALL-AROUND' },
  { id: 'durant',   name: 'Kevin Durant',           short: 'DURANT',  pos: 'SF', rating: 95, shoot: 95, speed: 87, height: 2.11, number: '7',  skin: 0x5b3722, trait: 'SCORER' },
  { id: 'giannis',  name: 'Giannis Antetokounmpo',  short: 'GIANNIS', pos: 'PF', rating: 96, shoot: 78, speed: 94, height: 2.11, number: '34', skin: 0x5d3823, trait: 'FREAK' },
  { id: 'jokic',    name: 'Nikola Jokic',           short: 'JOKIC',   pos: 'C',  rating: 97, shoot: 89, speed: 74, height: 2.11, number: '15', skin: 0xd7b08b, trait: 'PLAYMAKER' },
  { id: 'luka',     name: 'Luka Doncic',            short: 'DONCIC',  pos: 'PG', rating: 96, shoot: 92, speed: 85, height: 2.01, number: '77', skin: 0xd8b08a, trait: 'SHOT CREATOR' },
  { id: 'tatum',    name: 'Jayson Tatum',           short: 'TATUM',   pos: 'SF', rating: 95, shoot: 91, speed: 88, height: 2.03, number: '0',  skin: 0x6d452d, trait: 'TWO-WAY' },
  { id: 'sga',      name: 'Shai Gilgeous-Alexander', short: 'SGA',    pos: 'PG', rating: 95, shoot: 89, speed: 93, height: 1.98, number: '2',  skin: 0x6b432c, trait: 'SLASHER' },
  { id: 'ant',      name: 'Anthony Edwards',        short: 'EDWARDS', pos: 'SG', rating: 94, shoot: 90, speed: 95, height: 1.93, number: '5',  skin: 0x5a3520, trait: 'ATHLETE' },
  { id: 'book',     name: 'Devin Booker',           short: 'BOOKER',  pos: 'SG', rating: 93, shoot: 92, speed: 89, height: 1.96, number: '1',  skin: 0xc69a72, trait: 'BUCKET' },
  { id: 'dame',     name: 'Damian Lillard',         short: 'LILLARD', pos: 'PG', rating: 92, shoot: 94, speed: 88, height: 1.88, number: '0',  skin: 0x69422b, trait: 'LOGO RANGE' },
  { id: 'wemby',    name: 'Victor Wembanyama',      short: 'WEMBY',   pos: 'C',  rating: 92, shoot: 86, speed: 82, height: 2.24, number: '1',  skin: 0x7b5137, trait: 'UNICORN' }
];
const STAR_BY_ID = Object.fromEntries(ROSTER.map(p => [p.id, p]));

const HOME_COLOR = 0xd8ff3e;
const HOME_ACCENT = 0x17240f;
const AWAY_COLOR = 0xd64b38;
const AWAY_ACCENT = 0x2a1512;

const numberCache = {};
function numberTex(n) {
  if (!numberCache[n]) numberCache[n] = makeNumberTexture(n);
  return numberCache[n];
}

function makeCharacter(jersey, accent, skin, number, height, isDef, team, star) {
  const root = new THREE.Group();
  const jerseyMat = new THREE.MeshStandardMaterial({ color: jersey, roughness: 0.55, metalness: 0.08 });
  const shortsMat = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.62, metalness: 0.05 });
  const skinMat = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.72 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: isDef ? 0x281b19 : 0x1b211c, roughness: 0.55 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.265, 0.4, 5, 12), jerseyMat);
  torso.position.y = 1.24; torso.scale.z = 0.78; torso.castShadow = true; root.add(torso);

  const shorts = new THREE.Mesh(new THREE.CylinderGeometry(0.275, 0.315, 0.38, 12), shortsMat);
  shorts.position.y = 0.9; shorts.scale.z = 0.84; shorts.castShadow = true; root.add(shorts);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.095, 0.1, 8), skinMat);
  neck.position.y = 1.56; root.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.185, 14, 12), skinMat);
  head.position.y = 1.75; head.scale.set(0.94, 1.03, 0.96); head.castShadow = true; root.add(head);

  // hair cap
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x171311, roughness: 0.95 });
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.191, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.52), hairMat);
  hair.position.y = 1.76; hair.scale.set(0.96, 1.0, 0.99); root.add(hair);

  // eyes / face markers so players read from the front
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x12100d });
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.019, 6, 5), eyeMat);
    eye.position.set(s * 0.065, 1.775, -0.168);
    root.add(eye);
  }

  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.193, 0.193, 0.055, 14), new THREE.MeshStandardMaterial({ color: accent, roughness: 0.6 }));
  band.position.y = 1.795; band.scale.z = 0.98; root.add(band);

  const numMat = new THREE.MeshBasicMaterial({ map: numberTex(number), transparent: true, toneMapped: false, side: THREE.DoubleSide });
  for (const z of [-0.311, 0.311]) {
    const num = new THREE.Mesh(new THREE.PlaneGeometry(0.23, 0.23), numMat);
    num.position.set(0, 1.28, z);
    if (z < 0) num.rotation.y = Math.PI;
    root.add(num);
  }

  // jersey side piping + shorts trim
  const trimMatA = new THREE.MeshStandardMaterial({ color: 0xf1efdf, roughness: 0.65 });
  for (const side of [-1, 1]) {
    const pipe = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.36, 0.025), trimMatA);
    pipe.position.set(side * 0.245, 1.25, -0.175);
    root.add(pipe);
    const shortPipe = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.26, 0.025), trimMatA);
    shortPipe.position.set(side * 0.285, 0.9, -0.16);
    root.add(shortPipe);
  }

  const arms = [];
  const sleeveSide = star && ['durant', 'lebron', 'giannis'].includes(star.id) ? 1 : 0;
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.36, 1.44, 0);
    shoulder.rotation.z = side * -0.1;
    const upper = limb(0.066, 0.34, skinMat);
    upper.position.y = -0.17; upper.castShadow = true; shoulder.add(upper);
    if (sleeveSide === side) {
      const sleeve = limb(0.073, 0.26, new THREE.MeshStandardMaterial({ color: isDef ? 0x2b1a17 : 0x1a211b, roughness: 0.62 }), 8);
      sleeve.position.y = -0.16; sleeve.castShadow = true; shoulder.add(sleeve);
    }
    const elbow = new THREE.Group();
    elbow.position.y = -0.33;
    const lower = limb(0.056, 0.3, skinMat);
    lower.position.y = -0.15; lower.castShadow = true; elbow.add(lower);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.061, 0.061, 0.055, 9), trimMatA);
    band.position.y = -0.24; elbow.add(band);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.072, 8, 6), skinMat);
    hand.position.y = -0.32; elbow.add(hand);
    shoulder.add(elbow);
    root.add(shoulder);
    arms.push({ shoulder, elbow });
  }

  const legs = [];
  for (const side of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.155, 0.83, 0);
    const thigh = limb(0.09, 0.36, skinMat);
    thigh.position.y = -0.18; thigh.castShadow = true; hip.add(thigh);
    const knee = new THREE.Group();
    knee.position.y = -0.35;
    const shin = limb(0.073, 0.34, skinMat);
    shin.position.y = -0.17; shin.castShadow = true; knee.add(shin);
    const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.074, 0.068, 0.16, 9), trimMatA);
    sock.position.set(0, -0.26, 0); sock.castShadow = true; knee.add(sock);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.155, 0.1, 0.275), shoeMat);
    shoe.position.set(0, -0.37, -0.045); shoe.castShadow = true; knee.add(shoe);
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 0.285), new THREE.MeshStandardMaterial({ color: isDef ? AWAY_COLOR : HOME_COLOR, roughness: 0.5, emissive: isDef ? 0x5a1a10 : 0x3a4a00, emissiveIntensity: 0.35 }));
    sole.position.set(0, -0.414, -0.045); knee.add(sole);
    hip.add(knee);
    root.add(hip);
    legs.push({ hip, knee });
  }

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.44, 0.53, 40),
    new THREE.MeshBasicMaterial({
      color: isDef ? 0xff6f55 : 0xd8ff3e,
      transparent: true, opacity: isDef ? 0.18 : 0.34,
      side: THREE.DoubleSide, depthWrite: false, toneMapped: false
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.012;
  root.add(ring);

  root.scale.setScalar(height / 1.95);
  return { root, arms, legs, torso, head, ring };
}

function limb(radius, length, mat, segs = 7) {
  const geo = new THREE.CapsuleGeometry(radius, Math.max(0.02, length - radius * 2), 4, segs);
  return new THREE.Mesh(geo, mat);
}

/* ================================================================== */
/*  ACTORS                                                            */
/* ================================================================== */

const homeTeam = { color: HOME_COLOR, accent: HOME_ACCENT, actors: [] };
const awayTeam = { color: AWAY_COLOR, accent: AWAY_ACCENT, actors: [] };
let actors = [];
let activeIndex = 0;
let homeStars = [];
let awayStars = [];
let teamsBuilt = false;

const tagsEl = document.getElementById('tags');

function makeActor(star, team, teamIndex) {
  const isAway = team === 'away';
  const rig = makeCharacter(
    isAway ? AWAY_COLOR : HOME_COLOR,
    isAway ? AWAY_ACCENT : HOME_ACCENT,
    star.skin, star.number, star.height, isAway, team, star
  );
  scene.add(rig.root);
  const el = document.createElement('div');
  el.className = `tag ${team}`;
  el.innerHTML = `${star.short}<small>${star.rating}</small>`;
  tagsEl.appendChild(el);
  return {
    star, team, teamIndex, rig, tag: el,
    x: 0, z: 1.2, vx: 0, vz: 0, phase: Math.random() * 6,
    radius: 0.45,
    speed: 3.05 + (star.speed - 70) * 0.022,
    spot: { x: 0, z: -5 },
    cutTimer: 0, cutCooldown: 2 + Math.random() * 3,
    receive: 0, screened: 0, screenHold: 0,
    moveTimer: 0, moveType: '', moveCooldown: 0,
    points: 0, shotFeedback: 0, facing: 0,
    anim: null, contestTimer: 0, contestCd: 0, fall: 0, dunking: 0
  };
}

function disposeTeam() {
  for (const a of actors) {
    scene.remove(a.rig.root);
    a.rig.root.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material && o.material.map) { /* keep shared textures */ }
    });
    a.tag.remove();
  }
  actors = [];
  homeTeam.actors = [];
  awayTeam.actors = [];
  tagsEl.innerHTML = '';
  teamsBuilt = false;
}

const HOME_SPOTS = [
  { x: -5.6, z: -7.9 },
  { x: 5.6, z: -7.9 },
  { x: -6.3, z: -12.0 },
  { x: 6.3, z: -12.0 },
  { x: 0, z: -5.6 }
];

function buildTeams(home, away) {
  disposeTeam();
  homeStars = home;
  awayStars = away;
  for (let i = 0; i < 3; i++) {
    const h = makeActor(home[i], 'home', i);
    const a = makeActor(away[i], 'away', i);
    homeTeam.actors.push(h);
    awayTeam.actors.push(a);
    actors.push(h, a);
  }
  teamsBuilt = true;
  resetFormation(true);
}

function resetFormation(initial = false) {
  const home = homeTeam.actors, away = awayTeam.actors;
  if (!home.length) return;
  const active = home[activeIndex] || home[0];
  active.x = 0; active.z = -3.5; active.vx = active.vz = 0;
  const mates = home.filter(a => a !== active);
  mates[0].x = -5.4; mates[0].z = -7.6; mates[0].vx = mates[0].vz = 0;
  if (mates[1]) { mates[1].x = 5.4; mates[1].z = -7.6; mates[1].vx = mates[1].vz = 0; }
  home.forEach((a, i) => { a.cutTimer = 0; a.receive = 0; a.screened = 0; a.screenHold = 0; a.spot = { x: i === 1 ? -5.4 : i === 2 ? 5.4 : 0, z: i === 0 ? -6.0 : -7.6 }; });
  away[0].x = 0; away[0].z = -5.0;
  away[1].x = -5.0; away[1].z = -6.5;
  away[2].x = 5.0; away[2].z = -6.5;
  for (const a of away) { a.vx = a.vz = 0; a.screened = 0; a.screenHold = 0; a.receive = 0; }
  state.screen = null;
  state.pass = null;
  state.shot = null;
  state.rebound = null;
  state.pressure = 0;
  state.charging = false;
  state.charge = 0;
  state.chargeDir = 1;
  state.shootAnim = 0;
  ballVel.set(0, 0, 0);
  updateBallAnchor(true);
  if (initial) { state.shotClock = 24; }
}

function updateBallAnchor(instant = false) {
  const a = homeTeam.actors[activeIndex] || homeTeam.actors[0];
  if (!a) return;
  if (state.mode === 'menu' || instant) {
    ball.position.set(a.x + 0.4, 0.7, a.z + 0.1);
  }
}

/* ================================================================== */
/*  UI + STATE                                                        */
/* ================================================================== */

const ui = {
  score: document.getElementById('score'),
  opp: document.getElementById('oppscore'),
  time: document.getElementById('time'),
  fg: document.getElementById('fg'),
  streak: document.getElementById('streak'),
  onball: document.getElementById('onball'),
  onballLabel: document.getElementById('onball-label'),
  phaseLabel: document.getElementById('phase-label'),
  tips: document.getElementById('tips'),
  mobileTip: document.getElementById('mobile-tip'),
  driveHint: document.getElementById('drive-hint'),
  flash: document.getElementById('flash'),
  controlArrow: document.getElementById('control-arrow'),
  smCaption: document.getElementById('sm-caption'),
  shot: document.getElementById('shot-time'),
  shotclock: document.getElementById('shotclock'),
  overlay: document.getElementById('overlay'),
  title: document.getElementById('title'),
  eyebrow: document.getElementById('eyebrow'),
  deck: document.getElementById('deck'),
  result: document.getElementById('result'),
  play: document.getElementById('play'),
  change: document.getElementById('change'),
  pause: document.getElementById('pause'),
  toast: document.getElementById('toast'),
  sideMeter: document.getElementById('side-meter'),
  smQuality: document.getElementById('sm-quality'),
  smWindow: document.getElementById('sm-window'),
  smFill: document.getElementById('sm-fill'),
  smLabel: document.getElementById('sm-label'),
  feedback: document.getElementById('shot-feedback'),
  select: document.getElementById('select'),
  selectTitle: document.getElementById('select-title'),
  selectSub: document.getElementById('select-sub'),
  selectGrid: document.getElementById('roster-grid'),
  lineupBar: document.getElementById('lineup-bar'),
  selectNext: document.getElementById('select-next'),
  selectBack: document.getElementById('select-back'),
  selectHint: document.getElementById('select-hint'),
  step1: document.getElementById('step1'),
  step2: document.getElementById('step2')
};

const state = {
  mode: 'menu',
  score: 0, opp: 0, makes: 0, attempts: 0, streak: 0,
  gameTime: 90, shotClock: 24,
  charge: 0, charging: false, chargeDir: 1,
  shootAnim: 0, pressure: 0, pressureWarned: false,
  netPulse: 0, crowdPulse: 0, cameraShake: 0, rimFlash: 0,
  toastTimer: 0,
  shot: null, pass: null, screen: null, rebound: null,
  stepbackTimer: 0,
  shotFeedback: { text: '', sub: '', bad: false, timer: 0, x: 0, y: 0 },
  activeIndex: 0,
  phase: 'offense',
  defenderIndex: 0,
  shotType: 'jumper',
  dunk: null,
  away: null,
  awayPass: null,
  awayWindup: null,
  stealCooldown: 0,
  switchCooldown: 0,
  passCooldown: 0,
  blockAttempt: null,
  elapsed: 0,
  camFov: 55
};

const ballVel = new THREE.Vector3();
const clock = new THREE.Clock();
let audioCtx = null;

function beep(freq = 520, dur = 0.08, type = 'sine', vol = 0.035) {
  try {
    audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = vol;
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch (e) { /* audio optional */ }
}

function controlledActor() {
  if (!homeTeam.actors.length) return null;
  return state.phase === 'defense'
    ? (homeTeam.actors[state.defenderIndex] || homeTeam.actors[0])
    : (homeTeam.actors[activeIndex] || homeTeam.actors[0]);
}

function activeActor() {
  return controlledActor();
}

function setAnim(a, type, dur) {
  if (!a) return;
  a.anim = { type, t: 0, dur };
}

function updown(p) {
  return Math.max(0, Math.min(1, p));
}

function distToHoop(a = activeActor()) {
  return a ? Math.hypot(a.x - HOOP.x, a.z - HOOP.z) : 0;
}

function nearestDefender(actor = activeActor()) {
  let best = null, bd = Infinity;
  for (const d of awayTeam.actors) {
    const dist = Math.hypot(actor.x - d.x, actor.z - d.z);
    if (dist < bd) { bd = dist; best = d; }
  }
  return { defender: best, dist: bd };
}

function contestAmount(actor = activeActor()) {
  const { defender, dist } = nearestDefender(actor);
  if (!defender) return 0;
  let c = Math.max(0, Math.min(1, 1 - (dist - 0.6) / 1.6));
  const hx = HOOP.x - actor.x, hz = HOOP.z - actor.z;
  const dx = defender.x - actor.x, dz = defender.z - actor.z;
  const hl = Math.hypot(hx, hz) || 1, dl = Math.hypot(dx, dz) || 1;
  const alignment = (hx * dx + hz * dz) / (hl * dl);
  c *= Math.max(0, Math.min(1, (alignment + 0.3) / 1.1));
  if (defender.screened > 0 || defender.screenHold > 0) c *= 0.35;
  if (state.stepbackTimer > 0) c *= 0.5;
  return c;
}

function formatTime(n) {
  n = Math.max(0, Math.ceil(n));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
}

function rangeLabel(d) {
  if (d > 8.6) return 'DEEP THREE';
  if (d > 6.75) return 'THREE';
  if (d > 4.2) return 'MIDRANGE';
  return 'PAINT';
}

function updateUI() {
  ui.score.textContent = String(state.score).padStart(2, '0');
  ui.opp.textContent = String(state.opp).padStart(2, '0');
  ui.time.textContent = formatTime(state.gameTime);
  ui.fg.textContent = `${state.makes} / ${state.attempts}`;
  ui.streak.textContent = state.streak ? `${state.streak}×` : '—';
  ui.shot.textContent = Math.max(0, Math.ceil(state.shotClock));
  ui.shotclock.classList.toggle('hot', state.shotClock <= 5);
  const a = activeActor();
  const defending = state.phase === 'defense';
  ui.onballLabel.textContent = defending ? 'ON D' : 'ON BALL';
  ui.onball.textContent = a ? a.star.short : '—';
  ui.onball.style.color = defending ? '#ff9a85' : '#d8ff3e';
  ui.phaseLabel.textContent = defending ? 'DEFEND' : 'YOUR BALL';
  gameEl.classList.toggle('defense', defending);
}

function setPhaseUI() {
  const defending = state.phase === 'defense';
  if (defending) {
    ui.tips.innerHTML = '<b>W A S D</b> stay in front &nbsp;·&nbsp; <b>SPACE</b> contest / block &nbsp;·&nbsp; <b>E</b> switch<br><b>Q</b> steal &nbsp;·&nbsp; <b>C</b> body up &nbsp;·&nbsp; <b>SHIFT</b> sprint &nbsp;·&nbsp; stay between ball and rim';
    ui.mobileTip.innerHTML = 'STICK STAY IN FRONT<br>CONTEST · SWITCH · STEAL · BODY';
    document.getElementById('shoot-touch').textContent = 'CONTEST';
    document.getElementById('t-pass').textContent = 'SWITCH';
    document.getElementById('t-screen').textContent = 'STEAL';
    document.getElementById('t-cross').textContent = 'BODY';
    document.getElementById('t-step').textContent = 'BUMP';
  } else {
    ui.tips.innerHTML = '<b>W A S D</b> move &nbsp;·&nbsp; <b>SPACE</b> hold / release to shoot &nbsp;·&nbsp; <b>E</b> pass<br><b>Q</b> ask for screen &nbsp;·&nbsp; <b>C</b> crossover &nbsp;·&nbsp; <b>X</b> step back &nbsp;·&nbsp; <b>V</b> jab step &nbsp;·&nbsp; <b>SHIFT</b> sprint';
    ui.mobileTip.innerHTML = 'STICK MOVE · HOLD SHOOT · RELEASE GREEN<br>PASS · SCREEN · CROSS · STEP';
    document.getElementById('shoot-touch').textContent = 'SHOOT';
    document.getElementById('t-pass').textContent = 'PASS';
    document.getElementById('t-screen').textContent = 'SCREEN';
    document.getElementById('t-cross').textContent = 'CROSS';
    document.getElementById('t-step').textContent = 'STEP';
  }
  updateUI();
}

function showToast(text, bad = false, sub = '') {
  ui.toast.innerHTML = sub ? `${text}<small>${sub}</small>` : text;
  ui.toast.classList.toggle('bad', bad);
  ui.toast.classList.add('show');
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => ui.toast.classList.remove('show'), 1150);
}

function popScore(el) {
  el.classList.add('pop');
  setTimeout(() => el.classList.remove('pop'), 220);
}


/* ================================================================== */
/*  POSSESSION FLOW · DEFENSE                                         */
/* ================================================================== */

const OFFENSE_TIPS = '<b>W A S D</b> move &nbsp;·&nbsp; <b>SPACE</b> hold / release to shoot &nbsp;·&nbsp; <b>E</b> pass<br><b>Q</b> ask for screen &nbsp;·&nbsp; <b>C</b> crossover &nbsp;·&nbsp; <b>X</b> step back &nbsp;·&nbsp; <b>V</b> jab step &nbsp;·&nbsp; <b>SHIFT</b> sprint';
const DEFENSE_TIPS = '<b>W A S D</b> stay in front &nbsp;·&nbsp; <b>SPACE</b> contest / block &nbsp;·&nbsp; <b>E</b> switch<br><b>Q</b> steal &nbsp;·&nbsp; <b>C</b> body up &nbsp;·&nbsp; <b>SHIFT</b> sprint &nbsp;·&nbsp; stay between ball and rim';

function clearLiveBall() {
  state.charging = false;
  state.charge = 0;
  state.chargeDir = 1;
  state.shot = null;
  state.pass = null;
  state.rebound = null;
  state.screen = null;
  state.dunk = null;
  state.awayPass = null;
  state.awayWindup = null;
  state.away = null;
  state.blockAttempt = null;
  state.shotType = 'jumper';
  state.shootAnim = 0;
  hideSideMeter();
  ui.driveHint.classList.remove('show');
}

function resetDefenseFormation(handler) {
  const home = homeTeam.actors, away = awayTeam.actors;
  if (!home.length || !away.length) return;
  const others = away.filter(a => a !== handler);
  handler.x = 0; handler.z = -4.5; handler.vx = handler.vz = 0;
  if (others[0]) { others[0].x = -5.35; others[0].z = -8.4; others[0].vx = others[0].vz = 0; }
  if (others[1]) { others[1].x = 5.35; others[1].z = -8.4; others[1].vx = others[1].vz = 0; }
  home[0].x = handler.x + 1.05; home[0].z = -6.25; home[0].vx = home[0].vz = 0;
  home[1].x = -5.15; home[1].z = -9.15; home[1].vx = home[1].vz = 0;
  home[2].x = 5.15; home[2].z = -9.15; home[2].vx = home[2].vz = 0;
  for (const a of away) { a.anim = null; a.receive = 0; a.screened = 0; a.screenHold = 0; a.stun = 0; }
  for (const a of home) { a.anim = null; a.contestTimer = 0; a.contestCd = 0; a.stun = 0; }
  ball.position.set(handler.x + 0.2, 0.9, handler.z + 0.1);
  ballVel.set(0, 0, 0);
}

function beginAwayPossession(rebounder = null, reason = 'DEFEND') {
  if (state.mode !== 'playing' || !teamsBuilt) return;
  const handler = (rebounder && rebounder.team === 'away' ? rebounder : awayTeam.actors[0]);
  if (!handler) return;
  clearLiveBall();
  state.phase = 'defense';
  state.defenderIndex = 0;
  state.shotClock = 14;
  state.pressure = 0;
  state.pressureWarned = false;
  state.stepbackTimer = 0;
  resetDefenseFormation(handler);
  state.away = {
    handler,
    t: 0,
    attackT: 2.6 + Math.random() * 2.2,
    passT: 1.2 + Math.random() * 1.1,
    passed: false,
    shotPending: false
  };
  setPhaseUI();
  showToast(reason, false, 'RIVALS BALL · STAY IN FRONT');
  beep(150, 0.1, 'square', 0.02);
  updateUI();
}

function beginHomePossession(actor = null, from = '') {
  if (state.mode !== 'playing' || !teamsBuilt) return;
  state.phase = 'offense';
  clearLiveBall();
  if (actor) {
    const idx = homeTeam.actors.indexOf(actor);
    if (idx >= 0) activeIndex = idx;
  }
  resetFormation(false);
  state.shotClock = 24;
  state.stealCooldown = 0;
  setPhaseUI();
  if (from === 'steal') showToast('STEAL · YOUR BALL', false, 'TAKE IT THE OTHER WAY');
  else if (from === 'block') showToast('BLOCKED · YOUR BALL', false, 'PUSH IT');
  else if (from === 'rebound') showToast('BOARD · YOUR BALL', false, 'PUSH IT');
  else if (from === 'stop') showToast('STOPPED!', false, 'YOUR BALL');
  updateUI();
}

function switchDefender() {
  if (state.mode !== 'playing' || state.phase !== 'defense' || state.switchCooldown > 0) return;
  state.defenderIndex = (state.defenderIndex + 1) % homeTeam.actors.length;
  state.switchCooldown = 0.35;
  const a = controlledActor();
  if (a) setAnim(a, 'contest', 0.18);
  showToast(`SWITCH · ${a ? a.star.short : ''}`, false, 'STAY IN FRONT');
  beep(430, 0.05, 'triangle', 0.015);
  updateUI();
}

function defensiveContest(actor) {
  let best = 0;
  for (const d of homeTeam.actors) {
    const dist = Math.hypot(d.x - actor.x, d.z - actor.z);
    let c = Math.max(0, Math.min(1, 1 - (dist - 0.6) / 1.9));
    const hx = HOOP.x - actor.x, hz = HOOP.z - actor.z;
    const dx = d.x - actor.x, dz = d.z - actor.z;
    const hl = Math.hypot(hx, hz) || 1, dl = Math.hypot(dx, dz) || 1;
    const align = (hx * dx + hz * dz) / (hl * dl);
    c *= Math.max(0, Math.min(1, (align + 0.35) / 1.1));
    if (d.contestTimer > 0) c = Math.min(1, c + 0.3);
    best = Math.max(best, c);
  }
  return best;
}

function contestBlock() {
  if (state.mode !== 'playing' || state.phase !== 'defense') return;
  const d = controlledActor();
  if (!d || d.contestCd > 0) return;
  d.contestCd = 0.9;
  d.contestTimer = 0.6;
  setAnim(d, 'contest', 0.6);
  state.blockAttempt = { defender: d, t: 0, dur: 0.62, rolled: false };
  state.cameraShake = Math.max(state.cameraShake, 0.035);
  beep(480, 0.06, 'triangle', 0.012);
}

function tryBlock(w) {
  const ba = state.blockAttempt;
  if (!ba || !w || w.blocked || ba.rolled) return;
  if (w.t < w.dur * 0.1 || w.t > w.dur * 0.94) return;
  ba.rolled = true;
  const d = ba.defender;
  const dist = Math.hypot(d.x - w.actor.x, d.z - w.actor.z);
  if (dist > 1.85) return;
  const chance = Math.min(0.86, 0.5 + (d.star.rating - 82) * 0.007 + (d.contestTimer > 0 ? 0.05 : 0));
  if (Math.random() < chance) {
    w.blocked = true;
    w.blockT = 0;
    state.blockAttempt = null;
    setAnim(w.actor, 'blocked', 0.55);
    showToast('REJECTED!', false, `BLOCKED BY ${d.star.short}`);
    state.crowdPulse = 1;
    state.cameraShake = 0.16;
    state.rimFlash = 0.5;
    burst(new THREE.Vector3(d.x, 2.2, d.z), 0xf4ffe6, 1.35);
    beep(120, 0.18, 'square', 0.04);
  }
}

function stealAttempt() {
  if (state.mode !== 'playing' || state.phase !== 'defense' || state.stealCooldown > 0) return;
  const d = controlledActor();
  const h = state.away && state.away.handler;
  if (!d || !h) return;
  state.stealCooldown = 1.7;
  setAnim(d, 'steal', 0.4);
  const dist = Math.hypot(d.x - h.x, d.z - h.z);
  const chance = dist < 1.15 ? 0.46 : dist < 1.6 ? 0.2 : 0;
  if (Math.random() < chance) {
    state.cameraShake = 0.09;
    state.crowdPulse = 0.8;
    burst(new THREE.Vector3(h.x, 1.1, h.z), 0xf4ffe6, 0.8);
    beep(700, 0.09, 'sine', 0.03);
    beginHomePossession(d, 'steal');
  } else {
    showToast('REACH', true, 'STAY DOWN · MOVE YOUR FEET');
    beep(180, 0.08, 'square', 0.015);
  }
}

function bodyCheck() {
  if (state.mode !== 'playing' || state.phase !== 'defense') return;
  const d = controlledActor();
  const h = state.away && state.away.handler;
  if (!d || !h) return;
  if (d.contestCd > 0) return;
  d.contestCd = 0.8;
  setAnim(d, 'body', 0.4);
  const dist = Math.hypot(d.x - h.x, d.z - h.z);
  if (dist < 1.5) {
    const dx = h.x - d.x, dz = h.z - d.z, len = Math.hypot(dx, dz) || 1;
    h.vx += (dx / len) * 2.6;
    h.vz += (dz / len) * 2.6;
    h.stun = Math.max(h.stun || 0, 0.35);
    state.cameraShake = Math.max(state.cameraShake, 0.04);
    showToast('BODY UP', false, 'MAKE HIM FEEL YOU');
    beep(240, 0.07, 'triangle', 0.02);
  } else {
    showToast('TOO FAR', true, 'CLOSE THE GAP');
  }
}

function awayPassToOpen(from) {
  const mates = awayTeam.actors.filter(x => x !== from);
  if (!mates.length) return false;
  let target = null, best = -Infinity;
  for (const m of mates) {
    let open = 12;
    for (const d of homeTeam.actors) open = Math.min(open, Math.hypot(m.x - d.x, m.z - d.z));
    const score = open - Math.hypot(m.x - from.x, m.z - from.z) * 0.06;
    if (score > best) { best = score; target = m; }
  }
  if (!target) return false;
  setAnim(from, 'pass', 0.36);
  setAnim(target, 'receive', 0.3);
  state.awayPass = {
    from, to: target, t: 0,
    dur: Math.max(0.22, Math.hypot(target.x - from.x, target.z - from.z) / 14),
    start: ball.position.clone()
  };
  beep(500, 0.05, 'sine', 0.015);
  return true;
}

function resolveAwayPass(dt) {
  const p = state.awayPass;
  if (!p) return;
  p.t += dt;
  const target = p.to;
  const t = Math.min(1, p.t / p.dur);
  ball.position.set(
    p.start.x + (target.x - p.start.x) * t,
    1.32 + Math.sin(t * Math.PI) * 0.34,
    p.start.z + (target.z - p.start.z) * t
  );
  ball.rotation.x -= dt * 12;
  if (t < 1) return;
  state.awayPass = null;
  let intercepted = null;
  for (const d of homeTeam.actors) {
    if (Math.hypot(d.x - target.x, d.z - target.z) < 0.92 && Math.random() < 0.18) { intercepted = d; break; }
  }
  if (intercepted) {
    showToast('INTERCEPTED!', false, `${intercepted.star.short} JUMPED THE LANE`);
    beep(740, 0.1, 'sine', 0.03);
    beginHomePossession(intercepted, 'steal');
    return;
  }
  if (state.away) {
    state.away.handler = target;
    state.away.t = Math.max(0, state.away.t - 1.1);
    state.away.passT = 1.4;
    target.receive = 0.3;
  }
}

function awayShotChance(actor, contest) {
  const d = distToHoop(actor);
  const base = 0.47 + (actor.star.shoot - 78) * 0.011;
  return Math.max(0.14, Math.min(0.84,
    base - contest * 0.36 - Math.max(0, d - 6.75) * 0.032 - (d > 8.5 ? 0.08 : 0)
  ));
}

function beginAwayShot(actor) {
  if (!state.away || state.awayWindup) return;
  const d = distToHoop(actor);
  const contest = defensiveContest(actor);
  const worth = d > 6.75 ? 3 : 2;
  state.awayWindup = {
    actor, t: 0, dur: d < 3.2 ? 0.52 : 0.44,
    made: false, worth, dist: d, contest,
    range: d < 2.4 ? 'AT THE RIM' : rangeLabel(d), blocked: false, blockT: 0
  };
  state.away.attackT = 999;
  setAnim(actor, 'shoot', 0.68);
  for (const h of homeTeam.actors) {
    if (h !== controlledActor() && Math.hypot(h.x - actor.x, h.z - actor.z) < 2.0) setAnim(h, 'contest', 0.5);
  }
  beep(230, 0.06, 'triangle', 0.015);
}

function updateAwayWindup(dt) {
  const w = state.awayWindup;
  if (!w) return;
  w.t += dt;
  const a = w.actor;
  tryBlock(w);
  if (w.blocked) {
    w.blockT += dt;
    if (w.blockT > 0.24) {
      const pos = new THREE.Vector3(a.x, 1.9, a.z);
      state.awayWindup = null;
      state.away = null;
      startLooseBall(pos, 'away', 'block');
    }
    return;
  }
  if (w.t >= w.dur) {
    w.contest = Math.max(w.contest, defensiveContest(a));
    w.made = Math.random() < awayShotChance(a, w.contest);
    state.awayWindup = null;
    state.away = null;
    const start = new THREE.Vector3(a.x + 0.12, 2.15, a.z - 0.1);
    const end = HOOP.clone();
    if (w.made) {
      end.x += (Math.random() - 0.5) * 0.05;
      end.z += (Math.random() - 0.5) * 0.05;
    } else {
      const side = Math.random() < 0.5 ? -1 : 1;
      end.x += side * (0.32 + Math.random() * 0.28);
      end.z += 0.16 + Math.random() * 0.22;
      end.y += (Math.random() - 0.5) * 0.12;
    }
    state.shot = {
      phase: 'flight', team: 'away', t: 0,
      dur: 0.7 + Math.min(w.dist, 9) * 0.034,
      start, end, arc: 0.82 + w.dist * 0.07,
      made: w.made, worth: w.worth, green: false,
      actor: a, contest: w.contest, range: w.range
    };
    state.shotClock = 14;
    setAnim(a, 'shoot', 0.68);
    beep(w.made ? 300 : 200, 0.05, 'triangle', 0.012);
    updateUI();
  }
}

function showOverlay() { ui.overlay.classList.remove('hidden'); }
function hideOverlay() { ui.overlay.classList.add('hidden'); }

function openSelect() {
  state.mode = 'select';
  gameEl.classList.remove('active');
  hideOverlay();
  ui.select.classList.remove('hidden');
  selectStep = 0;
  pickHome = [];
  pickAway = [];
  renderSelect();
}

function closeSelect() {
  ui.select.classList.add('hidden');
  state.mode = 'menu';
  gameEl.classList.remove('active');
  showOverlay();
}

/* ================================================================== */
/*  ROSTER SELECT UI                                                  */
/* ================================================================== */

let selectStep = 0;
let pickHome = [];
let pickAway = [];

function feet(cm) {
  const inches = Math.round(cm / 2.54);
  return `${Math.floor(inches / 12)}'${inches % 12}"`;
}

function slotMarkup(star, i, side) {
  if (!star) return `<div class="slot ${side}"><span>SLOT 0${i + 1}</span><b>${side === 'rival' ? 'AWAITING RIVAL' : 'PICK A STAR'}</b></div>`;
  return `<div class="slot filled ${side}"><span>${side === 'rival' ? 'RIVAL' : 'YOUR SQUAD'} 0${i + 1}</span><b>${star.short} · ${star.pos}</b></div>`;
}

function renderSelect() {
  const picked = selectStep === 0 ? pickHome : pickAway;
  const other = selectStep === 0 ? pickAway : pickHome;
  ui.selectTitle.innerHTML = selectStep === 0 ? 'BUILD YOUR <span>THREE.</span>' : 'PICK THE <span>RIVALS.</span>';
  ui.selectSub.textContent = selectStep === 0
    ? 'Pick three superstars to run with. Ratings change your speed, range, and green window.'
    : 'Choose three rivals from the remaining stars. Your squad is locked in.';
  ui.step1.className = selectStep === 0 ? 'on' : 'done';
  ui.step2.className = selectStep === 1 ? 'on' : '';
  ui.lineupBar.innerHTML = [0, 1, 2].map(i => slotMarkup(STAR_BY_ID[picked[i]], i, selectStep === 0 ? '' : 'rival')).join('');
  ui.selectNext.innerHTML = selectStep === 0
    ? 'NEXT: PICK RIVALS <span class="arrow">↗</span>'
    : 'TIP OFF <span class="arrow">↗</span>';
  ui.selectNext.disabled = picked.length !== 3;
  ui.selectHint.textContent = selectStep === 0
    ? (picked.length === 3 ? 'Tap a selected star to swap them out, or tap another star to replace your first pick.' : `Pick ${3 - picked.length} more superstar${3 - picked.length === 1 ? '' : 's'} for your squad.`)
    : (picked.length === 3 ? 'Rival squad locked. Hit tip off and own the court.' : `Pick ${3 - picked.length} more rival${3 - picked.length === 1 ? '' : 's'}.`);

  ui.selectGrid.innerHTML = '';
  for (const star of ROSTER) {
    const inHome = pickHome.includes(star.id);
    const inAway = pickAway.includes(star.id);
    const lockedHome = selectStep === 1 && inHome;
    const cls = ['star-card'];
    if (inHome) cls.push('picked');
    if (inAway) cls.push('rival');
    if (lockedHome) cls.push('locked');
    if (other.includes(star.id) && selectStep === 0) cls.push('locked');
    const card = document.createElement('button');
    card.className = cls.join(' ');
    card.dataset.id = star.id;
    card.innerHTML = `
      <span class="snum">${star.number}</span>
      <span class="srating">${star.rating}<small>OVR</small></span>
      <strong>${star.name}</strong>
      <span class="meta">${star.pos} · ${feet(star.height * 100)} · ${star.shoot} 3PT</span>
      <span class="trait">${star.trait}</span>`;
    card.addEventListener('click', () => selectCard(star.id));
    ui.selectGrid.appendChild(card);
  }
}

function selectCard(id) {
  const picked = selectStep === 0 ? pickHome : pickAway;
  const idx = picked.indexOf(id);
  if (idx >= 0) {
    picked.splice(idx, 1);
  } else {
    if (selectStep === 1 && pickHome.includes(id)) return;
    if (picked.length >= 3) picked.shift();
    picked.push(id);
  }
  beep(idx >= 0 ? 300 : 560, 0.05, 'triangle', 0.015);
  renderSelect();
}

ui.selectNext.addEventListener('click', () => {
  if (selectStep === 0 && pickHome.length === 3) {
    selectStep = 1;
    renderSelect();
    beep(620, 0.08, 'sine', 0.02);
  } else if (selectStep === 1 && pickAway.length === 3) {
    const home = pickHome.map(id => STAR_BY_ID[id]);
    const away = pickAway.map(id => STAR_BY_ID[id]);
    ui.select.classList.add('hidden');
    startGame(home, away);
  }
});
ui.selectBack.addEventListener('click', () => {
  if (selectStep === 1) { selectStep = 0; renderSelect(); }
  else closeSelect();
});

/* ================================================================== */
/*  GAME FLOW                                                         */
/* ================================================================== */

let selectFrom = 'menu';

const DEFAULT_HOME = ['curry', 'lebron', 'giannis'].map(id => STAR_BY_ID[id]);
const DEFAULT_AWAY = ['durant', 'jokic', 'luka'].map(id => STAR_BY_ID[id]);

function startGame(home, away) {
  if (home && away) buildTeams(home, away);
  else if (!teamsBuilt) { openSelect(); return; }
  state.mode = 'playing';
  state.phase = 'offense';
  state.defenderIndex = 0;
  state.score = 0; state.opp = 0; state.makes = 0; state.attempts = 0; state.streak = 0;
  state.gameTime = 90; state.shotClock = 24;
  state.charge = 0; state.charging = false; state.chargeDir = 1;
  state.shootAnim = 0; state.pressure = 0; state.pressureWarned = false;
  state.cameraShake = 0; state.netPulse = 0; state.crowdPulse = 0;
  state.stepbackTimer = 0; state.screenCooldown = 0; state.shotFeedback.timer = 0;
  state.elapsed = 0; state.camFov = 55;
  state.dunk = null; state.away = null; state.awayPass = null; state.awayWindup = null;
  state.stealCooldown = 0; state.switchCooldown = 0; state.passCooldown = 0;
  state.blockAttempt = null;
  state.shotType = 'jumper';
  activeIndex = 0;
  for (const a of actors) { a.points = 0; a.anim = null; a.contestTimer = 0; a.contestCd = 0; a.stun = 0; a.dunking = 0; }
  resetFormation(true);
  hideOverlay();
  ui.select.classList.add('hidden');
  gameEl.classList.add('active');
  ui.pause.textContent = 'Ⅱ  PAUSE';
  ui.change.classList.add('hidden');
  ui.feedback.classList.remove('show');
  ui.flash.classList.remove('on');
  setPhaseUI();
  updateUI();
}

function endGame() {
  state.mode = 'ended';
  state.charging = false;
  gameEl.classList.remove('active');
  gameEl.classList.remove('defense');
  hideSideMeter();
  ui.driveHint.classList.remove('show');
  ui.flash.classList.remove('on');
  const best = Math.max(state.score, Number(localStorage.getItem('courtside-3v3-best') || 0));
  localStorage.setItem('courtside-3v3-best', best);
  const won = state.score > state.opp;
  const scorers = homeTeam.actors.map(a => `${a.star.short} ${a.points}`).join('  ·  ');
  ui.eyebrow.textContent = won ? 'RUN COMPLETE · W' : 'RUN COMPLETE · FINAL';
  ui.title.innerHTML = won ? 'THAT\'S A<span>W.</span>' : 'RUN IT<span>BACK.</span>';
  ui.deck.textContent = `Final: ${state.score}–${state.opp}. ${state.makes} of ${state.attempts} shots fell${state.attempts ? ` (${Math.round(state.makes / state.attempts * 100)}% FG)` : ''}.`;
  ui.result.innerHTML = `${scorers}<br><span style="color:#7f9487">BEST SCORE ${best} · ${won ? 'YOU OWNED THE COURT.' : 'THE COURT IS STILL YOURS TO TAKE.'}</span>`;
  ui.play.innerHTML = 'REMATCH <span class="arrow">↗</span>';
  ui.change.classList.remove('hidden');
  showOverlay();
}

function pauseGame() {
  if (state.mode === 'playing') {
    state.mode = 'paused';
    state.charging = false;
    hideSideMeter();
    ui.driveHint.classList.remove('show');
    gameEl.classList.remove('active');
    if (state.screen) endScreen(false);
    ui.eyebrow.textContent = 'TIMEOUT · TAKE A BREATH';
    ui.title.innerHTML = 'CATCH<span>YOUR BREATH.</span>';
    ui.deck.textContent = 'The run is paused. Your squad, the score, and the shot clock are waiting.';
    ui.result.textContent = `${state.score}–${state.opp}  ·  ${formatTime(state.gameTime)} REMAINING  ·  ${homeTeam.actors.map(a => `${a.star.short} ${a.points}`).join(' · ')}`;
    ui.play.innerHTML = 'RESUME RUN <span class="arrow">↗</span>';
    ui.change.classList.add('hidden');
    showOverlay();
  } else if (state.mode === 'paused') {
    state.mode = 'playing';
    hideOverlay();
    gameEl.classList.add('active');
    ui.pause.textContent = 'Ⅱ  PAUSE';
  }
}

function rematch() {
  if (homeStars.length === 3 && awayStars.length === 3) startGame(homeStars, awayStars);
  else openSelect();
}

ui.play.addEventListener('click', () => {
  if (state.mode === 'paused') pauseGame();
  else if (state.mode === 'ended') rematch();
  else openSelect();
});
ui.pause.addEventListener('click', pauseGame);
ui.change.addEventListener('click', () => {
  selectFrom = 'ended';
  openSelect();
});

/* ================================================================== */
/*  INPUT                                                             */
/* ================================================================== */

const keys = { up: false, down: false, left: false, right: false, sprint: false };
const touch = { x: 0, y: 0 };

function primaryDown() {
  if (state.mode !== 'playing') return;
  if (state.phase === 'defense') contestBlock();
  else beginShot();
}
function primaryUp() {
  if (state.charging) releaseShot();
}

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
  if (k === 'escape' || k === 'p') { pauseGame(); return; }
  if (['w', 'arrowup'].includes(k)) keys.up = true;
  if (['s', 'arrowdown'].includes(k)) keys.down = true;
  if (['a', 'arrowleft'].includes(k)) keys.left = true;
  if (['d', 'arrowright'].includes(k)) keys.right = true;
  if (k === 'shift') keys.sprint = true;
  if (e.repeat) return;
  if (k === ' ') primaryDown();
  else if (k === 'enter' && state.mode !== 'playing') ui.play.click();
  else if (k === 'e') { if (state.phase === 'defense') switchDefender(); else passBall(); }
  else if (k === 'q') { if (state.phase === 'defense') stealAttempt(); else callScreen(); }
  else if (k === 'c') { if (state.phase === 'defense') bodyCheck(); else crossover(); }
  else if (k === 'x') { if (state.phase === 'defense') contestBlock(); else stepBack(); }
  else if (k === 'v') { if (state.phase === 'defense') bodyCheck(); else jabStep(); }
});
window.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  if (['w', 'arrowup'].includes(k)) keys.up = false;
  if (['s', 'arrowdown'].includes(k)) keys.down = false;
  if (['a', 'arrowleft'].includes(k)) keys.left = false;
  if (['d', 'arrowright'].includes(k)) keys.right = false;
  if (k === 'shift') keys.sprint = false;
  if (k === ' ') primaryUp();
});
window.addEventListener('blur', () => {
  keys.up = keys.down = keys.left = keys.right = keys.sprint = false;
  if (state.charging) releaseShot();
});

const stick = document.getElementById('stick');
const nub = document.getElementById('nub');
let stickPointer = null;

function stickMove(e) {
  const r = stick.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const dx = e.clientX - cx, dy = e.clientY - cy;
  const max = r.width * 0.36;
  const d = Math.hypot(dx, dy) || 1;
  const s = Math.min(1, max / d);
  touch.x = dx * s / max;
  touch.y = dy * s / max;
  nub.style.left = `${50 + touch.x * 36}%`;
  nub.style.top = `${50 + touch.y * 36}%`;
}
function resetStick() {
  stickPointer = null;
  touch.x = touch.y = 0;
  nub.style.left = '50%';
  nub.style.top = '50%';
}
stick.addEventListener('pointerdown', (e) => { stickPointer = e.pointerId; stick.setPointerCapture(stickPointer); stickMove(e); });
stick.addEventListener('pointermove', (e) => { if (e.pointerId === stickPointer) stickMove(e); });
stick.addEventListener('pointerup', resetStick);
stick.addEventListener('pointercancel', resetStick);

const shootBtn = document.getElementById('shoot-touch');
shootBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); shootBtn.setPointerCapture(e.pointerId); primaryDown(); });
shootBtn.addEventListener('pointerup', (e) => { e.preventDefault(); primaryUp(); });
shootBtn.addEventListener('pointercancel', primaryUp);

document.getElementById('t-pass').addEventListener('click', () => { if (state.phase === 'defense') switchDefender(); else passBall(); });
document.getElementById('t-screen').addEventListener('click', () => { if (state.phase === 'defense') stealAttempt(); else callScreen(); });
document.getElementById('t-cross').addEventListener('click', () => { if (state.phase === 'defense') bodyCheck(); else crossover(); });
document.getElementById('t-step').addEventListener('click', () => { if (state.phase === 'defense') contestBlock(); else stepBack(); });

/* ================================================================== */
/*  DRIBBLE MOVES · PASS · SCREEN                                     */
/* ================================================================== */

function canAct() {
  return state.mode === 'playing' && state.phase === 'offense' &&
    !state.shot && !state.pass && !state.rebound && !state.dunk && !state.awayWindup;
}

function cancelCharge() {
  if (state.charging) {
    state.charging = false;
    state.charge = 0;
    hideSideMeter();
  }
}

function dashBurst(actor, vx, vz, type, duration = 0.32) {
  actor.vx = vx;
  actor.vz = vz;
  actor.moveTimer = duration;
  actor.moveType = type;
}

function crossover() {
  if (!canAct()) return;
  const a = activeActor();
  if (a.moveCooldown > 0) return;
  cancelCharge();
  a.moveCooldown = 0.7;
  const ix = (keys.right ? 1 : 0) - (keys.left ? 1 : 0) + touch.x;
  const side = Math.abs(ix) > 0.2 ? Math.sign(ix) : (Math.random() < 0.5 ? -1 : 1);
  const dx = HOOP.x - a.x, dz = HOOP.z - a.z;
  const len = Math.hypot(dx, dz) || 1;
  dashBurst(a, (dz / len) * 9.4 * side, (-dx / len) * 9.4 * side, 'cross', 0.34);
  setAnim(a, 'cross', 0.48);
  const { defender, dist } = nearestDefender(a);
  if (defender && dist < 2.0 && Math.random() < 0.55) {
    defender.stun = 0.85;
    setAnim(defender, 'fall', 0.9);
    showToast('ANKLES!', false, 'CROSSOVER');
    state.cameraShake = 0.1;
    state.crowdPulse = 0.75;
    burst(new THREE.Vector3(defender.x, 0.4, defender.z), 0xd8ff3e, 0.75);
    beep(150, 0.12, 'square', 0.03);
  } else {
    showToast('CROSSOVER', false, 'CREATE SPACE');
    burst(new THREE.Vector3(a.x, 0.25, a.z), 0xffd27a, 0.45);
    beep(420, 0.05, 'triangle', 0.02);
  }
}

function stepBack() {
  if (!canAct()) return;
  const a = activeActor();
  if (a.moveCooldown > 0) return;
  cancelCharge();
  a.moveCooldown = 0.62;
  const dx = a.x - HOOP.x, dz = a.z - HOOP.z;
  const len = Math.hypot(dx, dz) || 1;
  dashBurst(a, (dx / len) * 6.8, (dz / len) * 6.8, 'step', 0.3);
  setAnim(a, 'step', 0.6);
  state.stepbackTimer = 1.0;
  state.cameraShake = Math.max(state.cameraShake, 0.03);
  showToast('STEP BACK', false, 'SHOT SPACE');
  burst(new THREE.Vector3(a.x, 0.25, a.z), 0xffc46e, 0.55);
  beep(310, 0.07, 'sine', 0.02);
}

function jabStep() {
  if (!canAct()) return;
  const a = activeActor();
  if (a.moveCooldown > 0) return;
  cancelCharge();
  a.moveCooldown = 0.75;
  const dx = HOOP.x - a.x, dz = HOOP.z - a.z;
  const len = Math.hypot(dx, dz) || 1;
  dashBurst(a, (dx / len) * 8.4, (dz / len) * 8.4, 'jab', 0.3);
  setAnim(a, 'jab', 0.45);
  state.stepbackTimer = Math.max(state.stepbackTimer, 0.55);
  showToast('JAB STEP', false, 'ATTACK THE RIM');
  beep(380, 0.06, 'triangle', 0.02);
}

function passBall() {
  if (!canAct() || state.passCooldown > 0) return;
  cancelCharge();
  const a = activeActor();
  const mates = homeTeam.actors.filter(x => x !== a);
  if (!mates.length) return;
  let target = null, best = -Infinity;
  for (const m of mates) {
    let open = 12;
    for (const d of awayTeam.actors) open = Math.min(open, Math.hypot(m.x - d.x, m.z - d.z));
    const score = open + (m.z < a.z ? 0.7 : 0) + Math.random() * 0.5 - Math.hypot(m.x - a.x, m.z - a.z) * 0.08;
    if (score > best) { best = score; target = m; }
  }
  if (!target) return;
  state.passCooldown = 0.35;
  state.pass = {
    from: a, to: target, t: 0,
    dur: Math.max(0.22, Math.hypot(target.x - a.x, target.z - a.z) / 15),
    start: ball.position.clone()
  };
  setAnim(a, 'pass', 0.38);
  setAnim(target, 'receive', 0.3);
  target.receive = 0.5;
  showToast(`PASS · ${target.star.short}`, false, 'MOVE THE DEFENSE');
  beep(520, 0.06, 'sine', 0.02);
  updateUI();
}

function callScreen() {
  if (state.mode !== 'playing' || state.phase !== 'offense' || state.shot || state.pass || state.rebound || state.dunk) return;
  cancelCharge();
  if (state.screenCooldown > 0) {
    showToast('SCREEN NOT READY', true, `${Math.ceil(state.screenCooldown)}s COOLDOWN`);
    return;
  }
  if (state.screen) return;
  const a = activeActor();
  const mates = homeTeam.actors.filter(x => x !== a);
  let screener = null, bd = Infinity;
  for (const m of mates) {
    const d = Math.hypot(m.x - a.x, m.z - a.z);
    if (d < bd) { bd = d; screener = m; }
  }
  if (!screener) return;
  state.screen = { caller: a, screener, set: false, timer: 0, lockX: 0, lockZ: 0 };
  screener.rig.ring.material.color.setHex(0xffffff);
  screener.rig.ring.material.opacity = 0.7;
  showToast(`SCREEN · ${screener.star.short}`, false, 'USE THE SPACE');
  beep(360, 0.08, 'triangle', 0.02);
}

function endScreen(restore = true) {
  if (!state.screen) return;
  const s = state.screen.screener;
  if (s && restore) {
    s.rig.ring.material.color.setHex(HOME_COLOR);
    s.rig.ring.material.opacity = 0.34;
  }
  state.screen = null;
  state.screenCooldown = 4;
}

function resolvePass(dt) {
  const p = state.pass;
  if (!p) return;
  p.t += dt;
  const target = p.to;
  const t = Math.min(1, p.t / p.dur);
  ball.position.set(
    p.start.x + (target.x - p.start.x) * t,
    1.35 + Math.sin(t * Math.PI) * 0.3,
    p.start.z + (target.z - p.start.z) * t
  );
  ball.rotation.x -= dt * 12;
  if (t >= 1) {
    let intercepted = false;
    for (const d of awayTeam.actors) {
      if (Math.hypot(d.x - target.x, d.z - target.z) < 0.92 && Math.random() < 0.24) { intercepted = true; break; }
    }
    state.pass = null;
    if (intercepted) {
      turnover('PICKED OFF');
      return;
    }
    const idx = homeTeam.actors.indexOf(target);
    if (idx >= 0) {
      activeIndex = idx;
      state.lastPass = { from: p.from, to: target, time: state.elapsed };
      target.receive = 0.35;
      showToast(`${target.star.short} ON THE BALL`, false, 'ATTACK');
      beep(680, 0.06, 'sine', 0.02);
      updateUI();
    }
  }
}

/* ================================================================== */
/*  SHOOTING                                                          */
/* ================================================================== */

function shotWindow(actor = activeActor()) {
  if (!actor) return { center: 0.84, size: 0.09 };
  if (state.shotType === 'dunk') return { center: 0.8, size: 0.17 };
  const d = distToHoop(actor);
  const contest = contestAmount(actor);
  const base = 0.072 + (actor.star.shoot - 80) * 0.0038;
  const size = Math.max(0.048, Math.min(0.148,
    base - contest * 0.024 - Math.max(0, d - 6.75) * 0.0045
  ));
  return { center: 0.84, size };
}

function beginShot() {
  if (state.mode !== 'playing' || state.phase !== 'offense' || state.charging || state.shot || state.pass || state.rebound || state.dunk) return;
  const a = activeActor();
  if (!a) return;
  state.shotType = distToHoop(a) < 3.1 ? 'dunk' : 'jumper';
  state.charging = true;
  state.charge = 0;
  state.chargeDir = 1;
  state.shootAnim = 0;
  setAnim(a, 'gather', 0.3);
  ui.feedback.classList.remove('show');
  beep(state.shotType === 'dunk' ? 180 : 300, 0.06, 'triangle', 0.012);
  updateUI();
}

function releaseShot() {
  if (!state.charging) return;
  if (state.shotType === 'dunk') { releaseDunk(); return; }
  state.charging = false;
  hideSideMeter();
  const a = activeActor();
  if (!a) return;
  const w = shotWindow(a);
  const d = distToHoop(a);
  const worth = d > 6.75 ? 3 : 2;
  const green = state.charge >= w.center - w.size / 2 && state.charge <= w.center + w.size / 2;
  const contest = contestAmount(a);
  const moving = Math.hypot(a.vx, a.vz);
  const rating = a.star.shoot;
  const base = 0.55 + (rating - 75) * 0.014;
  const chance = Math.max(0.12, Math.min(0.95,
    base - contest * 0.27 - Math.max(0, d - 6.75) * 0.034 - Math.max(0, d - 8.5) * 0.02 - Math.min(0.16, moving * 0.022)
  ));
  const made = green || Math.random() < chance;
  const diff = state.charge - w.center;
  let grade;
  if (green) grade = 'GREEN';
  else if (diff < 0) grade = Math.abs(diff) < w.size * 1.05 ? 'SLIGHTLY EARLY' : 'EARLY';
  else grade = diff < w.size * 1.05 ? 'SLIGHTLY LATE' : 'LATE';
  showShotFeedback(grade, `${rangeLabel(d)} · ${Math.round(chance * 100)}%`, !green);

  const start = new THREE.Vector3(a.x + 0.16, 2.12 + state.charge * 0.3, a.z - 0.12);
  const end = HOOP.clone();
  if (made) {
    end.x += (Math.random() - 0.5) * 0.05;
    end.z += (Math.random() - 0.5) * 0.05;
    end.y += 0.01;
  } else {
    const side = Math.random() < 0.5 ? -1 : 1;
    end.x += side * (0.34 + Math.random() * 0.3);
    end.z += 0.18 + Math.random() * 0.2;
    end.y += (Math.random() - 0.5) * 0.12;
  }

  state.shot = {
    phase: 'flight', t: 0, team: 'home',
    dur: 0.74 + Math.min(d, 9.5) * 0.035,
    start, end, arc: 0.85 + d * 0.072 + contest * 0.16,
    made, worth, green, actor: a, contest, range: rangeLabel(d)
  };
  state.attempts++;
  state.shotClock = 24;
  state.shootAnim = 1;
  state.shotType = 'jumper';
  state.stepbackTimer = 0;
  setAnim(a, 'shoot', 0.7);
  if (green) { showToast('PERFECT RELEASE', false, `${a.star.short} · ${worth} PTS`); beep(840, 0.08, 'sine', 0.03); }
  else beep(made ? 400 : 230, 0.06, 'triangle', 0.018);
  updateUI();
}

function releaseDunk() {
  const a = activeActor();
  if (!a) return;
  const w = shotWindow(a);
  const green = state.charge >= w.center - w.size / 2 && state.charge <= w.center + w.size / 2;
  const contest = contestAmount(a);
  const nearest = nearestDefender(a);
  let poster = false, victim = null;
  if (nearest.defender) {
    const hx = HOOP.x - a.x, hz = HOOP.z - a.z;
    const dx = nearest.defender.x - a.x, dz = nearest.defender.z - a.z;
    const hl = Math.hypot(hx, hz) || 1, dl = Math.hypot(dx, dz) || 1;
    const align = (hx * dx + hz * dz) / (hl * dl);
    if (nearest.dist < 1.85 && align > 0.05 && Math.random() < (green ? 0.82 : 0.38)) {
      poster = true;
      victim = nearest.defender;
    }
  }
  const makeChance = green ? 0.95 : Math.max(0.22, 0.58 + (a.star.rating - 80) * 0.01 - contest * 0.34);
  const made = Math.random() < makeChance;
  state.charging = false;
  hideSideMeter();
  state.attempts++;
  state.shotClock = 24;
  state.shotType = 'jumper';
  state.shootAnim = 0;
  state.dunk = {
    t: 0, actor: a, made, poster, victim, worth: 2, green, contest,
    startX: a.x, startZ: a.z, endX: Math.max(-1.1, Math.min(1.1, a.x * 0.28)), endZ: -11.35,
    slammed: false, scored: false
  };
  a.vx = a.vz = 0;
  a.dunking = 1;
  if (poster) {
    victim.stun = 1.8;
    setAnim(victim, 'fall', 1.5);
    state.cameraShake = 0.14;
    state.crowdPulse = 1;
    flashScreen();
    showToast('POSTERIZER INCOMING', false, `${a.star.short} IS TAKING OFF`);
  } else {
    showToast(green ? 'RIM RUN' : 'TAKE IT TO THE RACK', !green, green ? 'PERFECT TAKEOFF' : 'FINISH STRONG');
  }
  beep(green ? 620 : 330, 0.1, 'sine', 0.03);
  updateUI();
}

function flashScreen() {
  ui.flash.classList.add('on');
  clearTimeout(state.flashTimer);
  state.flashTimer = setTimeout(() => ui.flash.classList.remove('on'), 110);
}

function showShotFeedback(text, sub, bad) {
  ui.feedback.innerHTML = `${text}<small>${sub}</small>`;
  ui.feedback.classList.toggle('green', !bad);
  ui.feedback.classList.toggle('bad', bad);
  ui.feedback.classList.add('show');
  state.shotFeedback.timer = 1.25;
}

function hideSideMeter() {
  ui.sideMeter.classList.remove('show');
}

function scoreMake(shot) {
  if (shot.team === 'away') {
    state.opp += shot.worth;
    state.streak = 0;
    state.netPulse = 1.1;
    state.crowdPulse = 0.8;
    state.cameraShake = 0.12;
    state.rimFlash = 1;
    burst(HOOP.clone(), 0xffb09a, 1);
    showToast(`${shot.actor.star.short} SCORES`, true, `${shot.range} · ${shot.worth} RIVALS POINTS`);
    popScore(ui.opp);
    beep(shot.worth === 3 ? 760 : 420, 0.16, 'sine', 0.035);
    updateUI();
    return;
  }
  state.score += shot.worth;
  state.makes++;
  state.streak++;
  shot.actor.points += shot.worth;
  state.netPulse = 1;
  state.crowdPulse = 1;
  state.cameraShake = 0.15;
  state.rimFlash = 1;
  burst(HOOP.clone(), 0xd8ff3e, 1);
  let sub = shot.green ? 'GREEN RELEASE' : `${shot.range} · ${shot.worth} POINTS`;
  if (state.lastPass && state.elapsed - state.lastPass.time < 5.5 && state.lastPass.from !== shot.actor) {
    sub += ` · ASSIST ${state.lastPass.from.star.short}`;
  }
  showToast(`${shot.actor.star.short} ${shot.worth === 3 ? 'FROM DEEP' : 'BUCKET'}`, false, sub);
  popScore(ui.score);
  beep(shot.worth === 3 ? 920 : 690, 0.17, 'sine', 0.05);
  setTimeout(() => beep(shot.worth === 3 ? 1180 : 870, 0.13, 'sine', 0.03), 90);
  updateUI();
}

function scoreDunk(d) {
  const a = d.actor;
  state.score += 2;
  state.makes++;
  state.streak++;
  a.points += 2;
  state.netPulse = 1.5;
  state.crowdPulse = 1.35;
  state.rimFlash = 1.5;
  state.cameraShake = d.poster ? 0.34 : 0.24;
  burst(HOOP.clone(), 0xf4ffe6, 1.7);
  d.scored = true;
  showToast(d.poster ? 'POSTERIZED!' : 'SLAM DUNK', false,
    d.poster ? `${a.star.short} JUST PUT HIM ON A POSTER` : `${a.star.short} · TWO HARD POINTS`);
  popScore(ui.score);
  flashScreen();
  beep(1040, 0.16, 'sine', 0.05);
  setTimeout(() => beep(1320, 0.12, 'sine', 0.03), 95);
  updateUI();
}

function scoreMiss(shot) {
  state.streak = 0;
  const awayShot = shot.team === 'away';
  showToast(awayShot ? 'RIVALS MISS' : 'NO GOOD', !awayShot ? true : false, 'CRASH THE GLASS');
  beep(150, 0.14, 'square', 0.018);
  state.rebound = { t: 0, dur: 1.3, resolved: false, shotTeam: shot.team || 'home' };
  updateUI();
}

function startLooseBall(pos, shotTeam = 'home', reason = '') {
  state.charging = false;
  hideSideMeter();
  state.shot = {
    phase: 'loose', team: shotTeam, t: 0, timer: 0,
    made: false, worth: 0, actor: null, range: 'LOOSE BALL'
  };
  state.rebound = {
    t: 0, dur: 0.9 + Math.random() * 0.35, resolved: false,
    shotTeam, bias: reason === 'block' ? 'home' : ''
  };
  ball.position.copy(pos);
  ballVel.set((Math.random() - 0.5) * 3, 1.6, (Math.random() * 2 + 1.2));
  updateUI();
}

function resolveRebound() {
  if (!state.rebound || !state.shot) return;
  const rb = state.rebound;
  if (rb.resolved) return;
  rb.resolved = true;
  const shotTeam = rb.shotTeam || 'home';
  let winner = null, best = Infinity;
  for (const a of actors) {
    let d = Math.hypot(a.x - ball.position.x, a.z - ball.position.z) + Math.random() * 0.75;
    if (rb.bias === 'home' && a.team === 'away') d += 1.25;
    if (a === state.dunk?.actor) d += 0.8;
    if (d < best) { best = d; winner = a; }
  }
  if (!winner) return;
  state.shot = null;
  state.rebound = null;
  if (winner.team === 'home') {
    if (shotTeam === 'home') {
      const idx = homeTeam.actors.indexOf(winner);
      if (idx >= 0) activeIndex = idx;
      resetFormation(false);
      state.phase = 'offense';
      state.shotClock = 14;
      state.streak = 0;
      setPhaseUI();
      showToast(`${winner.star.short} · OFFENSIVE BOARD`, false, 'KEEP IT ALIVE');
      beep(520, 0.08, 'sine', 0.025);
      updateUI();
    } else {
      beginHomePossession(winner, 'rebound');
    }
  } else {
    state.streak = 0;
    const secondChance = shotTeam === 'away';
    beep(190, 0.1, 'square', 0.025);
    beginAwayPossession(winner, secondChance ? 'SECOND CHANCE' : 'DEFEND');
    if (!secondChance) showToast('RIVALS BOARD', true, 'GET BACK ON DEFENSE');
  }
}

function turnover(kind) {
  state.streak = 0;
  state.pressure = 0;
  state.pressureWarned = false;
  state.cameraShake = 0.08;
  beep(110, 0.16, 'square', 0.03);
  beginAwayPossession(awayTeam.actors[0], kind);
}

function shotClockViolation() {
  state.streak = 0;
  beep(120, 0.25, 'sawtooth', 0.025);
  beginAwayPossession(awayTeam.actors[0], 'SHOT CLOCK');
}

function awayShotClockViolation() {
  clearLiveBall();
  state.phase = 'offense';
  resetFormation(false);
  state.shotClock = 24;
  setPhaseUI();
  showToast('SHOT CLOCK · YOUR BALL', false, 'RIVALS COULD NOT GET ONE UP');
  beep(720, 0.1, 'sine', 0.03);
  updateUI();
}

function updateDunk(dt) {
  const d = state.dunk;
  if (!d) return;
  const a = d.actor;
  d.t += dt;
  const rise = 0.36, hang = 0.62, land = 1.2;
  const hopK = Math.min(1, d.t / rise);
  if (d.t < rise) {
    a.x += (d.endX - a.x) * Math.min(1, dt * 9);
    a.z += (d.endZ - a.z) * Math.min(1, dt * 9);
    a.vx = a.vz = 0;
    ball.position.set(a.x + 0.08, 1.35 + updown(hopK) * 1.35, a.z - 0.12);
    ball.rotation.x -= dt * 17;
  } else if (d.t < hang) {
    a.x = d.endX; a.z = d.endZ;
    if (!d.slammed) {
      d.slammed = true;
      ball.position.set(HOOP.x, HOOP.y + 0.28, HOOP.z + 0.08);
      if (d.poster && d.victim) {
        d.victim.stun = 2;
        setAnim(d.victim, 'fall', 1.5);
        state.cameraShake = 0.4;
        flashScreen();
      }
      burst(new THREE.Vector3(HOOP.x, HOOP.y, HOOP.z), 0xffffff, 1.35);
      state.netPulse = 1.4;
      state.crowdPulse = 1.35;
      state.rimFlash = 1.5;
      if (d.made) scoreDunk(d);
      else {
        showToast('RIM DENIED', true, d.poster ? 'SO CLOSE' : 'TOO STRONG');
        beep(190, 0.14, 'square', 0.025);
        state.cameraShake = 0.2;
      }
    }
    const k = (d.t - rise) / (hang - rise);
    ball.position.set(HOOP.x, HOOP.y + 0.18 - k * 0.55, HOOP.z + 0.06);
    ball.rotation.x -= dt * 8;
  } else if (d.t < land) {
    a.x = d.endX; a.z = d.endZ;
    ball.position.set(HOOP.x, HOOP.y - 0.4 - (d.t - hang) * 2.4, HOOP.z + 0.1);
    let floor = 0.122;
    if (ball.position.y < floor) {
      ball.position.y = floor;
      ballVel.set((Math.random() - 0.5) * 1.6, 0.9, 1.6);
    }
    ball.position.addScaledVector(ballVel, dt);
  } else {
    a.x = d.endX; a.z = d.endZ;
    const actor = d.actor;
    state.dunk = null;
    actor.dunking = 0;
    actor.vx = actor.vz = 0;
    if (d.made && d.scored) {
      beginHomePossession();
    } else {
      startLooseBall(new THREE.Vector3(HOOP.x + (Math.random() < 0.5 ? -0.55 : 0.55), 1.0, HOOP.z + 0.65), 'home');
    }
  }
}

/* ================================================================== */
/*  BALL                                                              */
/* ================================================================== */

function updateBall(dt, t) {
  state.shootAnim = Math.max(0, state.shootAnim - dt * 2.4);
  if (state.dunk) { updateDunk(dt); return; }
  if (state.pass) { resolvePass(dt); return; }
  if (state.awayPass) { resolveAwayPass(dt); return; }

  if (state.shot) {
    const s = state.shot;
    if (s.phase === 'flight') {
      s.t += dt;
      const p = Math.min(1, s.t / s.dur);
      ball.position.lerpVectors(s.start, s.end, p);
      ball.position.y += Math.sin(Math.PI * p) * s.arc;
      ball.rotation.x -= dt * 16;
      ball.rotation.z += dt * 3.5;
      if (p >= 1) {
        if (s.made) {
          scoreMake(s);
          s.phase = 'drop';
          s.timer = 0;
          ballVel.set(0, -1.1, 0.45);
        } else {
          scoreMiss(s);
          s.phase = 'loose';
          s.timer = 0;
          ballVel.set((Math.random() - 0.5) * 3.4, 1.3, 3.2 + Math.random());
        }
      }
      return;
    }

    s.timer += dt;
    if (state.rebound) state.rebound.t += dt;
    ballVel.y -= 12 * dt;
    ball.position.addScaledVector(ballVel, dt);
    ball.rotation.x -= dt * 12;
    ball.rotation.z += dt * 4;
    const floorY = 0.122;
    if (ball.position.y < floorY) {
      ball.position.y = floorY;
      if (ballVel.y < 0) ballVel.y = Math.abs(ballVel.y) * 0.56;
      ballVel.x *= 0.75;
      ballVel.z *= 0.75;
      if (Math.abs(ballVel.y) < 0.55) ballVel.y = 0;
    }
    if (state.rebound && s.phase === 'loose' && state.rebound.t >= state.rebound.dur) {
      resolveRebound();
      return;
    }
    if (s.phase === 'drop' && s.timer > 1.05) {
      state.shot = null;
      beginHomePossession();
      return;
    }
    return;
  }

  if (state.awayWindup) {
    const w = state.awayWindup;
    const a = w.actor;
    const pr = Math.min(1, w.t / w.dur);
    const raise = Math.sin(pr * Math.PI * 0.72);
    ball.position.set(a.x + 0.13, 1.45 + raise * 0.86, a.z - 0.12);
    ball.rotation.x -= dt * 3;
    return;
  }

  if (state.charging) {
    const a = activeActor();
    if (a) ball.position.set(a.x + 0.16, 2.12 + state.charge * 0.34, a.z - 0.12);
    ball.rotation.x -= dt * 2;
    return;
  }

  if (state.phase === 'defense' && state.away && state.away.handler) {
    const h = state.away.handler;
    const bounce = Math.abs(Math.sin(t * 6.4));
    ball.position.set(h.x + 0.44, 0.125 + bounce * 0.72, h.z + 0.24);
    ball.rotation.x -= dt * (7 + bounce * 9);
    ball.rotation.z += dt * 1.6;
    return;
  }

  const a = activeActor();
  if (!a) return;
  const bounce = Math.abs(Math.sin(t * 5.8));
  ball.position.set(a.x + 0.42, 0.125 + bounce * 0.72, a.z + 0.12);
  ball.rotation.x -= dt * (7 + bounce * 9);
  ball.rotation.z += dt * 1.6;
}

/* ================================================================== */
/*  MOVEMENT + AI                                                     */
/* ================================================================== */

function clampCourt(a) {
  a.x = Math.max(-6.95, Math.min(6.95, a.x));
  a.z = Math.max(-11.15, Math.min(1.7, a.z));
}

function moveToward(a, tx, tz, speed, dt, accel = 3.6) {
  const dx = tx - a.x, dz = tz - a.z;
  const d = Math.hypot(dx, dz);
  if (d < 0.05) {
    a.vx *= Math.max(0, 1 - dt * 6);
    a.vz *= Math.max(0, 1 - dt * 6);
    return;
  }
  const k = Math.min(1, dt * accel);
  a.vx += ((dx / d) * speed - a.vx) * k;
  a.vz += ((dz / d) * speed - a.vz) * k;
  a.x += a.vx * dt;
  a.z += a.vz * dt;
  clampCourt(a);
}

function updateActive(dt) {
  const a = activeActor();
  if (!a) return;
  let ix = (keys.right ? 1 : 0) - (keys.left ? 1 : 0) + touch.x;
  let iz = (keys.down ? 1 : 0) - (keys.up ? 1 : 0) + touch.y;
  const mag = Math.hypot(ix, iz);
  if (mag > 1) { ix /= mag; iz /= mag; }

  if (a.dunking) return;
  if (a.stun > 0) {
    a.vx *= Math.max(0, 1 - dt * 5);
    a.vz *= Math.max(0, 1 - dt * 5);
    return;
  }

  if (state.phase === 'defense') {
    let speed = a.speed * (keys.sprint ? 1.34 : 1.12);
    if (a.contestTimer > 0) speed *= 0.34;
    const accel = Math.min(1, dt * 11);
    a.vx += (ix * speed - a.vx) * accel;
    a.vz += (iz * speed - a.vz) * accel;
    a.x += a.vx * dt;
    a.z += a.vz * dt;
    clampCourt(a);
    return;
  }

  if (a.moveTimer > 0) {
    a.moveTimer -= dt;
    a.x += a.vx * dt;
    a.z += a.vz * dt;
    const drag = Math.pow(0.1, dt);
    a.vx *= drag;
    a.vz *= drag;
  } else {
    let speed = a.speed * (keys.sprint ? 1.28 : 1);
    if (state.charging) speed *= 0.58;
    if (state.shot) speed *= 0.4;
    if (state.pass) speed *= 0.85;
    const accel = Math.min(1, dt * 10);
    a.vx += (ix * speed - a.vx) * accel;
    a.vz += (iz * speed - a.vz) * accel;
    a.x += a.vx * dt;
    a.z += a.vz * dt;
  }
  clampCourt(a);
}

function chooseSpot(a) {
  const active = activeActor();
  const otherMatess = homeTeam.actors.filter(x => x !== a && x !== active);
  const spots = [
    { x: -5.5, z: -8.0 }, { x: 5.5, z: -8.0 },
    { x: -6.25, z: -11.9 }, { x: 6.25, z: -11.9 },
    { x: -4.1, z: -10.7 }, { x: 4.1, z: -10.7 },
    { x: 0, z: -5.6 }, { x: 0, z: -9.5 }
  ];
  let best = spots[0], bs = -Infinity;
  for (const spot of spots) {
    const dActive = Math.hypot(spot.x - active.x, spot.z - active.z);
    if (dActive < 2.3) continue;
    let open = 12;
    for (const d of awayTeam.actors) open = Math.min(open, Math.hypot(spot.x - d.x, spot.z - d.z));
    let mateSpace = 8;
    for (const m of otherMatess) mateSpace = Math.min(mateSpace, Math.hypot(spot.x - m.x, spot.z - m.z));
    const score = open * 1.05 + Math.min(3, mateSpace) * 0.55 + dActive * 0.12 + Math.random() * 0.5;
    if (score > bs) { bs = score; best = spot; }
  }
  return best;
}

function updateHomeDefenseAI(a, dt, t) {
  a.contestTimer = Math.max(0, a.contestTimer - dt);
  a.receive = Math.max(0, a.receive - dt);
  if (a.stun > 0) {
    a.vx *= Math.max(0, 1 - dt * 5);
    a.vz *= Math.max(0, 1 - dt * 5);
    return;
  }
  const handler = state.away && state.away.handler;
  const controlled = controlledActor();
  const mates = homeTeam.actors.filter(x => x !== controlled);
  const unguarded = awayTeam.actors.filter(x => x !== handler);
  const idx = Math.max(0, mates.indexOf(a));
  const man = unguarded[idx] || unguarded[0] || handler;
  a.man = man;
  if (!man) return;
  const dx = HOOP.x - man.x, dz = HOOP.z - man.z;
  const len = Math.hypot(dx, dz) || 1;
  let tx = man.x + (dx / len) * 1.02;
  let tz = man.z + (dz / len) * 1.02;
  if (handler && Math.hypot(handler.x - HOOP.x, handler.z - HOOP.z) < 4.8) {
    const hx = HOOP.x - handler.x, hz = HOOP.z - handler.z;
    const hl = Math.hypot(hx, hz) || 1;
    tx = tx * 0.8 + (handler.x + (hx / hl) * 1.0) * 0.2;
    tz = tz * 0.8 + (handler.z + (hz / hl) * 1.0) * 0.2;
  }
  const speed = a.speed * (state.awayWindup ? 0.55 : 0.96);
  moveToward(a, tx, tz, speed, dt, 4.1);
}

function updateHomeAI(a, dt, t) {
  a.moveCooldown = Math.max(0, a.moveCooldown - dt);
  a.receive = Math.max(0, a.receive - dt);
  a.contestTimer = Math.max(0, (a.contestTimer || 0) - dt);
  if (state.phase === 'defense') { updateHomeDefenseAI(a, dt, t); return; }
  if (a.dunking) return;

  if (state.rebound) {
    moveToward(a, ball.position.x, ball.position.z, a.speed * 1.18, dt, 4.2);
    return;
  }
  if (state.pass && state.pass.to === a) {
    moveToward(a, a.x, a.z, 0, dt, 5);
    return;
  }
  if (state.screen && state.screen.screener === a) {
    const active = activeActor();
    const { defender } = nearestDefender(active);
    if (defender) {
      if (!state.screen.set) {
        const dx = active.x - defender.x, dz = active.z - defender.z;
        const len = Math.hypot(dx, dz) || 1;
        const px = -dz / len, pz = dx / len;
        const side = a.x < active.x ? -1 : 1;
        const tx = defender.x + (dx / len) * 0.55 + px * 0.5 * side;
        const tz = defender.z + (dz / len) * 0.55 + pz * 0.5 * side;
        moveToward(a, tx, tz, a.speed * 1.12, dt, 4.5);
        const dd = Math.hypot(a.x - defender.x, a.z - defender.z);
        if (dd < 1.18) {
          state.screen.set = true;
          state.screen.timer = 0;
          state.screen.lockX = a.x;
          state.screen.lockZ = a.z;
          defender.screenHold = 1.9;
          defender.stun = 0.35;
          setAnim(a, 'screen', 0.4);
          showToast(`${a.star.short} · SCREEN SET`, false, 'USE THE SPACE');
          beep(760, 0.07, 'sine', 0.03);
        }
      } else {
        moveToward(a, state.screen.lockX, state.screen.lockZ, 0, dt, 5);
      }
      return;
    }
  }

  a.cutCooldown -= dt;
  a.spotTimer = (a.spotTimer || 0) - dt;
  if (a.spotTimer <= 0) {
    a.spot = chooseSpot(a);
    a.spotTimer = 0.7 + Math.random() * 0.6;
  }
  if (a.cutCooldown <= 0 && a.cutTimer <= 0 && (!state.cutLock || state.cutLock <= 0) && !state.screen) {
    a.cutTimer = 1.5;
    a.cutCooldown = 6 + Math.random() * 4;
    state.cutLock = 2.4;
  }
  let tx = a.spot.x, tz = a.spot.z;
  if (a.cutTimer > 0) {
    a.cutTimer -= dt;
    const side = a.x < 0 ? -1 : 1;
    tx = HOOP.x + side * 1.15;
    tz = -10.5;
  }
  moveToward(a, tx, tz, a.speed * 0.95, dt, 3.5);
}

function updateAwayOffenseAI(d, dt, t) {
  const pos = state.away;
  if (!pos) return;
  d.stun = Math.max(0, (d.stun || 0) - dt);
  if (d.anim && d.anim.type === 'fall') {
    d.vx *= Math.max(0, 1 - dt * 5);
    d.vz *= Math.max(0, 1 - dt * 5);
    return;
  }
  if (d.stun > 0) {
    d.vx *= Math.max(0, 1 - dt * 5);
    d.vz *= Math.max(0, 1 - dt * 5);
    return;
  }
  if (d !== pos.handler) {
    const mates = awayTeam.actors.filter(a => a !== pos.handler);
    const idx = Math.max(0, mates.indexOf(d));
    const spot = idx === 0 ? { x: -5.35, z: -8.4 } : { x: 5.35, z: -8.4 };
    if (state.awayPass && state.awayPass.to === d) {
      moveToward(d, d.x, d.z, 0, dt, 5);
    } else {
      moveToward(d, spot.x, spot.z, d.speed * 0.88, dt, 3.2);
    }
    return;
  }
  if (state.awayPass || state.awayWindup) {
    d.vx *= Math.max(0, 1 - dt * 8);
    d.vz *= Math.max(0, 1 - dt * 8);
    return;
  }
  pos.t += dt;
  const dist = distToHoop(d);
  const ctrl = controlledActor();
  const cdist = ctrl ? Math.hypot(ctrl.x - d.x, ctrl.z - d.z) : 9;
  const dx = HOOP.x - d.x, dz = HOOP.z - d.z;
  const len = Math.hypot(dx, dz) || 1;
  let tx = HOOP.x - (dx / len) * 1.9;
  let tz = HOOP.z - (dz / len) * 1.9;
  if (cdist < 1.3 && dist > 2.4) {
    const side = d.x < 0 ? 1 : -1;
    tx += (dz / len) * 1.25 * side;
    tz += (-dx / len) * 1.25 * side;
  }
  moveToward(d, tx, tz, d.speed * (pos.t > 2 ? 1.02 : 0.82), dt, 3.8);
  pos.passT -= dt;
  if (!pos.passed && pos.passT <= 0 && cdist < 1.08 && pos.t > 0.8) {
    if (awayPassToOpen(d)) { pos.passed = true; return; }
  }
  if (pos.t > pos.attackT || dist < 4.7) {
    pos.shotPending = true;
    beginAwayShot(d);
  }
}

function updateAwayAI(d, dt, t, index) {
  d.stun = Math.max(0, (d.stun || 0) - dt);
  d.screenHold = Math.max(0, (d.screenHold || 0) - dt);
  if (state.phase === 'defense' && state.away) { updateAwayOffenseAI(d, dt, t); return; }
  if (d.dunking) return;
  if (state.rebound) {
    moveToward(d, ball.position.x, ball.position.z, d.speed * 1.22, dt, 4.4);
    return;
  }
  if (state.dunk) {
    moveToward(d, HOOP.x + (index - 1) * 0.8, HOOP.z + 1.0, d.speed * 0.9, dt, 3);
    return;
  }
  if (state.shot && state.shot.phase === 'flight') {
    const side = index === 0 ? -1 : index === 1 ? 1 : 0;
    moveToward(d, side * 1.8, -10.4, d.speed * 0.95, dt, 3);
    return;
  }
  if (d.stun > 0) {
    d.vx *= Math.max(0, 1 - dt * 5);
    d.vz *= Math.max(0, 1 - dt * 5);
    return;
  }
  const active = activeActor();
  let man;
  if (index === 0) man = active;
  else {
    const others = homeTeam.actors.filter(x => x !== active);
    man = others[index - 1] || active;
  }
  d.man = man;
  const dx = HOOP.x - man.x, dz = HOOP.z - man.z;
  const len = Math.hypot(dx, dz) || 1;
  let tx = man.x + (dx / len) * 1.5;
  let tz = man.z + (dz / len) * 1.5;
  if (index !== 0) {
    tx += (active.x - tx) * 0.08;
    tz += (active.z - tz) * 0.08;
  }
  const slow = d.screenHold > 0 ? 0.35 : 1;
  moveToward(d, tx, tz, d.speed * slow, dt, 4.1);
}

function separateActors() {
  for (let i = 0; i < actors.length; i++) {
    for (let j = i + 1; j < actors.length; j++) {
      const a = actors[i], b = actors[j];
      if (a.dunking || b.dunking) continue;
      let dx = b.x - a.x, dz = b.z - a.z;
      let d = Math.hypot(dx, dz);
      if (d < 0.001) { dx = 0.01; dz = 0; d = 0.01; }
      const min = 0.76;
      if (d < min) {
        const push = (min - d) * 0.5;
        a.x -= (dx / d) * push;
        a.z -= (dz / d) * push;
        b.x += (dx / d) * push;
        b.z += (dz / d) * push;
      }
    }
  }
  for (const a of actors) clampCourt(a);
}

function updatePressure(dt) {
  if (state.phase !== 'offense' || state.shot || state.pass || state.rebound || state.dunk) {
    state.pressure = Math.max(0, state.pressure - dt * 2);
    return;
  }
  if (state.shot || state.pass || state.rebound) {
    state.pressure = Math.max(0, state.pressure - dt * 2);
    return;
  }
  const a = activeActor();
  const { dist } = nearestDefender(a);
  if (dist < 1.0) state.pressure += dt;
  else state.pressure = Math.max(0, state.pressure - dt * 1.8);
  if (state.pressure > 2.0 && !state.pressureWarned) {
    state.pressureWarned = true;
    showToast('GET SEPARATION', true, 'RIVALS ARE HANDSY');
  }
  if (state.pressure > 4.2) {
    state.pressure = 0;
    state.pressureWarned = false;
    turnover('STRIPPED');
  }
  if (state.pressure < 0.9) state.pressureWarned = false;
}

/* ================================================================== */
/*  VISUALS                                                           */
/* ================================================================== */

const PARTICLE_COUNT = 36;
const pGeo = new THREE.BufferGeometry();
const pPositions = new Float32Array(PARTICLE_COUNT * 3);
pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
const pMat = new THREE.PointsMaterial({
  color: 0xd8ff3e, size: 0.1, transparent: true, opacity: 0,
  blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
});
const particles = new THREE.Points(pGeo, pMat);
particles.frustumCulled = false;
scene.add(particles);
const pVel = [];
let pLife = 0;
for (let i = 0; i < PARTICLE_COUNT; i++) pVel.push(new THREE.Vector3());

function burst(at) {
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    pPositions[i * 3] = at.x;
    pPositions[i * 3 + 1] = at.y;
    pPositions[i * 3 + 2] = at.z;
    pVel[i].set((Math.random() - 0.5) * 4.4, Math.random() * 4.6, (Math.random() - 0.5) * 4.4);
  }
  pGeo.attributes.position.needsUpdate = true;
  pLife = 1;
  pMat.opacity = 1;
}

function lerpAngle(a, b, t) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

function poseActor(a, dt, t) {
  const rig = a.rig;
  const sp = Math.hypot(a.vx, a.vz);
  a.phase += dt * (2.05 + sp * 2.35);
  const amt = Math.min(1, sp / 3.2);
  const swing = Math.sin(a.phase) * 0.64 * amt;
  const [legL, legR] = rig.legs;
  const [armL, armR] = rig.arms;

  let hipL = swing, hipR = -swing;
  let kneeL = Math.max(0, -Math.sin(a.phase)) * 0.82 * amt;
  let kneeR = Math.max(0, Math.sin(a.phase)) * 0.82 * amt;
  let shLx = 0.16 + Math.sin(a.phase) * 0.52 * amt;
  let shRx = 0.16 - Math.sin(a.phase) * 0.52 * amt;
  let shLz = 0.16, shRz = -0.16;
  let elLx = -0.3, elRx = -0.3;
  let torsoX = 0.02 + 0.07 * amt;
  let torsoY = 0;
  let rootY = 0.012 + Math.abs(Math.sin(a.phase * 2)) * 0.035 * amt;
  let rootRoll = 0;
  let rootPitch = 0;

  const anim = a.anim;
  const active = a === controlledActor();

  if (state.dunk && state.dunk.actor === a) {
    const d = state.dunk;
    const p = d.t;
    const rise = Math.min(1, p / 0.36);
    const hang = Math.max(0, Math.min(1, (p - 0.36) / 0.28));
    const land = Math.max(0, Math.min(1, (p - 0.78) / 0.42));
    const jump = p < 0.78 ? Math.sin(Math.min(1, p / 0.78) * Math.PI / 2) * 1.22 : (1 - land) * 1.22;
    rootY = 0.012 + jump;
    hipL = 0.65; hipR = 0.35; kneeL = 1.15; kneeR = 0.85;
    torsoX = p < 0.36 ? -0.18 : 0.38;
    if (p < 0.36) {
      shLx = 0.55 + rise * 1.8; shRx = 1.0 + rise * 1.9;
      shLz = 0.4; shRz = -0.4;
      elLx = -0.5; elRx = -0.7;
    } else if (p < 0.72) {
      shLx = 2.85 - hang * 0.8; shRx = 3.1 - hang * 1.5;
      shLz = 0.25; shRz = -0.25;
      elLx = -0.15; elRx = -0.1;
      torsoX = 0.32;
    } else {
      shLx = 0.9 + (1 - land) * 0.9; shRx = 0.6 + (1 - land) * 1.1;
      shLz = 0.55; shRz = -0.55;
      elLx = -0.5; elRx = -0.5;
      torsoX = 0.2;
    }
  } else if (anim) {
    const p = updown(anim.t / anim.dur);
    const e = Math.sin(p * Math.PI);
    const ease = p < 0.5 ? p * 2 : (1 - p) * 2;
    if (anim.type === 'cross') {
      const dir = a.vx >= 0 ? 1 : -1;
      rootRoll = e * 0.24 * dir;
      torsoY = e * 0.42 * dir;
      shLx = 0.3 + e * 0.9; shRx = 0.4 + e * 0.7;
      shLz = 0.15 + e * 0.55; shRz = -0.15 - e * 0.2;
      elLx = -0.35 - e * 0.4; elRx = -0.5;
      hipL = e * 0.35; hipR = -e * 0.35;
      torsoX = 0.25;
    } else if (anim.type === 'step') {
      const plant = Math.sin(Math.min(1, p * 1.7) * Math.PI);
      const recoil = Math.sin(Math.min(1, p * 1.25) * Math.PI / 2);
      torsoX = -0.22 - 0.3 * plant;
      torsoY = 0.22 * e * (a.vx >= 0 ? 1 : -1);
      rootY += plant * 0.14;
      rootRoll = e * 0.12 * (a.vx >= 0 ? 1 : -1);
      hipL = -0.45 * e - 0.28 * recoil; hipR = 0.38 * e + 0.2 * recoil;
      kneeL = 0.28 + e * 0.58; kneeR = 0.2 + e * 0.32;
      shLx = 0.48 + e * 0.88; shRx = 0.5 + e * 1.05;
      shLz = 0.42; shRz = -0.38;
      elLx = -0.55; elRx = -0.62;
    } else if (anim.type === 'jab') {
      torsoX = 0.3 * e;
      rootY += e * 0.045;
      hipL = 0.55 * e; hipR = -0.25 * e;
      kneeL = 0.2 + e * 0.35;
      shLx = 0.4 + e * 0.85; shRx = 0.3 + e * 0.6;
      elLx = -0.4; elRx = -0.5;
    } else if (anim.type === 'gather') {
      torsoX = 0.24 * e;
      hipL = -0.25 * e; hipR = 0.25 * e;
      kneeL = 0.2 + e * 0.45; kneeR = 0.2 + e * 0.45;
      shLx = 0.2 + e * 0.5; shRx = 0.2 + e * 0.6;
    } else if (anim.type === 'shoot') {
      const gather = Math.sin(Math.min(1, p * 1.35) * Math.PI * 0.5);
      const rise = Math.sin(Math.min(1, p * 1.08) * Math.PI * 0.5);
      const release = updown((p - 0.48) / 0.34);
      const follow = updown((p - 0.72) / 0.28);
      rootY += rise * (1 - follow * 0.58) * 0.34;
      hipL = 0.18 + gather * 0.42 - follow * 0.15; hipR = 0.16 + gather * 0.34 - follow * 0.12;
      kneeL = 0.16 + gather * 0.5; kneeR = 0.14 + gather * 0.4;
      shLx = 0.22 + gather * 1.15 + release * 1.0 - follow * 0.18;
      shRx = 0.2 + gather * 1.5 + release * 1.35 - follow * 0.12;
      shLz = 0.3; shRz = -0.32;
      elLx = -0.36 - gather * 0.38 + release * 0.16;
      elRx = -0.34 - gather * 0.52 + release * 0.28;
      torsoX = 0.08 + gather * 0.14 - release * 0.2;
    } else if (anim.type === 'pass') {
      shRx = 0.16 + e * 1.65; shLx = 0.16 + e * 0.5;
      elRx = -0.25 + e * 0.65; elLx = -0.3 - e * 0.25;
      torsoY = -e * 0.35;
      torsoX = 0.08 + e * 0.12;
      hipL = 0.25 * e; hipR = -0.15 * e;
    } else if (anim.type === 'receive') {
      shLx = 0.16 + e * 0.95; shRx = 0.16 + e * 1.05;
      elLx = -0.3 - e * 0.55; elRx = -0.3 - e * 0.55;
      torsoX = 0.08 + e * 0.18;
      kneeL = 0.25 * e; kneeR = 0.2 * e;
    } else if (anim.type === 'contest') {
      const jump = Math.sin(p * Math.PI) * 0.38;
      const reach = Math.sin(Math.min(1, p * 1.45) * Math.PI * 0.5);
      rootY += jump;
      rootPitch = -reach * 0.08;
      shLx = 0.18 + reach * 2.55; shRx = 0.18 + reach * 2.75;
      shLz = 0.24; shRz = -0.24;
      elLx = -0.22 - reach * 0.12; elRx = -0.22 - reach * 0.12;
      hipL = 0.18 + e * 0.18; hipR = 0.18 + e * 0.18;
      kneeL = 0.18 + e * 0.62; kneeR = 0.18 + e * 0.62;
      torsoX = 0.06 - reach * 0.1;
    } else if (anim.type === 'steal') {
      torsoX = 0.4 * e;
      shLx = 0.16 + e * 1.3; shRx = 0.16 + e * 1.15;
      shLz = 0.05; shRz = -0.05;
      elLx = -0.2; elRx = -0.2;
      hipL = -0.35 * e; hipR = 0.45 * e;
      kneeL = 0.35 * e; kneeR = 0.3 * e;
    } else if (anim.type === 'body') {
      torsoX = 0.45 * e;
      shLx = 0.55 + e * 0.3; shRx = 0.55 + e * 0.3;
      shLz = 0.6; shRz = -0.6;
      elLx = -0.75; elRx = -0.75;
      kneeL = 0.3; kneeR = 0.3;
    } else if (anim.type === 'screen') {
      hipL = -0.28; hipR = 0.28;
      kneeL = 0.35; kneeR = 0.35;
      shLx = 0.15; shRx = 0.15;
      shLz = 1.15; shRz = -1.15;
      elLx = -0.3; elRx = -0.3;
    } else if (anim.type === 'blocked') {
      const recoil = Math.sin(Math.min(1, p * 1.45) * Math.PI * 0.5);
      rootRoll = e * 0.42;
      rootPitch = -recoil * 0.12;
      rootY += e * 0.08;
      shLx = 1.5 + e * 1.0; shRx = 1.25 + e * 1.15;
      shLz = 0.82; shRz = -0.68;
      elLx = -0.25 - e * 0.1; elRx = -0.3 - e * 0.12;
      hipL = 0.25 * e; hipR = -0.18 * e;
      kneeL = 0.2 + e * 0.38; kneeR = 0.18 + e * 0.28;
      torsoX = -0.18 - recoil * 0.12;
    } else if (anim.type === 'fall') {
      rootY += Math.sin(Math.min(1, p * 1.8) * Math.PI / 2) * 0.18;
      rootRoll = Math.sin(Math.min(1, p * 1.8) * Math.PI / 2) * 1.42;
      torsoX = -0.15;
      shLx = 1.4 + e * 1.2; shRx = 1.1 + e * 1.4;
      shLz = 0.9; shRz = -0.75;
      hipL = 0.4; hipR = -0.2;
      kneeL = 0.6; kneeR = 0.35;
    } else if (anim.type === 'celebrate') {
      rootY += Math.abs(Math.sin(p * Math.PI * 2)) * 0.2;
      shLx = 2.4 + Math.sin(p * Math.PI * 3) * 0.25;
      shRx = 2.55 + Math.cos(p * Math.PI * 3) * 0.25;
      shLz = 0.5; shRz = -0.5;
      elLx = -0.2; elRx = -0.2;
      torsoX = -0.08;
    }
  } else if (state.charging && active) {
    const c = state.charge;
    hipL = -0.25 - c * 0.1;
    hipR = 0.25 + c * 0.1;
    kneeL = 0.2 + c * 0.5;
    kneeR = 0.2 + c * 0.5;
    torsoX = 0.2 + c * 0.12;
    if (state.shotType === 'dunk') {
      shLx = 0.3 + c * 0.5; shRx = 0.4 + c * 0.6;
      shLz = 0.45; shRz = -0.45;
      elLx = -0.6; elRx = -0.6;
    } else {
      shLx = 0.16 + c * 1.65; shRx = 0.16 + c * 2.2;
      shLz = 0.12 + c * 0.5; shRz = -0.12 - c * 0.5;
      elLx = -0.28 - c * 0.6; elRx = -0.28 - c * 0.8;
    }
  } else if (a.team === 'home' && state.phase === 'defense') {
    const jump = a.contestTimer > 0 ? Math.sin((1 - Math.min(1, a.contestTimer / 0.6)) * Math.PI) * 0.15 : 0;
    rootY += jump;
    shLx = 0.4 + (a.contestTimer > 0 ? 2.1 : 0.1);
    shRx = 0.4 + (a.contestTimer > 0 ? 2.1 : 0.1);
    shLz = 0.45; shRz = -0.45;
    elLx = -0.35; elRx = -0.35;
    hipL = -0.16; hipR = 0.16;
    kneeL = 0.28; kneeR = 0.28;
    torsoX = 0.18;
  } else if (a.team === 'away' && state.phase === 'defense') {
    // rival with the ball
    const handler = state.away && state.away.handler === a;
    if (handler) {
      const dribble = Math.sin(t * 7.2 + a.phase);
      shLx = 0.3 + (dribble * 0.5 + 0.5) * 0.45;
      shRx = 0.35;
      shLz = 0.28; shRz = -0.28;
      elLx = -0.4 - (dribble * 0.5 + 0.5) * 0.25;
      torsoY = dribble * 0.08;
      torsoX = 0.12;
    } else {
      shLx = 0.35; shRx = 0.35;
      shLz = 0.4; shRz = -0.4;
      elLx = -0.45; elRx = -0.45;
      torsoX = 0.12;
    }
  } else if (a.team === 'away') {
    const up = !!state.shot || !!state.dunk || Math.hypot(a.x - activeActor().x, a.z - activeActor().z) < 2.2;
    const guard = up ? 1 : 0.2;
    shLx = 0.2 + guard * 2.1; shRx = 0.2 + guard * 2.1;
    shLz = 0.3; shRz = -0.3;
    elLx = -0.3; elRx = -0.3;
    hipL = -0.12; hipR = 0.12;
    kneeL = 0.25; kneeR = 0.25;
    torsoX = 0.12;
  }

  const blend = 1 - Math.exp(-dt * 18);
  legL.hip.rotation.x += (hipL - legL.hip.rotation.x) * blend;
  legR.hip.rotation.x += (hipR - legR.hip.rotation.x) * blend;
  legL.knee.rotation.x += (kneeL - legL.knee.rotation.x) * blend;
  legR.knee.rotation.x += (kneeR - legR.knee.rotation.x) * blend;
  armL.shoulder.rotation.x += (shLx - armL.shoulder.rotation.x) * blend;
  armR.shoulder.rotation.x += (shRx - armR.shoulder.rotation.x) * blend;
  armL.shoulder.rotation.z += (shLz - armL.shoulder.rotation.z) * blend;
  armR.shoulder.rotation.z += (shRz - armR.shoulder.rotation.z) * blend;
  armL.elbow.rotation.x += (elLx - armL.elbow.rotation.x) * blend;
  armR.elbow.rotation.x += (elRx - armR.elbow.rotation.x) * blend;
  rig.torso.rotation.x += (torsoX - rig.torso.rotation.x) * blend;
  rig.torso.rotation.y += (torsoY - rig.torso.rotation.y) * blend;
  rig.root.rotation.z += (rootRoll - rig.root.rotation.z) * Math.min(1, dt * 12);
  rig.root.rotation.x += (rootPitch - rig.root.rotation.x) * Math.min(1, dt * 12);

  rig.root.position.x = a.x;
  rig.root.position.z = a.z;
  rig.root.position.y += (0.012 + (rootY - 0.012) - rig.root.position.y) * Math.min(1, dt * 26);

  let fx, fz;
  if (state.dunk && state.dunk.actor === a) {
    fx = HOOP.x - a.x; fz = HOOP.z - a.z;
  } else if (a.team === 'home') {
    if (state.phase === 'defense') {
      const h = state.away && state.away.handler;
      const man = h || a.man;
      fx = (man ? man.x : ball.position.x) - a.x;
      fz = (man ? man.z : ball.position.z) - a.z;
    } else {
      fx = HOOP.x - a.x; fz = HOOP.z - a.z;
    }
  } else {
    if (state.phase === 'defense' && state.away && state.away.handler === a) {
      fx = HOOP.x - a.x; fz = HOOP.z - a.z;
    } else {
      const man = a.man || activeActor();
      fx = man.x - a.x; fz = man.z - a.z;
    }
  }
  if (state.rebound && a.team === 'home' && state.phase === 'offense') {
    fx = ball.position.x - a.x; fz = ball.position.z - a.z;
  }
  const targetRot = Math.atan2(-fx, -fz);
  rig.root.rotation.y = lerpAngle(rig.root.rotation.y, targetRot, Math.min(1, dt * 9));

  const ring = rig.ring;
  if (active) {
    ring.material.opacity = 0.3 + Math.sin(t * 4.5) * 0.09;
    ring.material.color.setHex(state.phase === 'defense' ? 0xff8f74 : HOME_COLOR);
  } else if (a.team === 'home') {
    ring.material.opacity = 0.18;
    ring.material.color.setHex(HOME_COLOR);
  }
}

function updateEffects(dt, t) {
  state.netPulse = Math.max(0, state.netPulse - dt * 2.3);
  {
    const arr = dustGeo.attributes.position.array;
    for (let i = 0; i < DUST_COUNT; i++) {
      arr[i * 3] += Math.sin(t * 0.3 + i) * dt * 0.03;
      arr[i * 3 + 1] += dt * 0.018;
      if (arr[i * 3 + 1] > 9.6) arr[i * 3 + 1] = 0.4;
    }
    dustGeo.attributes.position.needsUpdate = true;
  }
  hoopGlow.material.opacity = 0.2 + state.rimFlash * 0.5 + Math.sin(t * 2.6) * 0.03;
  ribbon.material.map.offset.x = (ribbon.material.map.offset.x + dt * 0.018) % 1;
  state.crowdPulse = Math.max(0, state.crowdPulse - dt * 1.4);
  state.cameraShake = Math.max(0, state.cameraShake - dt * 1.5);
  state.rimFlash = Math.max(0, state.rimFlash - dt * 3);
  netGroup.rotation.z = Math.sin(t * 34) * 0.22 * state.netPulse;
  netGroup.rotation.x = Math.cos(t * 27) * 0.15 * state.netPulse;
  netGroup.scale.y = 1 + state.netPulse * 0.16;
  netGroup.position.y = netBaseY - state.netPulse * 0.04;
  rimMat.emissiveIntensity = 0.65 + state.rimFlash * 3.4;
  crowdBodies.position.y = Math.sin(t * 24) * 0.035 * state.crowdPulse;
  crowdHeads.position.y = crowdBodies.position.y;
  if (pLife > 0) {
    pLife -= dt * 1.5;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pVel[i].y -= 7.5 * dt;
      pPositions[i * 3] += pVel[i].x * dt;
      pPositions[i * 3 + 1] += pVel[i].y * dt;
      pPositions[i * 3 + 2] += pVel[i].z * dt;
    }
    pGeo.attributes.position.needsUpdate = true;
    pMat.opacity = Math.max(0, pLife);
  } else {
    pMat.opacity = 0;
  }
  if (state.shotFeedback.timer > 0) {
    state.shotFeedback.timer -= dt;
    if (state.shotFeedback.timer <= 0) ui.feedback.classList.remove('show');
  }
}

/* ================================================================== */
/*  MAIN UPDATE                                                       */
/* ================================================================== */

function updateGame(dt, t) {
  if (state.mode === 'playing') {
    state.elapsed += dt;
    state.gameTime -= dt;
    state.shotClock -= dt;
    if (state.gameTime <= 0) {
      state.gameTime = 0;
      updateUI();
      endGame();
      return;
    }
    if (state.shotClock <= 0) {
      if (state.phase === 'defense') awayShotClockViolation();
      else shotClockViolation();
    }

    for (const a of actors) {
      if (a.anim) {
        a.anim.t += dt;
        if (a.anim.t >= a.anim.dur) a.anim = null;
      }
      a.moveCooldown = Math.max(0, a.moveCooldown - dt);
      a.contestCd = Math.max(0, (a.contestCd || 0) - dt);
      a.contestTimer = Math.max(0, (a.contestTimer || 0) - dt);
      a.stun = Math.max(0, (a.stun || 0) - dt);
      if (a.fall > 0) a.fall = Math.max(0, a.fall - dt);
    }

    updateActive(dt);
    const act = activeActor();
    for (const a of homeTeam.actors) {
      if (a !== act) updateHomeAI(a, dt, t);
    }
    for (let i = 0; i < awayTeam.actors.length; i++) updateAwayAI(awayTeam.actors[i], dt, t, i);
    separateActors();
    updatePressure(dt);

    if (state.charging && state.phase === 'offense') {
      state.charge += dt * 0.9 * state.chargeDir;
      if (state.charge >= 1) { state.charge = 1; state.chargeDir = -1; }
      else if (state.charge <= 0) { state.charge = 0; state.chargeDir = 1; }
    }
    if (state.screen && state.phase === 'offense') {
      state.screen.timer += dt;
      if (state.screen.set && state.screen.timer > 1.95) endScreen(true);
      else if (!state.screen.set && state.screen.timer > 3.8) { endScreen(true); showToast('SCREEN BROKEN', true); }
    }
    state.screenCooldown = Math.max(0, state.screenCooldown - dt);
    state.stepbackTimer = Math.max(0, state.stepbackTimer - dt);
    state.cutLock = Math.max(0, (state.cutLock || 0) - dt);
    state.passCooldown = Math.max(0, state.passCooldown - dt);
    state.stealCooldown = Math.max(0, state.stealCooldown - dt);
    state.switchCooldown = Math.max(0, state.switchCooldown - dt);
    if (state.blockAttempt) {
      state.blockAttempt.t += dt;
      if (state.blockAttempt.t > state.blockAttempt.dur) state.blockAttempt = null;
    }

    if (state.awayWindup) updateAwayWindup(dt);
    updateBall(dt, t);
    updateEffects(dt, t);
  } else {
    updateEffects(dt, t);
    if ((state.mode === 'menu' || state.mode === 'select') && teamsBuilt) updateBall(dt, t);
  }

  if (teamsBuilt && state.mode !== 'ended') {
    for (const a of actors) poseActor(a, dt, t);
  }
}

/* ================================================================== */
/*  CAMERA + 2D OVERLAYS                                              */
/* ================================================================== */

const camLook = new THREE.Vector3(0, 1.5, -5.5);
const proj = new THREE.Vector3();

function updateCamera(dt, t) {
  const desired = new THREE.Vector3();
  const look = new THREE.Vector3();
  let fovTarget = 55;
  if (state.mode === 'menu' || state.mode === 'select') {
    const a = Math.sin(t * 0.16) * 0.48;
    desired.set(Math.sin(a) * 10.8, 4.25, Math.cos(a) * 10.8 + 1.2);
    look.set(0, 1.35, -6.2);
  } else {
    const a = activeActor();
    if (!a) return;
    const portrait = window.innerHeight > window.innerWidth * 1.15;
    if (state.phase === 'defense') {
      desired.set(a.x * 0.42 + 0.85, portrait ? 7.7 : 6.55, a.z + (portrait ? 7.6 : 6.4));
      look.set(ball.position.x * 0.45, 0.75, ball.position.z - 2.5);
      fovTarget = 57;
    } else {
      desired.set(a.x * 0.5 + 1.18, (portrait ? 4.75 : 4.12) + state.charge * 0.2, a.z + (portrait ? 8.35 : 6.9));
      look.set(a.x * 0.36 + 0.1, 1.5 + (a.z < -6 ? 0.4 : 0), (a.z + HOOP.z) * 0.44 - 0.52);
      if (state.dunk) {
        desired.set(a.x * 0.3 + 0.4, 3.35, a.z + 5.2);
        look.set(HOOP.x, 2.55, HOOP.z + 0.4);
        fovTarget = 47;
      }
      if (state.shot && state.shot.phase === 'flight') look.lerp(ball.position, 0.3);
      if (state.pass) look.lerp(ball.position, 0.18);
      if (state.awayWindup) look.lerp(new THREE.Vector3(state.awayWindup.actor.x, 2.0, state.awayWindup.actor.z), 0.22);
    }
  }
  const k = 1 - Math.exp(-dt * (state.mode === 'menu' || state.mode === 'select' ? 1.5 : 6.2));
  camera.position.lerp(desired, k);
  camLook.lerp(look, Math.min(1, k * 1.3));
  camera.lookAt(camLook);
  state.camFov += (fovTarget - state.camFov) * Math.min(1, dt * 3.4);
  if (Math.abs(camera.fov - state.camFov) > 0.02) {
    camera.fov = state.camFov;
    camera.updateProjectionMatrix();
  }
  if (state.cameraShake > 0) {
    camera.position.x += (Math.random() - 0.5) * state.cameraShake;
    camera.position.y += (Math.random() - 0.5) * state.cameraShake;
    camera.position.z += (Math.random() - 0.5) * state.cameraShake * 0.6;
  }
}

function updateHUD3D() {
  const playing = state.mode === 'playing' && teamsBuilt;
  if (!playing) {
    ui.sideMeter.classList.remove('show');
    ui.feedback.classList.remove('show');
    ui.driveHint.classList.remove('show');
    ui.controlArrow.classList.remove('show');
    for (const a of actors) a.tag.classList.remove('show');
    return;
  }
  camera.updateMatrixWorld();
  const W = window.innerWidth, H = window.innerHeight;
  const ctrl = controlledActor();
  const busy = state.charging || !!state.shot || !!state.pass || !!state.dunk || !!state.rebound;
  let arrowShown = false;
  if (ctrl && !busy) {
    proj.set(ctrl.x, 2.34, ctrl.z).project(camera);
    if (proj.z < 1 && proj.x > -1.1 && proj.x < 1.1 && proj.y > -1.1 && proj.y < 1.1) {
      const ax = (proj.x * 0.5 + 0.5) * W;
      const ay = (-proj.y * 0.5 + 0.5) * H;
      ui.controlArrow.style.left = `${ax}px`;
      ui.controlArrow.style.top = `${ay}px`;
      arrowShown = true;
    }
  }
  ui.controlArrow.classList.toggle('show', arrowShown);

  for (const a of actors) {
    const height = 2.25 * a.rig.root.scale.y;
    proj.set(a.x, height, a.z).project(camera);
    if (proj.z > 1 || proj.x < -1.25 || proj.x > 1.25 || proj.y < -1.15 || proj.y > 1.2) {
      a.tag.classList.remove('show');
      continue;
    }
    const sx = (proj.x * 0.5 + 0.5) * W;
    const sy = (-proj.y * 0.5 + 0.5) * H;
    a.tag.style.left = `${sx}px`;
    a.tag.style.top = `${sy}px`;
    a.tag.classList.toggle('show', a !== ctrl && !state.charging);
    a.tag.classList.toggle('active', a === activeActor());
  }

  const act = activeActor();
  const dunking = state.shotType === 'dunk';
  const canDrive = state.phase === 'offense' && act && !state.charging && !state.shot && !state.pass &&
    !state.rebound && !state.dunk && distToHoop(act) < 3.1;
  ui.driveHint.classList.toggle('show', !!canDrive);

  if (state.charging && act && state.phase === 'offense') {
    const w = shotWindow(act);
    proj.set(act.x, 2.05, act.z).project(camera);
    let sx = (proj.x * 0.5 + 0.5) * W + 92;
    let sy = (-proj.y * 0.5 + 0.5) * H + 34;
    sx = Math.max(55, Math.min(W - 55, sx));
    sy = Math.max(185, Math.min(H - 135, sy));
    ui.sideMeter.style.left = `${sx}px`;
    ui.sideMeter.style.top = `${sy}px`;
    ui.sideMeter.classList.add('show');
    const contest = contestAmount(act);
    const quality = contest > 0.55 ? 'SMOTHERED' : contest > 0.24 ? 'CONTESTED' : 'OPEN';
    ui.smCaption.textContent = dunking ? 'DUNK' : 'SHOT';
    ui.smQuality.textContent = dunking ? 'RIM RUN · DUNK' : `${quality} · ${rangeLabel(distToHoop(act))}`;
    ui.smQuality.style.color = dunking ? '#ffd64b' : contest > 0.55 ? '#ff8068' : contest > 0.24 ? '#ffd64b' : '#d8ff3e';
    const bottomPct = (w.center - w.size / 2) * 100;
    const heightPct = Math.max(3, w.size * 100);
    ui.smWindow.style.bottom = `${bottomPct}%`;
    ui.smWindow.style.height = `${heightPct}%`;
    ui.smFill.style.height = `${Math.min(1, state.charge) * 100}%`;
    const inWindow = state.charge >= w.center - w.size / 2 && state.charge <= w.center + w.size / 2;
    ui.smLabel.textContent = inWindow ? (dunking ? 'TAKEOFF!' : 'GREEN!') : 'RELEASE';
    ui.smLabel.style.color = inWindow ? '#d8ff3e' : '#dfe8db';
  } else {
    ui.sideMeter.classList.remove('show');
  }

  if (state.shotFeedback.timer > 0 && act) {
    proj.set(act.x, 2.5 * act.rig.root.scale.y, act.z).project(camera);
    let sx = (proj.x * 0.5 + 0.5) * W;
    let sy = (-proj.y * 0.5 + 0.5) * H - 8;
    sx = Math.max(70, Math.min(W - 70, sx));
    sy = Math.max(120, Math.min(H - 120, sy));
    ui.feedback.style.left = `${sx}px`;
    ui.feedback.style.top = `${sy}px`;
    ui.feedback.classList.add('show');
  } else {
    ui.feedback.classList.remove('show');
  }
}

/* ================================================================== */
/*  LOOP + BOOT                                                       */
/* ================================================================== */

const clockLoop = new THREE.Clock();
const FIXED_STEP = 1 / 120;
let accumulator = 0;
let simT = 0;

function animate() {
  requestAnimationFrame(animate);
  const raw = Math.min(0.08, clockLoop.getDelta());
  accumulator = Math.min(0.14, accumulator + raw);
  let guard = 0;
  while (accumulator >= FIXED_STEP && guard++ < 18) {
    simT += FIXED_STEP;
    accumulator -= FIXED_STEP;
    updateGame(FIXED_STEP, simT);
  }
  updateCamera(raw, clockLoop.elapsedTime);
  updateHUD3D();
  updateUI();
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

camera.fov = 55;
camera.updateProjectionMatrix();

buildTeams(DEFAULT_HOME, DEFAULT_AWAY);
state.mode = 'menu';
state.phase = 'offense';
activeIndex = 0;
resetFormation(true);
setPhaseUI();
ui.time.textContent = '1:30';
ui.shot.textContent = '24';
ui.play.innerHTML = 'BUILD YOUR SQUAD <span class="arrow">↗</span>';
ui.change.classList.add('hidden');
hideSideMeter();
updateUI();
animate();

window.__cs = {
  start: () => startGame(homeStars.length ? homeStars : DEFAULT_HOME, awayStars.length ? awayStars : DEFAULT_AWAY),
  select: openSelect,
  pick: selectCard,
  next: () => ui.selectNext.click(),
  shoot: beginShot,
  release: releaseShot,
  pass: passBall,
  screen: callScreen,
  cross: crossover,
  step: stepBack,
  state: () => ({
    mode: state.mode, phase: state.phase, score: state.score, opp: state.opp,
    makes: state.makes, attempts: state.attempts,
    time: state.gameTime, shotClock: state.shotClock,
    charge: +state.charge.toFixed(2), charging: state.charging,
    shot: !!state.shot, pass: !!state.pass, rebound: !!state.rebound,
    dunk: !!state.dunk, shotType: state.shotType,
    awayShot: !!state.awayWindup, awayPass: !!state.awayPass,
    awayBlocked: !!(state.awayWindup && state.awayWindup.blocked),
    poster: !!(state.dunk && state.dunk.poster),
    contest: +(state.awayWindup ? state.awayWindup.contest : 0).toFixed(2),
    drop: !!(state.shot && state.shot.phase === 'drop'),
    marker: ui.controlArrow.classList.contains('show'),
    active: activeActor() ? activeActor().star.short : '',
    anim: activeActor() && activeActor().anim ? activeActor().anim.type : '',
    away: state.away && state.away.handler ? state.away.handler.star.short : '',
    ball: ball.position.toArray().map(n => +n.toFixed(2)),
    home: homeTeam.actors.map(a => [a.star.short, +a.x.toFixed(2), +a.z.toFixed(2), a.points, a.anim ? a.anim.type : '']),
    awayPos: awayTeam.actors.map(a => [a.star.short, +a.x.toFixed(2), +a.z.toFixed(2)]),
    window: +shotWindow().size.toFixed(3)
  }),
  goto: (x, z, who) => {
    const list = state.phase === 'defense' ? awayTeam.actors : homeTeam.actors;
    const a = who === 'away' ? awayTeam.actors[0] : controlledActor();
    if (a) { a.x = x; a.z = z; a.vx = a.vz = 0; if (state.away) { state.away.handler = a; ball.position.set(a.x + 0.4, 0.7, a.z + 0.2); } }
    return !!a;
  },
  giveAway: () => beginAwayPossession(awayTeam.actors[0], 'DEFEND'),
  miss: () => { if (state.shot) state.shot.made = false; },
  make: () => { if (state.shot) state.shot.made = true; },
  forceDunk: (poster = true) => {
    const a = activeActor();
    if (!a) return false;
    a.x = 0.55; a.z = -10.15; a.vx = a.vz = 0;
    if (poster) {
      const v = awayTeam.actors[0];
      v.x = 0.05; v.z = -11.05; v.vx = v.vz = 0;
    }
    state.shotType = 'dunk';
    state.charging = true;
    state.charge = 0.8;
    releaseDunk();
    return true;
  },
  contest: () => contestBlock(),
  end: () => endGame(),
  switchD: () => switchDefender(),
  steal: () => stealAttempt(),
  body: () => bodyCheck(),
  passTo: (i) => { const a = activeActor(); const m = homeTeam.actors[i]; if (!a || !m || m === a) return false; state.pass = { from: a, to: m, t: 0, dur: Math.max(0.2, Math.hypot(m.x - a.x, m.z - a.z) / 15), start: ball.position.clone() }; setAnim(a, 'pass', 0.38); setAnim(m, 'receive', 0.3); return true; }
};
