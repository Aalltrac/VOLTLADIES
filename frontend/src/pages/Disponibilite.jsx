import * as THREE from 'three';
import { OrbitControls }       from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment }     from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry }  from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer }      from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }          from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass }     from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass }          from 'three/addons/postprocessing/OutputPass.js';

/* ---------------------------------------------------------------------------
 *  1. CONSTANTES (équivalent du fichier scheduleConstants.js)
 * ------------------------------------------------------------------------- */
const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const TIME_SLOTS = ['08–10', '10–12', '12–14', '14–16', '16–18', '18–20', '20–22'];

const AVAILABILITY_STATES = [
  { key: 'available', label: 'Dispo',     color: 0x33e08a },
  { key: 'maybe',     label: 'Peut-être', color: 0xf5c451 },
  { key: 'busy',      label: 'Indispo',   color: 0xff3d6e },
  { key: 'away',      label: 'Absent',    color: 0x7d8aa8 },
];
const AVAILABILITY_BY_KEY = Object.fromEntries(AVAILABILITY_STATES.map(s => [s.key, s]));

/* ---------------------------------------------------------------------------
 *  2. DONNÉES (mock — à remplacer par Firebase onSnapshot dans le projet)
 * ------------------------------------------------------------------------- */
const MOCK_USERS = [
  { uid: 'u_alex',  pseudo: 'Alex',  color: 0xff3d8a },
  { uid: 'u_lena',  pseudo: 'Léna',  color: 0xb46cff },
  { uid: 'u_kim',   pseudo: 'Kim',   color: 0x4ad7ff },
  { uid: 'u_remy',  pseudo: 'Rémy',  color: 0xffb14a },
];

const state = {
  weekOffset:    0,
  weekId:        computeWeekId(0),
  selectedUid:   MOCK_USERS[0].uid,
  activeState:   'available',
  meUid:         MOCK_USERS[0].uid,
  availability:  seedAvailability(),
};

function seedAvailability() {
  const a = {};
  MOCK_USERS.forEach(u => {
    a[u.uid] = {};
    DAY_KEYS.forEach(d => {
      TIME_SLOTS.forEach(s => {
        if (Math.random() < 0.35) {
          const k = AVAILABILITY_STATES[Math.floor(Math.random() * AVAILABILITY_STATES.length)].key;
          a[u.uid][`${d}-${s}`] = k;
        }
      });
    });
  });
  return a;
}

function computeWeekId(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset * 7);
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

/* ---------------------------------------------------------------------------
 *  3. RENDERER / SCENE / CAMERA / LIGHTS / ENV
 * ------------------------------------------------------------------------- */
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
renderer.toneMapping       = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace  = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07060b);
scene.fog        = new THREE.FogExp2(0x07060b, 0.018);

// PMREM pour l'env-map PBR
const pmrem    = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 11, 16);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping  = true;
controls.dampingFactor  = 0.06;
controls.target.set(0, 1.2, 0);
controls.minDistance    = 8;
controls.maxDistance    = 28;
controls.maxPolarAngle  = Math.PI * 0.49;

// ----- Lumières -----
const hemi = new THREE.HemisphereLight(0x9bb6ff, 0x1a0a1f, 0.45);
scene.add(hemi);

const key = new THREE.DirectionalLight(0xfff4e8, 2.6);
key.position.set(7, 14, 6);
key.castShadow             = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near     = 1;
key.shadow.camera.far      = 40;
key.shadow.camera.left     = -14;
key.shadow.camera.right    =  14;
key.shadow.camera.top      =  14;
key.shadow.camera.bottom   = -14;
key.shadow.bias            = -0.00018;
key.shadow.normalBias      = 0.02;
key.shadow.radius          = 4;
scene.add(key);

const rimPink = new THREE.PointLight(0xff2d75, 60, 22, 2);
rimPink.position.set(-8, 4, -6);
scene.add(rimPink);

const rimBlue = new THREE.PointLight(0x4cc8ff, 35, 22, 2);
rimBlue.position.set(8, 3, -7);
scene.add(rimBlue);

// Subtil tube néon décoratif derrière la scène
{
  const neon = new THREE.Mesh(
    new THREE.TorusGeometry(7.5, 0.04, 16, 200, Math.PI),
    new THREE.MeshBasicMaterial({ color: 0xff2d75 })
  );
  neon.rotation.x = Math.PI / 2;
  neon.position.set(0, 0.05, -7.5);
  scene.add(neon);
}

