const gurtbandGrid = document.getElementById("gurtband-grid");
const stoffGrid = document.getElementById("stoff-grid");
const form = document.getElementById("request-form");
const message = document.getElementById("form-message");

let selectedGurtband = null;
let selectedStoff = null;

function el(tag, props, children) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  (children || []).forEach((c) => node.appendChild(c));
  return node;
}

function renderSwatch(material, grid, onSelect) {
  const swatch = el("button", { type: "button", className: "swatch" });
  swatch.dataset.id = material.id;
  swatch.appendChild(el("img", { src: material.image, alt: material.name }));
  swatch.appendChild(el("span", { textContent: material.name }));
  swatch.addEventListener("click", () => onSelect(material, swatch));
  grid.appendChild(swatch);
}

function selectGurtband(material, swatchEl) {
  selectedGurtband = material;
  [...gurtbandGrid.children].forEach((c) => c.classList.remove("selected"));
  swatchEl.classList.add("selected");
  document.getElementById("preview-gurtband").src = material.image;
  document.getElementById("preview-gurtband-name").textContent = material.name;
}

function selectStoff(material, swatchEl) {
  selectedStoff = material;
  [...stoffGrid.children].forEach((c) => c.classList.remove("selected"));
  swatchEl.classList.add("selected");
  document.getElementById("preview-stoff").src = material.image;
  document.getElementById("preview-stoff-name").textContent = material.name;
}

async function loadMaterials() {
  const res = await fetch("/api/materials");
  const materials = await res.json();

  const gurtbaender = materials.filter((m) => m.category === "Gurtbänder");
  const stoffe = materials.filter((m) => m.category !== "Gurtbänder");

  gurtbaender.forEach((m) => renderSwatch(m, gurtbandGrid, selectGurtband));
  stoffe.forEach((m) => renderSwatch(m, stoffGrid, selectStoff));
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  message.textContent = "";
  message.className = "";

  if (!selectedGurtband || !selectedStoff) {
    message.textContent = "Bitte wähle ein Gurtband und einen Stoff aus.";
    message.className = "error";
    return;
  }

  const formData = new FormData(form);
  const res = await fetch("/api/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: formData.get("name"),
      email: formData.get("email"),
      message: formData.get("message"),
      gurtbandId: selectedGurtband.id,
      stoffId: selectedStoff.id,
    }),
  });

  if (res.ok) {
    message.textContent = "Danke! Deine Anfrage ist bei uns eingegangen, wir melden uns.";
    message.className = "success";
    form.reset();
  } else {
    const data = await res.json().catch(() => ({}));
    message.textContent = data.error || "Fehler beim Senden der Anfrage.";
    message.className = "error";
  }
});

loadMaterials();
