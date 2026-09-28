// Builds the character models with `npm run character`:
//   public/models/attendee.glb  the player: Solana logo tee, gold backpack, "Idle" + "Walk" clips
//   public/models/person.glb    the crowd: plain tee, "Idle" clip; the game recolours each copy
// Proportions match the built-in character (about 2.6 units tall, facing +z) so the
// in-game badge and umbrella still sit on the chest and right hand.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

// GLTFExporter reads its output through the browser FileReader API
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((b) => { this.result = b; this.onloadend?.(); }); }
};

// Material names are the contract with the game, which recolours the crowd by name
const ROLES = ["Tee", "Skin", "Hair", "Jeans", "Shoe", "Sole", "Eye", "Pack", "PackPocket"];
const DEFAULT = { Tee: "#17171C", Skin: "#C68A63", Hair: "#1E1A18", Jeans: "#34425E", Shoe: "#F2EFE8", Sole: "#C9C3B8", Eye: "#1B1B1F", Pack: "#E3A63B", PackPocket: "#C98E2C" };

function buildPerson({ logo, backpack }) {
  const mats = Object.fromEntries(ROLES.map((r) => [r, Object.assign(new THREE.MeshStandardMaterial({ color: DEFAULT[r], roughness: 0.85, metalness: 0 }), { name: r })]));
  const mesh = (name, geo, role, [x, y, z], parent) => {
    const m = new THREE.Mesh(geo, mats[role]); m.name = name; m.position.set(x, y, z); parent.add(m); return m;
  };
  const group = (name, [x, y, z], parent) => {
    const g = new THREE.Group(); g.name = name; g.position.set(x, y, z); parent.add(g); return g;
  };

  const root = new THREE.Group(); root.name = "Person";
  const body = group("Body", [0, 0, 0], root);

  // Legs: pivot at the hip so the walk clip swings the whole leg
  for (const [name, x] of [["LegL", -0.2], ["LegR", 0.2]]) {
    const leg = group(name, [x, 0.95, 0], body);
    mesh(name + "Jeans", new THREE.CapsuleGeometry(0.15, 0.55, 4, 10), "Jeans", [0, -0.42, 0], leg);
    mesh(name + "Shoe", new THREE.BoxGeometry(0.3, 0.14, 0.46), "Shoe", [0, -0.86, 0.07], leg);
    mesh(name + "Sole", new THREE.BoxGeometry(0.31, 0.04, 0.47), "Sole", [0, -0.93, 0.07], leg);
  }
  mesh("Hips", new THREE.CylinderGeometry(0.38, 0.36, 0.2, 16), "Jeans", [0, 0.93, 0], body).scale.z = 0.85;

  // Everything above the hips bobs together
  const upper = group("Upper", [0, 0, 0], body);
  // Tee: straight body with a flat hem, rounded shoulders on top
  mesh("Tee", new THREE.CylinderGeometry(0.42, 0.45, 0.72, 18), "Tee", [0, 1.25, 0], upper).scale.z = 0.95;
  mesh("Shoulders", new THREE.SphereGeometry(0.42, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), "Tee", [0, 1.61, 0], upper).scale.set(1, 0.55, 0.95);

  if (logo) {
    // Print sits centred and high on the chest; the collected badge hangs below it.
    // UVs flipped because the PNG is embedded as-is (glTF samples from the top-left).
    const geo = new THREE.PlaneGeometry(0.38, 0.38);
    const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ name: "SolanaLogo", transparent: true, roughness: 0.6 }));
    m.name = "Logo"; m.position.set(0, 1.46, 0.415); upper.add(m);
  }
  if (backpack) {
    mesh("Backpack", new THREE.BoxGeometry(0.7, 0.72, 0.3), "Pack", [0, 1.34, -0.52], upper);
    mesh("BackpackPocket", new THREE.BoxGeometry(0.5, 0.28, 0.08), "PackPocket", [0, 1.16, -0.7], upper);
  }

  const head = group("Head", [0, 1.9, 0], upper);
  mesh("Neck", new THREE.CylinderGeometry(0.12, 0.14, 0.16, 10), "Skin", [0, 0.02, 0], head);
  mesh("Face", new THREE.SphereGeometry(0.36, 20, 16), "Skin", [0, 0.33, 0], head);
  mesh("HairCap", new THREE.SphereGeometry(0.385, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), "Hair", [0, 0.36, -0.03], head);
  for (const x of [-0.12, 0.12]) mesh("Eye", new THREE.SphereGeometry(0.045, 8, 6), "Eye", [x, 0.33, 0.33], head);

  // Arms: pivot at the shoulder; short tee sleeve, bare forearm, hand
  for (const [name, x] of [["ArmL", -0.56], ["ArmR", 0.56]]) {
    const arm = group(name, [x, 1.72, 0], upper);
    mesh(name + "Sleeve", new THREE.CapsuleGeometry(0.15, 0.16, 4, 10), "Tee", [0, -0.14, 0], arm);
    mesh(name + "Forearm", new THREE.CapsuleGeometry(0.11, 0.34, 4, 10), "Skin", [0, -0.5, 0], arm);
    mesh(name + "Hand", new THREE.SphereGeometry(0.12, 10, 8), "Skin", [0, -0.78, 0.02], arm);
  }
  return root;
}