/* ---------------------------------------------------------------------------
 *  4. SOL réflectif PBR
 * ------------------------------------------------------------------------- */
{
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshPhysicalMaterial({
      color:        0x0d0a14,
      metalness:    0.85,
      roughness:    0.32,
      clearcoat:    1.0,
      clearcoatRoughness: 0.18,
      reflectivity: 0.6,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Damier subtil pour ancrer la perspective sans casser le PBR
  const grid = new THREE.GridHelper(80, 80, 0x1a1320, 0x110a18);
  grid.position.y = 0.001;
  grid.material.transparent = true;
  grid.material.opacity     = 0.25;
  scene.add(grid);
}

/* ---------------------------------------------------------------------------
 *  5. UTILITAIRES — labels via CanvasTexture (anti-alias, lisibles, sans loader)
 * ------------------------------------------------------------------------- */
function makeLabelTexture(text, {
  width = 512, height = 128,
  color = '#ffffff', font = '600 64px "Inter","Helvetica Neue",Arial,sans-serif',
  align = 'center', bg = 'rgba(0,0,0,0)', glow = null,
} = {}) {
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);
  ctx.font = font;
  ctx.textBaseline = 'middle';
  ctx.textAlign = align;
  if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 24; }
  ctx.fillStyle = color;
  const x = align === 'center' ? width / 2 : (align === 'right' ? width - 16 : 16);
  ctx.fillText(text, x, height / 2);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makeLabelMesh(text, opts = {}) {
  const {
    width = 2.4, height = 0.6,
    canvasW = 512, canvasH = 128,
    color = '#ffffff', font, align,
    glow = null, emissive = 0x000000, emissiveIntensity = 0,
  } = opts;
  const tex = makeLabelTexture(text, { width: canvasW, height: canvasH, color, font, align, glow });
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    transparent: true,
    metalness: 0,
    roughness: 1,
    emissive: new THREE.Color(emissive),
    emissiveMap: tex,
    emissiveIntensity,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
  return mesh;
}

/* ---------------------------------------------------------------------------
 *  6. CADRE / SOCLE de la grille (brushed metal)
 * ------------------------------------------------------------------------- */
const GRID_COLS  = DAY_KEYS.length;            // 7
const GRID_ROWS  = TIME_SLOTS.length;          // 7
const CELL_SIZE  = 1.05;
const CELL_GAP   = 0.06;
const CELL_DEPTH = 0.42;

const gridGroup = new THREE.Group();
scene.add(gridGroup);

const totalW = GRID_COLS * CELL_SIZE + (GRID_COLS - 1) * CELL_GAP;
const totalH = GRID_ROWS * CELL_SIZE + (GRID_ROWS - 1) * CELL_GAP;

// Socle / plateau
{
  const padX = 1.6, padZ = 1.6, deck = 0.18;
  const deckGeo = new RoundedBoxGeometry(totalW + padX, deck, totalH + padZ, 6, 0.18);
  const deckMat = new THREE.MeshPhysicalMaterial({
    color:     0x161019,
    metalness: 0.9,
    roughness: 0.35,
    clearcoat: 0.6,
    clearcoatRoughness: 0.4,
  });
  const deckMesh = new THREE.Mesh(deckGeo, deckMat);
  deckMesh.position.y = deck / 2;
  deckMesh.receiveShadow = true;
  deckMesh.castShadow    = true;
  gridGroup.add(deckMesh);

  // Liseré néon tout autour du plateau
  const edgeGeo = new THREE.BoxGeometry(totalW + padX + 0.02, 0.012, totalH + padZ + 0.02);
  const edgeMat = new THREE.MeshBasicMaterial({ color: 0xff2d75 });
  const edge = new THREE.Mesh(edgeGeo, edgeMat);
  edge.position.y = deck + 0.001;
  gridGroup.add(edge);
}

/* ---------------------------------------------------------------------------
 *  7. CELLULES de la grille — RoundedBox PBR « verre teinté »
 * ------------------------------------------------------------------------- */
const cellGeo = new RoundedBoxGeometry(CELL_SIZE, CELL_DEPTH, CELL_SIZE, 4, 0.12);
const cells = []; // { mesh, day, slot, baseY, targetY, currentColor }

const baseY = 0.18 + CELL_DEPTH / 2 + 0.005;

for (let r = 0; r < GRID_ROWS; r++) {
  for (let c = 0; c < GRID_COLS; c++) {
    const mat = new THREE.MeshPhysicalMaterial({
      color:               0x1d1622,
      metalness:           0.15,
      roughness:           0.28,
      clearcoat:           1.0,
      clearcoatRoughness:  0.08,
      transmission:        0.15,
      thickness:           0.4,
      ior:                 1.35,
      emissive:            new THREE.Color(0x000000),
      emissiveIntensity:   0.0,
    });
    const mesh = new THREE.Mesh(cellGeo, mat);
    mesh.castShadow    = true;
    mesh.receiveShadow = true;

    const x = -totalW / 2 + CELL_SIZE / 2 + c * (CELL_SIZE + CELL_GAP);
    const z = -totalH / 2 + CELL_SIZE / 2 + r * (CELL_SIZE + CELL_GAP);
    mesh.position.set(x, baseY, z);

    mesh.userData = {
      kind: 'cell',
      day:  DAY_KEYS[c],
      slot: TIME_SLOTS[r],
      cellKey: `${DAY_KEYS[c]}-${TIME_SLOTS[r]}`,
    };

    gridGroup.add(mesh);
    cells.push({ mesh, mat, baseY, targetY: baseY, hovered: false });
  }
}

/* ---------------------------------------------------------------------------
 *  8. Labels : entête « Disponibilité », week-id, jours, créneaux
 * ------------------------------------------------------------------------- */
const headerGroup = new THREE.Group();
scene.add(headerGroup);

// Sous-titre — "État de la team"
{
  const t = makeLabelMesh('— ÉTAT DE LA TEAM —', {
    width: 4.2, height: 0.34, canvasW: 1024, canvasH: 96,
    color: '#ff8fb5', font: '500 42px "Inter",Arial', glow: '#ff2d75',
    emissive: 0xff2d75, emissiveIntensity: 0.9,
  });
  t.position.set(0, 4.55, -totalH / 2 - 0.4);
  t.rotation.x = -Math.PI / 12;
  headerGroup.add(t);
}

// Titre principal — « Disponibilité »
{
  const t = makeLabelMesh('Disponibilité', {
    width: 6.5, height: 1.1, canvasW: 1280, canvasH: 256,
    color: '#ffffff', font: '700 160px "Inter",Arial', glow: '#ffffff',
    emissive: 0xffffff, emissiveIntensity: 0.35,
  });
  t.position.set(0, 3.7, -totalH / 2 - 0.4);
  t.rotation.x = -Math.PI / 12;
  headerGroup.add(t);
}

// Pastille week-id
const weekLabel = makeLabelMesh(state.weekId, {
  width: 1.8, height: 0.5, canvasW: 512, canvasH: 144,
  color: '#ffffff', font: '600 72px "JetBrains Mono","Menlo",monospace',
  emissive: 0xff2d75, emissiveIntensity: 0.6,
});
weekLabel.position.set(0, 2.9, -totalH / 2 - 0.4);
weekLabel.rotation.x = -Math.PI / 12;
headerGroup.add(weekLabel);

// Jours (au-dessus de chaque colonne)
for (let c = 0; c < GRID_COLS; c++) {
  const x = -totalW / 2 + CELL_SIZE / 2 + c * (CELL_SIZE + CELL_GAP);
  const dayMesh = makeLabelMesh(DAYS[c].toUpperCase(), {
    width: CELL_SIZE * 1.1, height: 0.22, canvasW: 320, canvasH: 64,
    color: '#ffd6e5', font: '600 36px "Inter",Arial',
    emissive: 0xff2d75, emissiveIntensity: 0.4,
  });
  dayMesh.position.set(x, 0.22, -totalH / 2 - 0.45);
  dayMesh.rotation.x = -Math.PI / 2.4;
  scene.add(dayMesh);
}

// Créneaux horaires (à gauche de chaque ligne)
for (let r = 0; r < GRID_ROWS; r++) {
  const z = -totalH / 2 + CELL_SIZE / 2 + r * (CELL_SIZE + CELL_GAP);
  const slotMesh = makeLabelMesh(TIME_SLOTS[r], {
    width: 0.95, height: 0.28, canvasW: 320, canvasH: 96,
    color: '#cdd2e0', font: '500 56px "JetBrains Mono","Menlo",monospace',
  });
  slotMesh.position.set(-totalW / 2 - 0.85, 0.22, z);
  slotMesh.rotation.x = -Math.PI / 2;
  scene.add(slotMesh);
}

/* ---------------------------------------------------------------------------
 *  9. Flèches semaine (gauche / droite) — boutons 3D interactifs
 * ------------------------------------------------------------------------- */
function makeArrowButton(direction = 1) {
  const g = new THREE.Group();

  // Plaque arrière
  const plate = new THREE.Mesh(
    new RoundedBoxGeometry(0.9, 0.9, 0.18, 4, 0.18),
    new THREE.MeshPhysicalMaterial({
      color: 0x1c1422, metalness: 0.85, roughness: 0.28,
      clearcoat: 1, clearcoatRoughness: 0.08,
      emissive: new THREE.Color(0xff2d75), emissiveIntensity: 0.0,
    })
  );
  plate.castShadow = plate.receiveShadow = true;
  g.add(plate);

  // Flèche extrudée
  const shape = new THREE.Shape();
  if (direction > 0) {
    shape.moveTo(-0.18, -0.22);
    shape.lineTo( 0.22,  0.0);
    shape.lineTo(-0.18,  0.22);
    shape.lineTo(-0.06,  0.0);
  } else {
    shape.moveTo( 0.18, -0.22);
    shape.lineTo(-0.22,  0.0);
    shape.lineTo( 0.18,  0.22);
    shape.lineTo( 0.06,  0.0);
  }
  shape.closePath();
  const arrow = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2 }),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff, metalness: 0.4, roughness: 0.25,
      emissive: new THREE.Color(0xff7aa8), emissiveIntensity: 0.6,
    })
  );
  arrow.position.z = 0.12;
  arrow.castShadow = true;
  g.add(arrow);

  g.userData = { kind: 'weekNav', dir: direction, plate };
  return g;
}

