// @ts-nocheck
// Three.js scene for the Breakpoint London Starter Pack game.
// Pure imperative three.js, mounted by components/Game.tsx.
import * as THREE from "three";
import { ITEMS, ICON_PATHS, NPC_LINES } from "./items";

export type EngineHooks = {
  labelsEl: HTMLElement;
  displayFont: string; // CSS font-family used for signs drawn on canvas
  characterUrl?: string; // optional rigged .glb, e.g. /models/attendee.glb
  crowdUrl?: string; // optional .glb for the crowd, recoloured per person by material name
  isPaused: () => boolean; // true while the final overlay is open
  onCollect: (index: number) => void;
  onTalk?: () => void; // fired the first time each NPC speaks
};

export type EngineApi = {
  guide: () => void;
  zoomBy: (factor: number) => void;
  resetView: () => void;
  reset: () => void;
  destroy: () => void;
};

export function startGame(stage: HTMLElement, hooks: EngineHooks): EngineApi {
  const N = ITEMS.length;
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const got = new Set<number>();
  const disposers: Array<() => void> = [];
  const on = (t, ev, fn, opt?) => { t.addEventListener(ev, fn, opt); disposers.push(() => t.removeEventListener(ev, fn, opt)); };

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#E9E6DF");
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 500);
  const CAMDIR = new THREE.Vector3(1, 0.95, 1).normalize();
  const LOOK = new THREE.Vector3(0, 5, 0);
  camera.position.copy(LOOK).addScaledVector(CAMDIR, 160);
  camera.lookAt(LOOK);

  // three r155+ uses physical light units, hence the PI factor
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb9b2a4, 0.55 * Math.PI));
  const sun = new THREE.DirectionalLight(0xfff1dc, 0.62 * Math.PI);
  sun.position.set(-30, 70, 40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -65, right: 65, top: 65, bottom: -65, near: 1, far: 200 });
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  const cache = {};
  const M = (c) => cache[c] || (cache[c] = new THREE.MeshLambertMaterial({ color: c }));
  const U = (c) => new THREE.MeshBasicMaterial({ color: c });
  function B(w, h, d, mat, x, y, z, parent?) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof mat === "string" ? M(mat) : mat); m.position.set(x, y, z); (parent || scene).add(m); return m; }
  function Cy(rt, rb, h, mat, x, y, z, parent?, seg?) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 14), typeof mat === "string" ? M(mat) : mat); m.position.set(x, y, z); (parent || scene).add(m); return m; }
  function signTex(text, bg, fg, ratio) {
    const c = document.createElement("canvas"); c.width = 1024; c.height = Math.max(64, Math.round(1024 * ratio));
    const x = c.getContext("2d"); x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height);
    let fs = c.height * 0.5; const f = () => (x.font = `800 ${fs}px ${hooks.displayFont}, "Arial Black", sans-serif`); f();
    while (x.measureText(text).width > c.width * 0.86 && fs > 10) { fs -= 4; f(); }
    x.fillStyle = fg; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, c.width / 2, c.height / 2);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function sign(text, bg, fg, w, h, x, y, z, parent?) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: signTex(text, bg, fg, h / w) })); m.position.set(x, y, z); (parent || scene).add(m); return m; }

  // ---- Board ----
  const BW = 88, BD = 64;
  B(BW + 1.2, 1.6, BD + 1.2, "#1F2A2E", 0, -1.1, 0);
  B(BW, 2, BD, "#F3EFE7", 0, -1.0, 0);
  const ground = B(BW, 0.1, BD, "#E6DCC8", 0, -0.05, 0);
  const RZ = 4;
  const water = B(BW, 0.1, RZ * 2, "#9DBBC6", 0, -0.02, 0);
  B(BW, 0.25, 0.5, "#C9C0AE", 0, 0.08, -RZ - 0.25); B(BW, 0.25, 0.5, "#C9C0AE", 0, 0.08, RZ + 0.25);
  const ripples = []; for (let i = 0; i < 14; i++) ripples.push(B(1.6 + Math.random() * 1.8, 0.02, 0.18, U("#C7DCE3"), -40 + i * 6.2, 0.05, -2.6 + Math.random() * 5.2));
  B(BW, 0.06, 3.6, "#C5D0D6", 0, 0.02, 7.6); B(BW, 0.06, 3.6, "#C5D0D6", 0, 0.02, -7.6);
  for (let x = -42; x < 42; x += 4) { B(1.8, 0.02, 0.16, U("#F4F2EC"), x, 0.07, 7.6); B(1.8, 0.02, 0.16, U("#F4F2EC"), x + 2, 0.07, -7.6); }
  B(14, 0.08, 8, "#B9CBB0", -2, 0.03, -24); B(10, 0.08, 9, "#B9CBB0", -35, 0.03, 22); B(8, 0.08, 6, "#B9CBB0", 8, 0.03, 25);

  function tree(x, z, s = 1) { Cy(0.18 * s, 0.24 * s, 1.4 * s, "#8B6F52", x, 0.7 * s, z); const c = new THREE.Mesh(new THREE.SphereGeometry(1.2 * s, 12, 10), M("#7E9C8C")); c.position.set(x, 2.1 * s, z); c.scale.y = 1.15; scene.add(c); }
  [[-6, -22], [2, -26], [-8, -26], [4, -22], [-38, 20], [-33, 24], [-37, 25], [6, 29], [12, 29.5], [-40, -26], [40, -26], [-24, -24], [42, 26], [-42, 4.8], [12, -26]].forEach((p) => tree(p[0], p[1], 0.9 + Math.random() * 0.3));

  // ---- Colliders ----
  const COL = [];
  const col = (x, z, w, d) => COL.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 });
  COL.push({ x0: -BW / 2, x1: -22.2, z0: -RZ, z1: RZ }, { x0: -17.8, x1: 21.8, z0: -RZ, z1: RZ }, { x0: 26.2, x1: BW / 2, z0: -RZ, z1: RZ });

  // ---- Labels (HTML pills projected from 3D) ----
  const labels = [];
  const itemTags = [];
  function label(text, x, y, z, decor?, itemIdx?) {
    const d = document.createElement("div");
    d.className = "tag" + (decor ? " decor" : "");
    d.innerHTML = (decor ? "" : "<i>✓</i>") + text;
    hooks.labelsEl.appendChild(d);
    labels.push({ el: d, pos: new THREE.Vector3(x, y, z) });
    if (itemIdx != null) itemTags[itemIdx] = d;
  }

  // ---- Landmarks ----
  { // Big Ben + Parliament
    const x = -31, z = -17;
    B(3.2, 15, 3.2, "#D8C39A", x, 7.5, z); B(3.9, 3.6, 3.9, "#CDB587", x, 16.8, z);
    [[0, 1.96, 0], [1.96, 0, Math.PI / 2]].forEach((a) => {
      const c = new THREE.Mesh(new THREE.CircleGeometry(1.35, 28), U("#FBF6E8")); c.position.set(x + a[0], 16.8, z + a[1]); c.rotation.y = a[2]; scene.add(c);
      const h = B(0.1, 1, 0.03, U("#1F2A2E"), x + a[0] * 1.01, 17.1, z + a[1] * 1.01); h.rotation.y = a[2];
    });
    const sp = new THREE.Mesh(new THREE.ConeGeometry(2.7, 5.5, 4), M("#5F6B5E")); sp.position.set(x, 21.3, z); sp.rotation.y = Math.PI / 4; scene.add(sp);
    B(12, 5, 4.5, "#D2BD92", x + 8.5, 2.5, z - 0.5); for (let k = 0; k < 6; k++) B(0.6, 1.4, 0.6, "#C4AD80", x + 3.4 + k * 2, 5.7, z + 1.4);
    col(x, z, 3.4, 3.4); col(x + 8.5, z - 0.5, 12, 4.5); label("Big Ben", x, 24.5, z, false, 7);
  }
  let wheel;
  { // London Eye
    const x = -13, z = -15;
    const eye = new THREE.Group(); eye.position.set(x, 9.6, z); eye.rotation.y = 0.55; scene.add(eye);
    wheel = new THREE.Group(); eye.add(wheel);
    wheel.add(new THREE.Mesh(new THREE.TorusGeometry(8, 0.22, 8, 64), M("#F7F7F4")));
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 8, 4), M("#E4E4E0")); s.position.set(Math.cos(a) * 4, Math.sin(a) * 4, 0); s.rotation.z = a - Math.PI / 2; wheel.add(s);
      const pod = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), M("#BFD6E0")); pod.scale.set(1, 0.8, 1.4); pod.position.set(Math.cos(a) * 8.3, Math.sin(a) * 8.3, 0); wheel.add(pod);
    }
    Cy(0.6, 0.6, 0.8, "#D6D6D2", 0, 0, 0, eye).rotation.x = Math.PI / 2;
    const leg = Cy(0.25, 0.3, 10.5, "#E0E0DC", 0, 0, 0, eye); leg.position.set(0, -4.8, -2.4); leg.rotation.x = 0.45;
    col(x, z, 3, 5); label("London Eye", x, 19.5, z, false, 4);
  }
  { // St Paul's
    const x = 2, z = -17.5;
    B(9, 5, 7, "#ECE6D8", x, 2.5, z); B(3, 6, 3, "#E6DFCF", x - 3.6, 3, z + 2.2); B(3, 6, 3, "#E6DFCF", x + 3.6, 3, z + 2.2);
    Cy(2.6, 2.8, 2.2, "#E6DFCF", x, 6.1, z);
    const d = new THREE.Mesh(new THREE.SphereGeometry(2.7, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), M("#9FB0A8")); d.position.set(x, 7.2, z); scene.add(d);
    Cy(0.4, 0.5, 1.8, "#E6DFCF", x, 10.6, z);
    const g = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), M("#E3A63B")); g.position.set(x, 11.7, z); scene.add(g);
    col(x, z, 9, 7); label("St Paul's", x, 13.5, z, true);
  }
  { // The Shard
    const x = 17, z = -19;
    const s = new THREE.Mesh(new THREE.ConeGeometry(4.2, 26, 4), M("#B6CCD6")); s.position.set(x, 13, z); s.rotation.y = Math.PI / 4; scene.add(s);
    col(x, z, 5.5, 5.5); label("The Shard", x, 27.5, z, true);
  }
  { // Shoreditch warehouse
    const x = 33, z = -18;
    B(11, 5, 8, "#B9745A", x, 2.5, z);
    for (let k = 0; k < 4; k++) { const r = B(2.8, 0.25, 8.1, "#8E5440", x - 4.2 + k * 2.8, 5.55, z); r.rotation.z = 0.42; }
    sign("SIDE EVENT · RSVP FULL", "#FFFFFF", "#1F2A2E", 8, 1.1, x, 3.7, z + 4.02);
    B(3.2, 2.4, 0.1, U("#FBE3B0"), x, 1.2, z + 4.02);
    for (let k = 0; k < 11; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), U("#F2C46D")); s.position.set(x - 5 + k, 4.8 + Math.sin(k * 0.9) * 0.2, z + 4.2); scene.add(s); }
    col(x, z, 11, 8); label("Shoreditch side event", x, 9, z, false, 5);
  }
  { // Tower Bridge
    const x = 24;
    B(4.4, 0.3, RZ * 2 + 3, "#7FA3B8", x, 0.1, 0);
    [-2.6, 2.6].forEach((z) => {
      B(3, 10, 2.4, "#D7CCB6", x, 5, z);
      for (const dx of [-1.2, 1.2]) for (const dz of [-0.9, 0.9]) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.6, 4), M("#5B6A6E")); c.position.set(x + dx, 10.8, z + dz); scene.add(c); }
      const r = new THREE.Mesh(new THREE.ConeGeometry(1.9, 3, 4), M("#6F7E82")); r.position.set(x, 11.4, z); r.rotation.y = Math.PI / 4; scene.add(r);
    });
    B(1.2, 0.8, 3.4, "#7FA3B8", x - 1, 8.2, 0); B(1.2, 0.8, 3.4, "#7FA3B8", x + 1, 8.2, 0);
    [-1, 1].forEach((side) => { for (let k = 0; k < 6; k++) { const zz = 4 + k * 0.9; B(0.15, 0.8, 0.15, "#7FA3B8", x + side * 2.1, 0.6, zz); B(0.15, 0.8, 0.15, "#7FA3B8", x + side * 2.1, 0.6, -zz); } });
    label("Tower Bridge", x, 14, 0, false, 0);
  }
  { // Westminster Bridge
    const x = -20; B(4.4, 0.3, RZ * 2 + 3, "#6E9A7E", x, 0.1, 0);
    for (const s of [-1, 1]) B(0.2, 0.6, RZ * 2 + 3, "#5E8A6E", x + s * 2.1, 0.5, 0);
    label("Westminster Bridge", x, 2.5, 0, true);
  }
  { // Tube
    const x = -30, z = 14;
    B(7, 4, 5, "#EDE6DA", x, 2, z); B(7.1, 0.9, 5.1, "#C8453A", x, 3.4, z);
    sign("TUBE", "#FFFFFF", "#23408E", 3, 0.75, x, 3.4, z + 2.57); B(2.8, 2, 0.1, "#2A3236", x, 1, z + 2.52);
    col(x, z, 7, 5); label("Tube station", x, 6.5, z, false, 1);
  }
  { // Corner shop
    const x = -16, z = 19;
    B(6, 3.6, 5, "#A9BCA2", x, 1.8, z);
    for (let k = 0; k < 6; k++) { const a = B(1, 0.14, 1.8, k % 2 ? "#FFFFFF" : "#C8453A", x - 2.5 + k, 2.8, z + 3.1); a.rotation.x = -0.35; }
    sign("OPEN TIL LATE", "#FFFFFF", "#1F2A2E", 4.8, 0.7, x, 3.25, z + 2.52); B(3.8, 1.3, 0.1, U("#FBE3B0"), x, 1.3, z + 2.52);
    col(x, z, 6, 5); label("Corner shop", x, 6, z, false, 2);
  }
  { // Breakpoint venue
    const x = 2, z = 18;
    B(20, 7.5, 10, "#F7F5F0", x, 3.75, z); B(20.2, 0.5, 10.2, "#1F2A2E", x, 7.6, z);
    sign("BREAKPOINT 2026", "#1F2A2E", "#E3A63B", 13, 2.8, x, 4.8, z + 5.02);
    B(6, 2.4, 0.1, U("#FBE3B0"), x, 1.2, z + 5.02);
    for (const k of [-2, 2]) { Cy(0.07, 0.07, 6, "#1F2A2E", x + k * 4.2, 3, z + 6.2); B(1.2, 1.8, 0.05, k < 0 ? "#E3A63B" : "#7E9C8C", x + k * 4.2 + (k < 0 ? -0.65 : 0.65), 5, z + 6.2); } // outside the sign so they never cover it
    col(x, z, 20, 10); label("Olympia · Breakpoint", x, 11, z, false, 3);
  }
  { // Pub
    const x = 18, z = 19.5;
    B(8, 4.6, 6, "#2F5443", x, 2.3, z); B(8.3, 0.45, 6.3, "#1F3A2E", x, 4.8, z);
    sign("THE RED LION", "#2F5443", "#E3A63B", 6.6, 0.95, x, 3.8, z + 3.02);
    B(2.2, 1.5, 0.1, U("#F7D591"), x - 2.4, 1.5, z + 3.02); B(2.2, 1.5, 0.1, U("#F7D591"), x + 2.4, 1.5, z + 3.02); B(1.2, 2.3, 0.1, "#1F2A2E", x, 1.15, z + 3.02);
    sign("AFTERPARTY", "#C8453A", "#FFFFFF", 2.4, 0.5, x, 2.75, z + 3.05);
    col(x, z, 8, 6); label("The Red Lion", x, 7.5, z, false, 6);
  }
  { // Flat
    const x = 34, z = 20;
    for (let k = 0; k < 3; k++) { B(4, 5.2, 6, k === 1 ? "#C38B6E" : "#B98069", x - 4 + k * 4, 2.6, z); const r = new THREE.Mesh(new THREE.ConeGeometry(3.2, 2.4, 4), M("#6B5E58")); r.position.set(x - 4 + k * 4, 6.4, z); r.rotation.y = Math.PI / 4; r.scale.z = 1.4; scene.add(r); }
    B(1.1, 2.1, 0.1, "#23408E", x, 1.05, z + 3.02); B(1.4, 1.1, 0.1, U("#F7D591"), x, 3.6, z + 3.02);
    sign("FLAT 4B", "#FFFFFF", "#1F2A2E", 1.8, 0.45, x, 2.45, z + 3.05);
    col(x, z, 12, 6); label("Flat 4B, Zone 3", x, 9.5, z, false, 8);
  }
  { // Phone box
    const x = -8, z = 12; B(1.2, 2.6, 1.2, "#C8453A", x, 1.3, z); B(1.35, 0.3, 1.35, "#B23C32", x, 2.7, z); B(0.8, 1.2, 0.05, U("#FBE3B0"), x, 1.6, z + 0.62); col(x, z, 1.3, 1.3);
  }
  [[-42, -26, 6, 7, 5], [-24, -27, 6, 5, 4], [26, -28, 5, 9, 4], [42, -12, 4, 6, 5], [-42, -12, 4, 7, 4], [-42, 14, 4, 5, 6], [42, 12, 4, 5, 5], [-24, 26, 6, 4, 6], [26, 27, 6, 5, 4]]
    .forEach((b) => { B(b[2], b[3], b[4], ["#DDD3C2", "#CFC6B6", "#E4DCCD"][Math.abs(b[0] + b[1]) % 3], b[0], b[3] / 2, b[1]); col(b[0], b[1], b[2], b[4]); });

  // Crowd
  const crowd = [];
  function person(x, z, shirt) {
    const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
    Cy(0.14, 0.14, 0.8, "#3A4448", -0.18, 0.4, 0, g); Cy(0.14, 0.14, 0.8, "#3A4448", 0.18, 0.4, 0, g);
    Cy(0.38, 0.44, 0.95, shirt, 0, 1.25, 0, g);
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), M(["#C08A62", "#8A5A3C", "#E0B08A"][Math.floor(Math.random() * 3)])); h.position.y = 2; g.add(h);
    return g;
  }
  const npcs = [];
  const hitMeshes = [];
  const lines = [...NPC_LINES].sort(() => Math.random() - 0.5);
  let nextLine = 0;
  [[-4, 25.4, "#7E9C8C"], [-3, 26.2, "#E3A63B"], [7, 25.8, "#C8453A"], [8, 26.6, "#5B6A6E"], [11, 25.6, "#9DBBC6"], [21.5, 24.6, "#E3A63B"], [15, 25, "#7E9C8C"], [31, -12.6, "#C8453A"], [35, -13.2, "#E3A63B"],
    [-26, 20, "#23408E"], [-20, 25.5, "#C8453A"], [-24, -10, "#5B6A6E"], [-8, -10, "#E3A63B"], [12, -11, "#7E9C8C"], [38, 26, "#9DBBC6"]]
    .forEach((p, i) => {
      const g = person(p[0], p[1], p[2]); g.rotation.y = Math.random() * 6; g.scale.setScalar(1.35); crowd.push(g);
      // Invisible, fatter hit target so NPCs are easy to tap on a phone
      const hitbox = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 2.8, 8), new THREE.MeshBasicMaterial());
      hitbox.visible = false; hitbox.position.y = 1.3; hitbox.userData.npc = i; g.add(hitbox); hitMeshes.push(hitbox);
      npcs.push({ g, x: p[0], z: p[1], shirt: p[2], bubble: null, until: 0, talked: false });
    });

  function talk(i) {
    const n = npcs[i];
    if (!n.bubble) {
      const d = document.createElement("div"); d.className = "tag bubble"; hooks.labelsEl.appendChild(d);
      n.bubble = d; labels.push({ el: d, pos: new THREE.Vector3(n.x, 5.2, n.z) });
    }
    n.bubble.textContent = lines[nextLine++ % lines.length];
    n.bubble.classList.add("show");
    n.until = t + 4.5;
    n.g.rotation.y = Math.atan2(H.x - n.x, H.z - n.z);
    if (!n.talked) { n.talked = true; hooks.onTalk?.(); }
  }

  // Bus
  const bus = new THREE.Group(); scene.add(bus);
  B(6, 2, 2.2, "#C8453A", 0, 1.4, 0, bus); B(6, 1.6, 2.2, "#C8453A", 0, 3.2, 0, bus);
  B(6.05, 0.5, 2.25, U("#FBE3B0"), 0, 2.35, 0, bus); B(6.05, 0.5, 2.25, U("#FBE3B0"), 0, 3.5, 0, bus);
  [-2, 2].forEach((x) => [-1.1, 1.1].forEach((z) => (Cy(0.45, 0.45, 0.3, "#1F2A2E", x, 0.45, z, bus).rotation.x = Math.PI / 2)));
  bus.position.set(-30, 0, 6.6);
  let busDir = 1;

  // ---- Hero ----
  const hero = new THREE.Group(); scene.add(hero);
  const body = new THREE.Group(); hero.add(body);
  const blocky = [];
  const keep = (m) => (blocky.push(m), m);
  const legPivot = (x) => { const p = new THREE.Group(); p.position.set(x, 0.85, 0); body.add(p); keep(Cy(0.16, 0.15, 0.85, "#E9E2D2", 0, -0.42, 0, p)); keep(B(0.34, 0.16, 0.5, "#1F2A2E", 0, -0.8, 0.08, p)); return p; };
  const legL = legPivot(-0.2), legR = legPivot(0.2);
  keep(Cy(0.42, 0.5, 1.05, "#2F5D62", 0, 1.35, 0, body));
  const head = keep(new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), M("#B8835E"))); head.position.y = 2.25; body.add(head);
  const hair = keep(new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), M("#1E1A18"))); hair.position.set(0, 2.3, -0.03); body.add(hair);
  keep(B(0.72, 0.9, 0.36, "#E3A63B", 0, 1.45, -0.5, body));
  const armPivot = (x) => { const p = new THREE.Group(); p.position.set(x, 1.8, 0); body.add(p); keep(Cy(0.13, 0.12, 0.85, "#2F5D62", 0, -0.42, 0, p)); return p; };
  const armL = armPivot(-0.55), armR = armPivot(0.55);
  const badge = B(0.28, 0.36, 0.04, U("#E3A63B"), 0, 1.08, 0.47, body); badge.visible = false; // below the chest print
  const umb = new THREE.Group(); umb.position.set(0.55, 1.8, 0.1); body.add(umb);
  Cy(0.04, 0.04, 2.2, "#1F2A2E", 0, 1, 0, umb);
  const can = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.7, 10, 1, true), new THREE.MeshLambertMaterial({ color: "#C8453A", side: THREE.DoubleSide })); can.position.y = 2.2; umb.add(can);
  umb.visible = false;
  hero.scale.setScalar(1.7);
  const H = { x: -6, z: 28, dir: 0 };
  const you = document.createElement("div"); you.className = "tag you"; you.textContent = "You"; hooks.labelsEl.appendChild(you);
  labels.push({ el: you, pos: new THREE.Vector3(), hero: true });

  // Optional rigged character (.glb with idle + walk animations)
  let mixer = null, idleAct = null, walkAct = null, walkingNow = false;
  if (hooks.characterUrl) {
    import("three/examples/jsm/loaders/GLTFLoader.js").then(({ GLTFLoader }) => {
      new GLTFLoader().load(hooks.characterUrl, (gltf) => {
        if (destroyed) return;
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const s = 2.6 / Math.max(0.001, box.max.y - box.min.y);
        model.scale.setScalar(s);
        model.position.y = -box.min.y * s;
        model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
        body.add(model);
        blocky.forEach((m) => (m.visible = false));
        if (gltf.animations.length) {
          mixer = new THREE.AnimationMixer(model);
          const find = (re) => gltf.animations.find((c) => re.test(c.name));
          const idle = find(/idle|stand/i) || gltf.animations[0];
          const walk = find(/walk/i) || find(/run/i);
          idleAct = mixer.clipAction(idle); idleAct.play();
          if (walk) walkAct = mixer.clipAction(walk);
        }
      }, undefined, () => { /* no model file: keep the built-in character */ });
    });
  }

  // Optional crowd model: one .glb cloned per person, recoloured by material name
  const npcMixers = [];
  const SKINS = ["#C08A62", "#8A5A3C", "#E0B08A", "#6B4630", "#F1C9A5"], HAIRS = ["#1E1A18", "#4A3222", "#8C6A3F", "#D9C48C", "#9A9A9A"];
  const LEGS = ["#34425E", "#2A2A30", "#6E6A5E", "#4E5F7A"], SHOES = ["#F2EFE8", "#1F2A2E", "#C8453A"];
  if (hooks.crowdUrl) {
    import("three/examples/jsm/loaders/GLTFLoader.js").then(({ GLTFLoader }) => {
      new GLTFLoader().load(hooks.crowdUrl, (gltf) => {
        if (destroyed) return;
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const s = 2.4 / Math.max(0.001, box.max.y - box.min.y);
        npcs.forEach((n, i) => {
          const colors = { Tee: n.shirt, Skin: SKINS[i % 5], Hair: HAIRS[(i * 3) % 5], Jeans: LEGS[(i * 7) % 4], Shoe: SHOES[i % 3] };
          const model = gltf.scene.clone();
          model.scale.setScalar(s); model.position.y = -box.min.y * s;
          model.traverse((o) => {
            if (!o.isMesh) return;
            o.castShadow = true; o.receiveShadow = true;
            const c = colors[o.material.name];
            if (c) { o.material = o.material.clone(); o.material.color.set(c); }
          });
          n.g.children.forEach((c) => (c.visible = false)); // hide the doll; the hitbox is invisible anyway and still takes taps
          n.g.add(model);
          if (gltf.animations.length) {
            const m = new THREE.AnimationMixer(model), act = m.clipAction(gltf.animations[0]);
            act.time = Math.random() * act.getClip().duration; act.play(); npcMixers.push(m);
          }
        });
      }, undefined, () => { /* no crowd model: keep the built-in people */ });
    });
  }

  // ---- Pickups ----
  function tokenTex(icon) {
    const c = document.createElement("canvas"); c.width = c.height = 256; const x = c.getContext("2d");
    x.beginPath(); x.arc(128, 128, 118, 0, Math.PI * 2); x.fillStyle = "#E3A63B"; x.fill();
    x.beginPath(); x.arc(128, 128, 100, 0, Math.PI * 2); x.fillStyle = "#FFFFFF"; x.fill();
    x.save(); x.translate(56, 56); x.scale(6, 6); x.lineWidth = 1.8; x.lineCap = "round"; x.lineJoin = "round"; x.strokeStyle = "#1F2A2E";
    ICON_PATHS[icon].forEach((d) => x.stroke(new Path2D(d))); x.restore();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const tokens = ITEMS.map((s) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tokenTex(s.icon), depthWrite: false })); sp.scale.set(3, 3, 1); sp.position.set(s.x, 2.6, s.z); scene.add(sp);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1, 1.35, 32), new THREE.MeshBasicMaterial({ color: "#E3A63B", transparent: true, opacity: 0.85 })); ring.rotation.x = -Math.PI / 2; ring.position.set(s.x, 0.1, s.z); scene.add(ring);
    return { sprite: sp, ring, pop: 0 };
  });

  scene.traverse((o) => { if (o.isMesh && o !== water && o !== ground && !o.material?.isMeshBasicMaterial) { o.castShadow = true; o.receiveShadow = true; } });
  ground.receiveShadow = true; water.receiveShadow = true;

  const marker = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.75, 24), new THREE.MeshBasicMaterial({ color: "#1F2A2E", transparent: true, opacity: 0 }));
  marker.rotation.x = -Math.PI / 2; marker.position.y = 0.12; scene.add(marker);

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight, a = w / h;
    let vh = Math.max(90, 122 / a); if (a < 0.8) vh = Math.max(vh, (150 / a) * 0.9);
    camera.left = (-vh * a) / 2; camera.right = (vh * a) / 2; camera.top = vh / 2; camera.bottom = -vh / 2;
    camera.updateProjectionMatrix(); renderer.setSize(w, h, false);
  }
  resize(); on(window, "resize", resize);

  // ---- Camera: zoom, follow when zoomed in, push-in on pickup ----
  const ZMIN = 1, ZMAX = 3.2;
  const baseZoom = () => (stage.clientWidth / stage.clientHeight < 0.8 ? 1.6 : 1); // phones start closer
  const clampZoom = (z) => Math.max(ZMIN, Math.min(ZMAX, z));
  let zoomTarget = baseZoom(), push = null;
  const focus = LOOK.clone(), want = new THREE.Vector3();
  function zoomBy(f) { zoomTarget = clampZoom(zoomTarget * f); }
  function resetView() { zoomTarget = baseZoom(); push = null; }
  on(renderer.domElement, "wheel", (e) => { e.preventDefault(); zoomBy(Math.exp(-e.deltaY * 0.002)); }, { passive: false });

  // ---- Movement ----
  const R = 0.7, SPEED = 9;
  function resolve(x, z) {
    x = Math.max(-BW / 2 + 1, Math.min(BW / 2 - 1, x)); z = Math.max(-BD / 2 + 1, Math.min(BD / 2 - 1, z));
    for (const c of COL) {
      if (x > c.x0 - R && x < c.x1 + R && z > c.z0 - R && z < c.z1 + R) {
        const dl = x - (c.x0 - R), dr = c.x1 + R - x, dt = z - (c.z0 - R), db = c.z1 + R - z;
        const m = Math.min(dl, dr, dt, db);
        if (m === dl) x = c.x0 - R; else if (m === dr) x = c.x1 + R; else if (m === dt) z = c.z0 - R; else z = c.z1 + R;
      }
    }
    return [x, z];
  }
  let path = [], stuck = 0;

  // Grid A* (1-unit cells) so tap-to-walk and Guide route around buildings and over bridges.
  const GW = BW, GD = BD;
  const blockedAt = (x, z, pad) => Math.abs(x) > BW / 2 - 1 || Math.abs(z) > BD / 2 - 1 || COL.some((c) => x > c.x0 - pad && x < c.x1 + pad && z > c.z0 - pad && z < c.z1 + pad);
  const cx = (i) => i - GW / 2 + 0.5, cz = (j) => j - GD / 2 + 0.5;
  const free = new Uint8Array(GW * GD);
  for (let j = 0; j < GD; j++) for (let i = 0; i < GW; i++) free[j * GW + i] = blockedAt(cx(i), cz(j), R + 0.1) ? 0 : 1;
  const cellOf = (x, z) => [Math.max(0, Math.min(GW - 1, Math.floor(x + GW / 2))), Math.max(0, Math.min(GD - 1, Math.floor(z + GD / 2)))];
  function nearestFree(i, j) {
    for (let r = 0; r < 12; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
      const a = i + di, b = j + dj;
      if (a >= 0 && b >= 0 && a < GW && b < GD && free[b * GW + a]) return [a, b];
    }
    return null;
  }
  const clearLine = (x0, z0, x1, z1) => { const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.25); for (let k = 1; k <= n; k++) if (blockedAt(x0 + ((x1 - x0) * k) / n, z0 + ((z1 - z0) * k) / n, R)) return false; return true; };
  function findPath(x0, z0, x1, z1) {
    const s = nearestFree(...cellOf(x0, z0)), g = nearestFree(...cellOf(x1, z1));
    if (!s || !g) return null;
    const S = s[1] * GW + s[0], G = g[1] * GW + g[0];
    const cost = new Float32Array(GW * GD).fill(Infinity), from = new Int32Array(GW * GD).fill(-1);
    const heap = [[0, S]]; cost[S] = 0;
    const push = (e) => { heap.push(e); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
    const h = (n) => { const dx = Math.abs((n % GW) - g[0]), dz = Math.abs(((n / GW) | 0) - g[1]); return Math.max(dx, dz) + 0.414 * Math.min(dx, dz); };
    while (heap.length) {
      const [, n] = pop();
      if (n === G) break;
      const i = n % GW, j = (n / GW) | 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const a = i + di, b = j + dj;
        if (a < 0 || b < 0 || a >= GW || b >= GD || !free[b * GW + a]) continue;
        if (di && dj && (!free[j * GW + a] || !free[b * GW + i])) continue; // no corner cutting
        const m = b * GW + a, c = cost[n] + (di && dj ? 1.414 : 1);
        if (c < cost[m]) { cost[m] = c; from[m] = n; push([c + h(m), m]); }
      }
    }
    if (from[G] < 0 && G !== S) return null;
    const pts = [];
    for (let n = G; n !== S; n = from[n]) pts.push([cx(n % GW), cz((n / GW) | 0)]);
    pts.reverse();
    if (!blockedAt(x1, z1, R)) pts.push([x1, z1]);
    // String-pull: skip waypoints that are in direct line of sight
    const out = []; let px = x0, pz = z0, k = 0;
    while (k < pts.length) {
      let far = k;
      for (let q = pts.length - 1; q > k; q--) if (clearLine(px, pz, pts[q][0], pts[q][1])) { far = q; break; }
      out.push(pts[far]); [px, pz] = pts[far]; k = far + 1;
    }
    return out;
  }

  function planTo(tx, tz) {
    path = findPath(H.x, H.z, tx, tz) || [[tx, tz]]; stuck = 0;
    marker.position.x = tx; marker.position.z = tz; marker.material.opacity = 0.6;
  }
  const keys = {};
  const MOVE_KEYS = ["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"];
  on(window, "keydown", (e) => {
    if (hooks.isPaused()) return;
    const k = e.key.toLowerCase();
    if (MOVE_KEYS.includes(k)) { keys[k] = true; path = []; e.preventDefault(); }
    if (k === "g" && e.target.tagName !== "BUTTON") guide();
    if (k === "=" || k === "+") zoomBy(1.25);
    if (k === "-") zoomBy(0.8);
    if (k === "0") resetView();
  });
  on(window, "keyup", (e) => { keys[e.key.toLowerCase()] = false; });
  on(window, "blur", () => { for (const k in keys) keys[k] = false; }); // alt-tab while holding W

  const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
  let down = null;
  const touches = new Map();
  let pinch = 0;
  const spread = () => { const [a, b] = [...touches.values()]; return Math.hypot(a[0] - b[0], a[1] - b[1]); };
  on(renderer.domElement, "pointerdown", (e) => {
    touches.set(e.pointerId, [e.clientX, e.clientY]);
    if (touches.size === 2) { pinch = spread(); down = null; } else down = [e.clientX, e.clientY]; // two fingers never walk
  });
  on(renderer.domElement, "pointermove", (e) => {
    if (!touches.has(e.pointerId)) return;
    touches.set(e.pointerId, [e.clientX, e.clientY]);
    if (touches.size === 2 && pinch) { const d = spread(); zoomBy(d / pinch); pinch = d; }
  });
  const lift = (e) => { touches.delete(e.pointerId); if (touches.size < 2) pinch = 0; };
  on(renderer.domElement, "pointercancel", lift);
  on(renderer.domElement, "pointerup", (e) => {
    lift(e);
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 10) return;
    const r = renderer.domElement.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
    const npcHit = ray.intersectObjects(hitMeshes, false)[0];
    if (npcHit) { talk(npcHit.object.userData.npc); return; }
    if (ray.ray.intersectPlane(plane, hit) && Math.abs(hit.x) < BW / 2 && Math.abs(hit.z) < BD / 2) planTo(hit.x, hit.z);
  });
  function guide() {
    let best = -1, bd = 1e9;
    ITEMS.forEach((s, i) => { if (got.has(i)) return; const d = Math.hypot(s.x - H.x, s.z - H.z); if (d < bd) { bd = d; best = i; } });
    if (best >= 0) planTo(ITEMS[best].x, ITEMS[best].z);
  }
  function reset() {
    got.clear(); H.x = -6; H.z = 28; path = []; marker.material.opacity = 0;
    tokens.forEach((t) => { t.sprite.visible = true; t.ring.visible = true; t.pop = 0; t.sprite.material.opacity = 1; t.sprite.scale.set(3, 3, 1); });
    itemTags.forEach((el) => el?.classList.remove("got"));
    resetView();
  }

  // ---- Loop ----
  const fwd = new THREE.Vector3(-1, 0, -1).normalize(), rgt = new THREE.Vector3(1, 0, -1).normalize();
  const tmp = new THREE.Vector3();
  let last = performance.now(), phase = 0, t = 0, raf = 0, destroyed = false;

  function frame(now) {
    if (destroyed) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    let mx = 0, mz = 0;
    const kf = (keys.w || keys.arrowup ? 1 : 0) - (keys.s || keys.arrowdown ? 1 : 0);
    const kr = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
    if (kf || kr) { mx = fwd.x * kf + rgt.x * kr; mz = fwd.z * kf + rgt.z * kr; const l = Math.hypot(mx, mz); mx /= l; mz /= l; }
    else if (path.length) {
      const [tx, tz] = path[0]; const dx = tx - H.x, dz = tz - H.z, d = Math.hypot(dx, dz);
      if (d < 0.4) { path.shift(); if (!path.length) marker.material.opacity = 0; }
      else { mx = dx / d; mz = dz / d; }
    }
    const moving = !!(mx || mz);
    if (moving) {
      const ox = H.x, oz = H.z;
      [H.x, H.z] = resolve(H.x + mx * SPEED * dt, H.z + mz * SPEED * dt);
      if (path.length) { stuck = Math.hypot(H.x - ox, H.z - oz) < SPEED * dt * 0.2 ? stuck + dt : 0; if (stuck > 0.6) { path = []; marker.material.opacity = 0; } }
      let da = Math.atan2(mx, mz) - H.dir; da = Math.atan2(Math.sin(da), Math.cos(da)); H.dir += da * Math.min(1, dt * 12);
    }
    hero.position.set(H.x, 0.15, H.z); hero.rotation.y = H.dir;

    if (mixer) {
      if (walkAct && moving !== walkingNow) {
        walkingNow = moving;
        const from = moving ? idleAct : walkAct, to = moving ? walkAct : idleAct;
        to.reset().play(); from.crossFadeTo(to, 0.2, false);
      }
      mixer.update(dt);
    } else if (moving && !reduce) {
      phase += dt * 11;
      legL.rotation.x = Math.sin(phase) * 0.7; legR.rotation.x = -Math.sin(phase) * 0.7;
      armL.rotation.x = -Math.sin(phase) * 0.55; armR.rotation.x = umb.visible ? -0.25 : Math.sin(phase) * 0.55;
      body.position.y = Math.abs(Math.sin(phase)) * 0.1;
    } else {
      legL.rotation.x *= 0.8; legR.rotation.x *= 0.8; armL.rotation.x *= 0.8;
      armR.rotation.x = umb.visible ? -0.25 : armR.rotation.x * 0.8;
      body.position.y = reduce ? 0 : Math.sin(t * 2) * 0.03;
    }
    umb.rotation.x = -armR.rotation.x; umb.visible = got.has(0); badge.visible = got.has(3);

    tokens.forEach((tk, i) => {
      if (!tk.sprite.visible) return;
      if (got.has(i)) {
        tk.pop += dt * 3; const k = 1 + tk.pop * 1.4;
        tk.sprite.scale.set(3 * k, 3 * k, 1); tk.sprite.material.opacity = Math.max(0, 1 - tk.pop); tk.sprite.position.y = 2.6 + tk.pop * 3; tk.ring.visible = false;
        if (tk.pop >= 1) { tk.sprite.visible = false; tk.sprite.material.opacity = 1; tk.sprite.position.y = 2.6; }
        return;
      }
      tk.sprite.position.y = 2.6 + (reduce ? 0 : Math.sin(t * 2.4 + i) * 0.3);
      const pulse = reduce ? 1 : 1 + 0.12 * Math.sin(t * 3 + i); tk.ring.scale.set(pulse, pulse, pulse);
      if (Math.hypot(ITEMS[i].x - H.x, ITEMS[i].z - H.z) < 1.9) {
        got.add(i); tk.pop = 0; itemTags[i]?.classList.add("got"); hooks.onCollect(i);
        if (!reduce) push = { x: ITEMS[i].x, z: ITEMS[i].z, until: t + 1.3 };
      }
    });

    if (!reduce) {
      wheel.rotation.z += dt * 0.08;
      ripples.forEach((r, i) => { r.position.x += dt * (0.8 + (i % 3) * 0.3); if (r.position.x > 43) r.position.x = -43; });
      bus.position.x += busDir * dt * 6;
      if (bus.position.x > 38) { busDir = -1; bus.position.z = 8.6; }
      if (bus.position.x < -38) { busDir = 1; bus.position.z = 6.6; }
      bus.rotation.y = busDir > 0 ? 0 : Math.PI;
      npcMixers.forEach((m) => m.update(dt));
      crowd.forEach((c, i) => { if (!npcs[i]?.bubble?.classList.contains("show")) c.rotation.y += Math.sin(t * 0.7 + i) * 0.004; });
      if (marker.material.opacity > 0) { const s = 1 + 0.15 * Math.sin(t * 6); marker.scale.set(s, s, s); }
    }

    npcs.forEach((n, i) => {
      if (n.bubble && t > n.until) n.bubble.classList.remove("show");
      if (!hooks.isPaused() && !n.talked && Math.hypot(n.x - H.x, n.z - H.z) < 3.2) talk(i); // unprompted once, then tap-only
    });

    let zoom = zoomTarget;
    if (push && t < push.until) { zoom = Math.max(zoomTarget, 2.2); want.set(push.x, 2, push.z); }
    else {
      push = null;
      const f = Math.min(1, (zoom - ZMIN) / 0.6); // 0 = whole board, 1 = centred on you
      want.set(LOOK.x + (H.x - LOOK.x) * f, LOOK.y + (2 - LOOK.y) * f, LOOK.z + (H.z - LOOK.z) * f);
    }
    const ease = reduce ? 1 : Math.min(1, dt * 5);
    camera.zoom += (zoom - camera.zoom) * ease; focus.lerp(want, ease);
    camera.position.copy(focus).addScaledVector(CAMDIR, 160); camera.lookAt(focus); camera.updateProjectionMatrix();

    renderer.render(scene, camera);

    const w = stage.clientWidth, h = stage.clientHeight;
    labels.forEach((L) => {
      if (L.hero) L.pos.set(H.x, 5.4, H.z);
      tmp.copy(L.pos).project(camera);
      L.el.style.transform = `translate(${((tmp.x * 0.5 + 0.5) * w).toFixed(1)}px,${((-tmp.y * 0.5 + 0.5) * h).toFixed(1)}px) translate(-50%,-100%)`;
    });
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return {
    guide,
    reset,
    zoomBy,
    resetView,
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      disposers.forEach((d) => d());
      labels.forEach((L) => L.el.remove());
      scene.traverse((o) => { o.geometry?.dispose?.(); const m = o.material; (Array.isArray(m) ? m : m ? [m] : []).forEach((mm) => { mm.map?.dispose?.(); mm.dispose?.(); }); });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
