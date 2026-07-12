const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const MATERIALS_FILE = path.join(DATA_DIR, "materials.json");
const REQUESTS_FILE = path.join(DATA_DIR, "requests.json");

function ensureStore(file) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, "[]");
}

function readAll(file) {
  ensureStore(file);
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function writeAll(file, items) {
  ensureStore(file);
  fs.writeFileSync(file, JSON.stringify(items, null, 2));
}

function getMaterials() {
  return readAll(MATERIALS_FILE);
}

function addMaterial(material) {
  const materials = getMaterials();
  materials.unshift(material);
  writeAll(MATERIALS_FILE, materials);
  return material;
}

function deleteMaterial(id) {
  const materials = getMaterials();
  const target = materials.find((m) => m.id === id);
  writeAll(MATERIALS_FILE, materials.filter((m) => m.id !== id));
  return target;
}

function getRequests() {
  return readAll(REQUESTS_FILE);
}

function addRequest(request) {
  const requests = getRequests();
  requests.unshift(request);
  writeAll(REQUESTS_FILE, requests);
  return request;
}

function deleteRequest(id) {
  const requests = getRequests();
  const target = requests.find((r) => r.id === id);
  writeAll(REQUESTS_FILE, requests.filter((r) => r.id !== id));
  return target;
}

module.exports = {
  getMaterials,
  addMaterial,
  deleteMaterial,
  getRequests,
  addRequest,
  deleteRequest,
};