const arrowL = makeArrowButton(-1);
arrowL.position.set(-1.6, 1.1, -totalH / 2 - 0.6);
arrowL.rotation.x = -Math.PI / 12;
scene.add(arrowL);

const arrowR = makeArrowButton(+1);
arrowR.position.set(+1.6, 1.1, -totalH / 2 - 0.6);
arrowR.rotation.x = -Math.PI / 12;
scene.add(arrowR);

/* ---------------------------------------------------------------------------
 *  10. Sélecteur de membre — capsules 3D « pills »
 * ------------------------------------------------------------------------- */
const memberPills = [];

function makeMemberPill(user, idx) {
  const g = new THREE.Group();

  const w = 1.7, h = 0.46, d = 0.22;
  const body = new THREE.Mesh(
    new RoundedBoxGeometry(w, h, d, 6, h / 2),
    new THREE.MeshPhysicalMaterial({
      color: 0x18121e, metalness: 0.7, roughness: 0.3,
      clearcoat: 1, clearcoatRoughness: 0.1,
      emissive: new THREE.Color(user.color), emissiveIntensity: 0.0,
    })
  );
  body.castShadow = body.receiveShadow = true;
  g.add(body);

  // Pastille couleur de l'utilisateur
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 24, 24),
    new THREE.MeshPhysicalMaterial({
      color: user.color, metalness: 0.2, roughness: 0.25,
      emissive: new THREE.Color(user.color), emissiveIntensity: 0.9,
    })
  );
  dot.position.set(-w / 2 + 0.22, 0, d / 2 + 0.001);
  g.add(dot);

  // Label pseudo
  const label = makeLabelMesh(user.pseudo + (user.uid === state.meUid ? ' · moi' : ''), {
    width: 1.15, height: 0.3, canvasW: 512, canvasH: 128,
    color: '#ffffff', font: '600 64px "Inter",Arial', align: 'left',
  });
  label.position.set(-0.05, 0, d / 2 + 0.005);
  g.add(label);

  g.userData = { kind: 'memberPill', uid: user.uid, body, baseColor: user.color };
  return g;
}