// ---- Animations ----
const q = (x, y = 0) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, 0)).toArray();
const rot = (node, times, angles, axis = "x") =>
  new THREE.QuaternionKeyframeTrack(`${node}.quaternion`, times, angles.flatMap((a) => (axis === "x" ? q(a) : q(0, a))));
const bob = (node, times, ys) => new THREE.VectorKeyframeTrack(`${node}.position`, times, ys.flatMap((y) => [0, y, 0]));

const W = [0, 0.15, 0.3, 0.45, 0.6]; // one full stride
const walk = new THREE.AnimationClip("Walk", 0.6, [
  rot("LegL", W, [0, 0.6, 0, -0.6, 0]),
  rot("LegR", W, [0, -0.6, 0, 0.6, 0]),
  rot("ArmL", W, [0, -0.5, 0, 0.5, 0]),
  rot("ArmR", W, [0, 0.5, 0, -0.5, 0]),
  bob("Upper", W, [0.05, 0, 0.05, 0, 0.05]),
]);

const I = [0, 0.6, 1.2, 1.8, 2.4];
const idle = new THREE.AnimationClip("Idle", 2.4, [
  bob("Upper", I, [0, 0.015, 0, 0.015, 0]),
  rot("Head", I, [0, 0.12, 0, -0.12, 0], "y"),
  rot("ArmL", I, [0, 0.04, 0, 0.04, 0]),
  rot("ArmR", I, [0, -0.04, 0, -0.04, 0]),
  rot("LegL", I, [0, 0, 0, 0, 0]),
  rot("LegR", I, [0, 0, 0, 0, 0]),
]);

function exportGlb(root, animations) {
  const scene = new THREE.Scene(); scene.add(root);
  return new Promise((resolve, reject) =>
    new GLTFExporter().parse(scene, (glb) => resolve(Buffer.from(glb)), reject, { binary: true, animations }));
}

// GLTFExporter can only embed images through a browser canvas, so the logo PNG is
// spliced into the finished GLB directly and wired to the "SolanaLogo" material.
function embedTexture(glb, png, materialName) {
  const jsonLen = glb.readUInt32LE(12);
  const json = JSON.parse(glb.subarray(20, 20 + jsonLen).toString("utf8"));
  const binStart = 20 + jsonLen + 8;
  const pad4 = (b, fill) => (b.length % 4 ? Buffer.concat([b, Buffer.alloc(4 - (b.length % 4), fill)]) : b);
  let bin = pad4(glb.subarray(binStart, binStart + glb.readUInt32LE(20 + jsonLen)), 0);

  json.bufferViews.push({ buffer: 0, byteOffset: bin.length, byteLength: png.length });
  bin = pad4(Buffer.concat([bin, png]), 0);
  json.buffers[0].byteLength = bin.length;
  (json.images ??= []).push({ bufferView: json.bufferViews.length - 1, mimeType: "image/png" });
  (json.samplers ??= []).push({ magFilter: 9729, minFilter: 9987, wrapS: 33071, wrapT: 33071 });
  (json.textures ??= []).push({ sampler: json.samplers.length - 1, source: json.images.length - 1 });

  const mat = json.materials.find((m) => m.name === materialName);
  const tex = { index: json.textures.length - 1 };
  mat.pbrMetallicRoughness = { ...mat.pbrMetallicRoughness, baseColorTexture: tex, baseColorFactor: [1, 1, 1, 1] };
  mat.emissiveTexture = tex; mat.emissiveFactor = [0.35, 0.35, 0.35]; // keeps the gradient bright on a black tee
  mat.alphaMode = "BLEND";

  const jsonBuf = pad4(Buffer.from(JSON.stringify(json)), 0x20);
  const header = Buffer.alloc(12); header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonBuf.length + 8 + bin.length, 8);
  const chunk = (buf, type) => { const h = Buffer.alloc(8); h.writeUInt32LE(buf.length, 0); h.writeUInt32LE(type, 4); return Buffer.concat([h, buf]); };
  return Buffer.concat([header, chunk(jsonBuf, 0x4e4f534a), chunk(bin, 0x004e4942)]);
}

mkdirSync("public/models", { recursive: true });
const logo = readFileSync(new URL("./solana-logo.png", import.meta.url));
const outputs = [
  ["public/models/attendee.glb", embedTexture(await exportGlb(buildPerson({ logo: true, backpack: true }), [idle, walk]), logo, "SolanaLogo")],
  ["public/models/person.glb", await exportGlb(buildPerson({ logo: false, backpack: false }), [idle])],
];
for (const [path, buf] of outputs) {
  writeFileSync(path, buf);
  console.log(`${path} written (${(buf.length / 1024).toFixed(0)} KB)`);
}
