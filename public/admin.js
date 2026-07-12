const form = document.getElementById("upload-form");
const message = document.getElementById("form-message");
const cardsEl = document.getElementById("admin-cards");
const categorySelect = document.getElementById("category");
const requestListEl = document.getElementById("request-list");
const requestEmptyEl = document.getElementById("request-empty");

function el(tag, props, children) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  (children || []).forEach((c) => node.appendChild(c));
  return node;
}

function formatPrice(price) {
  return price != null ? `${Number(price).toFixed(2)} €` : "";
}

async function loadCategories() {
  const res = await fetch("/api/categories");
  const categories = await res.json();
  categorySelect.innerHTML = "";
  categories.forEach((c) => {
    categorySelect.appendChild(el("option", { value: c, textContent: c }));
  });
}

async function loadMaterials() {
  const res = await fetch("/api/admin/materials");
  const materials = await res.json();
  cardsEl.innerHTML = "";
  materials.forEach((m) => {
    const img = el("img", { src: m.image, alt: m.name });
    const deleteBtn = el("button", { className: "delete-btn", textContent: "Löschen" });
    deleteBtn.dataset.id = m.id;
    const body = el("div", { className: "admin-card-body" }, [
      el("p", { className: "category", textContent: m.category }),
      el("h3", { textContent: m.name }),
      el("p", { className: "price", textContent: formatPrice(m.price) }),
      deleteBtn,
    ]);
    const card = el("div", { className: "admin-card" }, [img, body]);
    cardsEl.appendChild(card);
  });
}

cardsEl.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("delete-btn")) return;
  const id = e.target.dataset.id;
  if (!confirm("Dieses Material wirklich löschen?")) return;
  await fetch(`/api/admin/materials/${id}`, { method: "DELETE" });
  loadMaterials();
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  message.textContent = "";
  message.className = "";

  const formData = new FormData(form);
  const res = await fetch("/api/admin/materials", { method: "POST", body: formData });

  if (res.ok) {
    message.textContent = "Material hochgeladen.";
    message.className = "success";
    form.reset();
    loadMaterials();
  } else {
    const data = await res.json().catch(() => ({}));
    message.textContent = data.error || "Fehler beim Hochladen.";
    message.className = "error";
  }
});

function formatDate(iso) {
  return new Date(iso).toLocaleString("de-DE");
}

async function loadRequests() {
  const res = await fetch("/api/admin/requests");
  const requests = await res.json();
  requestListEl.innerHTML = "";
  requestEmptyEl.hidden = requests.length !== 0;

  requests.forEach((r) => {
    const deleteBtn = el("button", { className: "delete-btn", textContent: "Löschen" });
    deleteBtn.dataset.id = r.id;

    const choices = el("div", { className: "choices" }, [
      el("div", {}, [
        el("img", { src: r.gurtband.image, alt: r.gurtband.name }),
        el("span", { textContent: r.gurtband.name }),
      ]),
      el("div", {}, [
        el("img", { src: r.stoff.image, alt: r.stoff.name }),
        el("span", { textContent: r.stoff.name }),
      ]),
    ]);

    const info = el("div", { className: "request-info" }, [
      el("h3", { textContent: r.name }),
      el("p", { className: "contact", textContent: `${r.email} · ${formatDate(r.createdAt)}` }),
      choices,
      r.message ? el("p", { className: "note", textContent: r.message }) : el("span"),
    ]);

    const card = el("div", { className: "request-card" }, [info, deleteBtn]);
    requestListEl.appendChild(card);
  });
}

requestListEl.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("delete-btn")) return;
  const id = e.target.dataset.id;
  if (!confirm("Diese Anfrage wirklich löschen?")) return;
  await fetch(`/api/admin/requests/${id}`, { method: "DELETE" });
  loadRequests();
});

loadCategories();
loadMaterials();
loadRequests();