{
  const totalPills = MOCK_USERS.length;
  const gap = 0.18;
  const pillW = 1.7;
  const totalRowW = totalPills * pillW + (totalPills - 1) * gap;
  for (let i = 0; i < totalPills; i++) {
    const pill = makeMemberPill(MOCK_USERS[i], i);
    const x = -totalRowW / 2 + pillW / 2 + i * (pillW + gap);
    pill.position.set(x, 0.45, totalH / 2 + 0.95);
    pill.rotation.x = -Math.PI / 18;
    scene.add(pill);
    memberPills.push(pill);
  }
}

/* ---------------------------------------------------------------------------
 *  11. Sélecteur d'état — boutons 3D
 * ------------------------------------------------------------------------- */
const stateButtons = [];

function makeStateButton(stateDef, idx) {
  const g = new THREE.Group();
  const w = 1.55, h = 0.5, d = 0.22;

  const body = new THREE.Mesh(
    new RoundedBoxGeometry(w, h, d, 6, 0.14),
    new THREE.MeshPhysicalMaterial({
      color: 0x140f19, metalness: 0.75, roughness: 0.32,
      clearcoat: 1, clearcoatRoughness: 0.12,
      emissive: new THREE.Color(stateDef.color), emissiveIntensity: 0.0,
    })
  );
  body.castShadow = body.receiveShadow = true;
  g.add(body);

  // Petit cube témoin de couleur
  const swatch = new THREE.Mesh(
    new RoundedBoxGeometry(0.18, 0.18, 0.18, 3, 0.04),
    new THREE.MeshPhysicalMaterial({
      color: stateDef.color, metalness: 0.4, roughness: 0.2,
      emissive: new THREE.Color(stateDef.color), emissiveIntensity: 1.4,
    })
  );
  swatch.position.set(-w / 2 + 0.2, 0, d / 2 + 0.001);
  g.add(swatch);

  const label = makeLabelMesh(stateDef.label.toUpperCase(), {
    width: 1.05, height: 0.28, canvasW: 512, canvasH: 128,
    color: '#ffffff', font: '700 60px "Inter",Arial', align: 'left',
  });
  label.position.set(-0.0, 0, d / 2 + 0.005);
  g.add(label);

  g.userData = { kind: 'stateBtn', key: stateDef.key, body, color: stateDef.color };
  return g;
}

