const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const express = require("express");
const session = require("express-session");
const multer = require("multer");
const nodemailer = require("nodemailer");
const db = require("./db");

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "hundewahnsinn2026";
const SESSION_SECRET = process.env.SESSION_SECRET || "change-me-in-production";

const SMTP_CONFIGURED = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
const mailer = SMTP_CONFIGURED
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

async function notifyNewRequest(request) {
  if (!mailer) {
    console.log("SMTP nicht konfiguriert – E-Mail-Benachrichtigung übersprungen.");
    return;
  }
  try {
    await mailer.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.NOTIFY_EMAIL || process.env.SMTP_USER,
      subject: `Neue Konfigurator-Anfrage von ${request.name}`,
      text: [
        `Name: ${request.name}`,
        `E-Mail: ${request.email}`,
        `Gurtband: ${request.gurtband ? request.gurtband.name : "-"}`,
        `Stoff: ${request.stoff ? request.stoff.name : "-"}`,
        `Nachricht: ${request.message || "-"}`,
      ].join("\n"),
    });
  } catch (err) {
    console.error("E-Mail-Benachrichtigung fehlgeschlagen:", err.message);
  }
}

const UPLOADS_DIR = path.join(__dirname, "uploads");

const CATEGORIES = [
  "Gurtbänder",
  "Boho Bänder / Signalband",
  "Uni Stoffe",
  "Bunte Stoffe",
  "Exklusiv Stoffe",
];

const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 12 },
  })
);

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(UPLOADS_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ["image/png", "image/jpeg", "image/webp", "image/avif"].includes(file.mimetype);
    cb(ok ? null : new Error("Nur PNG, JPG, WEBP oder AVIF erlaubt"), ok);
  },
});

function requireAuth(req, res, next) {
  if (req.session.loggedIn) return next();
  res.redirect("/mitarbeiter");
}

// --- Public API ---
app.get("/api/materials", (req, res) => {
  res.json(db.getMaterials());
});

app.get("/api/categories", (req, res) => {
  res.json(CATEGORIES);
});

app.post("/api/requests", async (req, res) => {
  const { name, email, message, gurtbandId, stoffId } = req.body;
  if (!name || !email || !gurtbandId || !stoffId) {
    return res.status(400).json({ error: "Name, E-Mail, Gurtband und Stoff sind Pflichtfelder" });
  }

  const materials = db.getMaterials();
  const gurtband = materials.find((m) => m.id === gurtbandId);
  const stoff = materials.find((m) => m.id === stoffId);
  if (!gurtband || !stoff) {
    return res.status(400).json({ error: "Gewähltes Gurtband oder Stoff nicht gefunden" });
  }

  const request = db.addRequest({
    id: crypto.randomUUID(),
    name,
    email,
    message: message || "",
    gurtband: { id: gurtband.id, name: gurtband.name, image: gurtband.image },
    stoff: { id: stoff.id, name: stoff.name, image: stoff.image },
    createdAt: new Date().toISOString(),
  });

  notifyNewRequest(request);

  res.status(201).json({ ok: true });
});

// --- Login ---
app.get("/mitarbeiter", (req, res) => {
  if (req.session.loggedIn) return res.redirect("/mitarbeiter/upload");
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.post("/mitarbeiter/login", (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    req.session.loggedIn = true;
    return res.redirect("/mitarbeiter/upload");
  }
  res.redirect("/mitarbeiter?error=1");
});

app.post("/mitarbeiter/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// --- Protected admin area ---
app.get("/mitarbeiter/upload", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin.html"));
});

app.get("/api/admin/materials", requireAuth, (req, res) => {
  res.json(db.getMaterials());
});

app.post("/api/admin/materials", requireAuth, upload.single("image"), (req, res) => {
  const { name, category, price } = req.body;
  if (!name || !category || !req.file) {
    return res.status(400).json({ error: "Name, Kategorie und Bild sind Pflichtfelder" });
  }
  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({ error: "Ungültige Kategorie" });
  }
  const material = db.addMaterial({
    id: crypto.randomUUID(),
    name,
    category,
    price: price ? Number(price) : null,
    image: `/uploads/${req.file.filename}`,
    createdAt: new Date().toISOString(),
  });
  res.status(201).json(material);
});

app.delete("/api/admin/materials/:id", requireAuth, (req, res) => {
  const removed = db.deleteMaterial(req.params.id);
  if (!removed) return res.status(404).json({ error: "Nicht gefunden" });

  const filePath = path.join(UPLOADS_DIR, path.basename(removed.image));
  fs.unlink(filePath, () => {});

  res.json({ ok: true });
});

app.get("/api/admin/requests", requireAuth, (req, res) => {
  res.json(db.getRequests());
});

app.delete("/api/admin/requests/:id", requireAuth, (req, res) => {
  const removed = db.deleteRequest(req.params.id);
  if (!removed) return res.status(404).json({ error: "Nicht gefunden" });
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Knuddels Hundewahnsinn läuft auf http://localhost:${PORT}`);
});
