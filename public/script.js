const searchInput = document.getElementById("material-search");
const groupsEl = document.getElementById("material-groups");
const noResults = document.getElementById("no-results");
const emptyState = document.getElementById("empty-state");

let allMaterials = [];

function el(tag, props, children) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  (children || []).forEach((c) => node.appendChild(c));
  return node;
}

function formatPrice(price) {
  return price != null ? `${Number(price).toFixed(2)} €` : "";
}

function renderGroups(materials) {
  groupsEl.innerHTML = "";
  const byCategory = new Map();
  materials.forEach((m) => {
    if (!byCategory.has(m.category)) byCategory.set(m.category, []);
    byCategory.get(m.category).push(m);
  });

  byCategory.forEach((items, category) => {
    groupsEl.appendChild(el("h3", { className: "category-heading", textContent: category }));
    const cardsEl = el("div", { className: "cards" });
    items.forEach((m) => {
      const card = el("article", { className: "card" });
      card.appendChild(el("img", { src: m.image, alt: m.name, className: "card-thumb" }));
      card.appendChild(el("h3", { textContent: m.name }));
      card.appendChild(el("p", { className: "price", textContent: formatPrice(m.price) }));
      cardsEl.appendChild(card);
    });
    groupsEl.appendChild(cardsEl);
  });
}

async function loadMaterials() {
  const res = await fetch("/api/materials");
  allMaterials = await res.json();
  renderGroups(allMaterials);
  emptyState.hidden = allMaterials.length !== 0;
}

searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = allMaterials.filter((m) =>
    `${m.name} ${m.category}`.toLowerCase().includes(query)
  );
  renderGroups(filtered);
  noResults.hidden = filtered.length !== 0 || allMaterials.length === 0;
  emptyState.hidden = allMaterials.length !== 0;
});

loadMaterials();