{
  const total = AVAILABILITY_STATES.length;
  const gap = 0.16, btnW = 1.55;
  const totalW2 = total * btnW + (total - 1) * gap;
  for (let i = 0; i < total; i++) {
    const b = makeStateButton(AVAILABILITY_STATES[i], i);
    const x = -totalW2 / 2 + btnW / 2 + i * (btnW + gap);
    b.position.set(x, 0.45, totalH / 2 + 2.05);
    b.rotation.x = -Math.PI / 16;
    scene.add(b);
    stateButtons.push(b);
  }

  // Petit label "Action :"
  const lbl = makeLabelMesh('ACTION', {
    width: 0.75, height: 0.22, canvasW: 256, canvasH: 80,
    color: '#a0a8bf', font: '600 44px "Inter",Arial',
  });
  lbl.position.set(-totalW2 / 2 - 0.7, 0.45, totalH / 2 + 2.05);
  lbl.rotation.x = -Math.PI / 16;
  scene.add(lbl);
}

/* ---------------------------------------------------------------------------
 *  12. Particules ambiantes (poussière néon)
 * ------------------------------------------------------------------------- */
{
  const N = 380;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i*3+0] = (Math.random() - 0.5) * 30;
    pos[i*3+1] =  Math.random() * 8 + 0.5;
    pos[i*3+2] = (Math.random() - 0.5) * 22;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xff6fa3, size: 0.04, transparent: true, opacity: 0.6,
    depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  pts.userData.tick = (dt) => {
    const a = geo.attributes.position;
    for (let i = 0; i < a.count; i++) {
      a.array[i*3+1] += dt * 0.08;
      if (a.array[i*3+1] > 8) a.array[i*3+1] = 0.5;
    }
    a.needsUpdate = true;
  };
  scene.userData.particles = pts;
}

/* ---------------------------------------------------------------------------
 *  13. POSTPROCESS — Bloom subtil pour les émissifs néon
 * ------------------------------------------------------------------------- */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.55, 0.6, 0.85
);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ---------------------------------------------------------------------------
 *  14. APPLICATION DES ÉTATS sur les cellules (visuel)
 * ------------------------------------------------------------------------- */
