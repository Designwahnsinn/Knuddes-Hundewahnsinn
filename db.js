const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "materials.json");

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, "[]");
}

function getMaterials() {
  ensureStore();
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

function saveMaterials(materials) {
  ensureStore();
  fs.writeFileSync(DB_FILE, JSON.stringify(materials, null, 2));
}

function addMaterial(material) {
  const materials = getMaterials();
  materials.unshift(material);
  saveMaterials(materials);
  return material;
}

function deleteMaterial(id) {
  const materials = getMaterials();
  const target = materials.find((m) => m.id === id);
  saveMaterials(materials.filter((m) => m.id !== id));
  return target;
}

module.exports = { getMaterials, addMaterial, deleteMaterial };