function refreshCells() {
  const userSlots = state.availability[state.selectedUid] || {};
  const isMine    = state.selectedUid === state.meUid;

  cells.forEach(c => {
    const key = c.mesh.userData.cellKey;
    const stKey = userSlots[key];
    const def   = stKey ? AVAILABILITY_BY_KEY[stKey] : null;

    if (def) {
      c.mat.color.setHex(def.color).multiplyScalar(0.55);
      c.mat.emissive.setHex(def.color);
      c.mat.emissiveIntensity = 0.85;
      c.mat.transmission = 0.0;
      c.mat.roughness = 0.22;
    } else {
      c.mat.color.setHex(0x1d1622);
      c.mat.emissive.setHex(0x000000);
      c.mat.emissiveIntensity = 0.0;
      c.mat.transmission = 0.15;
      c.mat.roughness = 0.28;
    }
    c.mesh.userData.editable = isMine;
  });
}

function refreshMembers() {
  memberPills.forEach(p => {
    const isSel = p.userData.uid === state.selectedUid;
    const m = p.userData.body.material;
    m.emissiveIntensity = isSel ? 0.9 : 0.0;
    m.color.setHex(isSel ? 0x2a1c2e : 0x18121e);
  });
}

function refreshStates() {
  stateButtons.forEach(b => {
    const isSel = b.userData.key === state.activeState;
    const m = b.userData.body.material;
    m.emissiveIntensity = isSel ? 1.1 : 0.0;
    m.color.setHex(isSel ? 0x241825 : 0x140f19);
  });
}

function refreshWeekLabel() {
  const newTex = makeLabelTexture(state.weekId, {
    width: 512, height: 144, color: '#ffffff',
    font: '600 72px "JetBrains Mono","Menlo",monospace',
  });
  weekLabel.material.map.dispose();
  weekLabel.material.map = newTex;
  weekLabel.material.emissiveMap = newTex;
  weekLabel.material.needsUpdate = true;
}

refreshCells();
refreshMembers();
refreshStates();

/* ---------------------------------------------------------------------------
 *  15. INTERACTION — Raycaster (hover + clic)
 * ------------------------------------------------------------------------- */
const raycaster = new THREE.Raycaster();
const pointer   = new THREE.Vector2();
let hovered     = null;
let pickPool    = [];

function rebuildPickPool() {
  pickPool = [
    ...cells.map(c => c.mesh),
    ...memberPills.map(p => p.userData.body),
    ...stateButtons.map(b => b.userData.body),
    arrowL.userData.plate, arrowR.userData.plate,
  ];
}
rebuildPickPool();

function onPointerMove(e) {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
}
window.addEventListener('pointermove', onPointerMove);

function findInteractive(obj) {
  // Remonte au parent qui porte un userData.kind
  let n = obj;
  while (n && !n.userData?.kind) n = n.parent;
  return n;
}

function onClick() {
  if (!hovered) return;
  const ud = hovered.userData;

  if (ud.kind === 'cell' && ud.editable) {
    const slots = state.availability[state.selectedUid] || (state.availability[state.selectedUid] = {});
    if (slots[ud.cellKey] === state.activeState) delete slots[ud.cellKey];
    else slots[ud.cellKey] = state.activeState;
    refreshCells();
    // ─── Hook Firebase :
    // dataApi.setSlot(state.weekId, state.meUid, ud.cellKey, slots[ud.cellKey] || null);
  }
  else if (ud.kind === 'memberPill') {
    state.selectedUid = ud.uid;
    refreshMembers();
    refreshCells();
  }
  else if (ud.kind === 'stateBtn') {
    state.activeState = ud.key;
    refreshStates();
  }
  else if (ud.kind === 'weekNav') {
    state.weekOffset += ud.dir;
    state.weekId = computeWeekId(state.weekOffset);
    refreshWeekLabel();
    // ─── Hook Firebase : recharger availability pour weekId
  }
}
window.addEventListener('click', onClick);

/* ---------------------------------------------------------------------------
 *  16. BOUCLE D'ANIMATION
 * ------------------------------------------------------------------------- */
const clock = new THREE.Clock();

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t  = clock.elapsedTime;

  // Hover detection
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(pickPool, false);
  const newHovered = hits.length ? findInteractive(hits[0].object) : null;

  if (newHovered !== hovered) {
    hovered = newHovered;
    document.body.style.cursor = hovered ? 'pointer' : 'default';
  }

  // Cellules : levée + glow au survol, retour à la base sinon
  cells.forEach(c => {
    const isHover = hovered && hovered === c.mesh && c.mesh.userData.editable;
    c.targetY = c.baseY + (isHover ? 0.18 : 0.0);
    c.mesh.position.y += (c.targetY - c.mesh.position.y) * Math.min(1, dt * 14);

    if (isHover) {
      c.mat.emissiveIntensity = THREE.MathUtils.lerp(
        c.mat.emissiveIntensity, Math.max(c.mat.emissiveIntensity, 0.6), 0.2
      );
      // Si vide, prévisualise la couleur de l'état actif
      const slots = state.availability[state.selectedUid] || {};
      if (!slots[c.mesh.userData.cellKey]) {
        const def = AVAILABILITY_BY_KEY[state.activeState];
        c.mat.emissive.setHex(def.color);
        c.mat.emissiveIntensity = 0.45;
      }
    } else if (!(state.availability[state.selectedUid] || {})[c.mesh.userData.cellKey]) {
      // Vide → réinitialise l'émission
      c.mat.emissive.setHex(0x000000);
      c.mat.emissiveIntensity = 0.0;
    }
  });

  // Member pills : léger flottement + emphase si survol
  memberPills.forEach((p, i) => {
    const isSel = p.userData.uid === state.selectedUid;
    const isHover = hovered === p.userData.body;
    const targetY = 0.45 + Math.sin(t * 1.4 + i) * 0.025 + (isHover ? 0.12 : 0);
    p.position.y += (targetY - p.position.y) * Math.min(1, dt * 8);
    p.userData.body.material.emissiveIntensity = THREE.MathUtils.lerp(
      p.userData.body.material.emissiveIntensity,
      isSel ? 0.9 : (isHover ? 0.5 : 0.0),
      0.15
    );
  });

  // State buttons : pulse si actif, soulèvement au hover
  stateButtons.forEach(b => {
    const isSel = b.userData.key === state.activeState;
    const isHover = hovered === b.userData.body;
    const tgtY = 0.45 + (isHover ? 0.1 : 0) + (isSel ? Math.sin(t * 4) * 0.02 : 0);
    b.position.y += (tgtY - b.position.y) * Math.min(1, dt * 8);
    b.userData.body.material.emissiveIntensity = THREE.MathUtils.lerp(
      b.userData.body.material.emissiveIntensity,
      isSel ? 1.1 + Math.sin(t * 5) * 0.1 : (isHover ? 0.55 : 0.0),
      0.2
    );
  });

  // Arrows : hover glow
  [arrowL, arrowR].forEach(a => {
    const isHover = hovered === a.userData.plate;
    a.userData.plate.material.emissiveIntensity = THREE.MathUtils.lerp(
      a.userData.plate.material.emissiveIntensity, isHover ? 0.8 : 0.0, 0.15
    );
    const tgtY = 1.1 + (isHover ? 0.08 : 0);
    a.position.y += (tgtY - a.position.y) * Math.min(1, dt * 10);
  });

  // Particules
  scene.userData.particles?.userData.tick(dt);

  // Subtile oscillation des rim-lights pour donner de la vie
  rimPink.intensity = 50 + Math.sin(t * 0.8) * 10;
  rimBlue.intensity = 28 + Math.sin(t * 0.6 + 1.5) * 8;

  controls.update();
  composer.render();
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

/* ---------------------------------------------------------------------------
 *  17. RESIZE
 * ------------------------------------------------------------------------- */
window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  bloom.setSize(w, h);
});

/* ---------------------------------------------------------------------------
 *  18. API d'intégration projet (à brancher sur Firebase dans ton code)
 * ---------------------------------------------------------------------------
 *  Remplace les fonctions mock ci-dessous par les abonnements Firestore :
 *
 *    onSnapshot(collection(db, 'users'), ...)            → met à jour MOCK_USERS
 *    onSnapshot(collection(db, 'availability', weekId,
 *                          'users'), ...)                → met à jour state.availability
 *    setDoc(doc(db, 'availability', weekId, 'users',
 *               user.uid), { slots: { [key]: stateKey } },
 *           { merge: true })                             → dans dataApi.setSlot
 *
 *  Ensuite appelle refreshCells() / refreshMembers() / refreshWeekLabel()
 *  pour synchroniser le rendu 3D.
 * ------------------------------------------------------------------------- */
export const dataApi = {
  setSlot(weekId, uid, cellKey, stateKey) {
    // À implémenter côté projet :
    // const ref = doc(db, 'availability', weekId, 'users', uid);
    // return setDoc(ref, { slots: { [cellKey]: stateKey } }, { merge: true });
  },
};
