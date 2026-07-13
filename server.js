// server.js
// Instalar dependencias: npm install express better-sqlite3 multer
// Iniciar: node server.js

const express  = require("express");
const Database = require("better-sqlite3");
const multer   = require("multer");
const path     = require("path");
const fs       = require("fs");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Base de datos ──────────────────────────────────────────────────────────
const db = new Database("incidencias.db");

// ── Carpeta uploads ────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// ── Multer: guardar imágenes en /uploads ───────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename:    (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e6);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // máx 5 MB
  fileFilter: (req, file, cb) => {
    /^image\//.test(file.mimetype) ? cb(null, true) : cb(new Error("Solo imágenes"));
  },
});

// ── Middlewares ────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(uploadsDir)); // servir fotos

// ── Ruta admin HTML ────────────────────────────────────────────────────────
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// ── POST /api/reportar (MEJORADO CON CLASIFICACIÓN DE MATRIZ IPERC MULTI-ISO) ───
app.post("/api/reportar", upload.single("foto"), (req, res) => {
  let { nombre, apellido, correo, pc_numero, problema, urgencia } = req.body;

  if (!nombre || !apellido || !correo || !pc_numero || !problema || !urgencia) {
    return res.status(400).json({ error: "Todos los campos son obligatorios." });
  }

  // 🤖 MOTOR DE CLASIFICACIÓN SEMÁNTICA - MATRIZ IPERC E ISOs INTEGRADAS
  // Evaluamos la naturaleza de la falla en origen para asociar las normas correspondientes
  if (problema.includes("[INF]")) {
    // 🔴 CASO CRÍTICO MIXTO (Activa las 3 ISOs simultáneamente: Riesgo en Planta)
    problema = `[ISO 45001 / ISO 9001 / ISO 14001] -> ${problema}`;
    urgencia = "Alta"; // Fuerza prioridad alta por seguridad ocupacional
    console.log(`🚨 [IPERC CRÍTICO]: Falla de Infraestructura en PC ${pc_numero}. Clasificado bajo las 3 ISOs integradas.`);
  } else if (problema.includes("[HW]")) {
    // 🟢 CASO DE HARDWARE (Activa Calidad de Servicio + Gestión Ambiental por desecho tecnológico)
    problema = `[ISO 9001 / ISO 14001] -> ${problema}`;
    console.log(`🔧 [IPERC MODERADO]: Recambio físico de Hardware en PC ${pc_numero}. Vinculado a Calidad y Residuo RAEE.`);
  } else {
    // 🔵 CASO DE SOFTWARE/CONFIGURACIÓN (Activa únicamente Calidad Educativa)
    problema = `[ISO 9001] -> ${problema}`;
    console.log(`💻 [IPERC CONTROLADO]: Incidencia lógica de Software en PC ${pc_numero}. Vinculado a Calidad de Servicio.`);
  }

  const foto = req.file ? req.file.filename : null;

  const stmt = db.prepare(`
    INSERT INTO incidencias (nombre, apellido, correo, pc_numero, problema, urgencia, foto)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(nombre, apellido, correo, pc_numero, problema, urgencia, foto);

  res.status(201).json({ message: "Incidencia registrada bajo normativa SIG.", id: info.lastInsertRowid });
});

// ── GET /api/incidencias (alumno) ──────────────────────────────────────────
app.get("/api/incidencias", (req, res) => {
  const rows = db.prepare("SELECT * FROM incidencias ORDER BY id DESC").all();
  res.json(rows);
});

// ── GET /api/admin/incidencias (admin) ────────────────────────────────────
app.get("/api/admin/incidencias", (req, res) => {
  const rows = db.prepare("SELECT * FROM incidencias ORDER BY id DESC").all();
  res.json(rows);
});

// ── POST /api/incidencias/cambiar-estado (MEJORADO CON TRAZABILIDAD ISO) ───
app.post("/api/incidencias/cambiar-estado", (req, res) => {
  const { id, nuevo_estado, accion_mitigacion } = req.body;
  const estados = ["Pendiente", "En Revisión", "Solucionado"];

  if (!id || !estados.includes(nuevo_estado)) {
    return res.status(400).json({ error: "id y nuevo_estado válidos son requeridos." });
  }

  let info;
  // ── REGLA DE TRAZABILIDAD Y CIERRE CORRECTIVO (ISO 9001 / ISO 14001) ──
  // Si pasa a Solucionado, adjuntamos la acción correctiva técnica sin dañar la base de datos
  if (nuevo_estado === "Solucionado" && accion_mitigacion) {
    const registroActual = db.prepare("SELECT problema FROM incidencias WHERE id = ?").get(id);
    const problemaActualizado = `${registroActual.problema} | [ACCION SIG]: ${accion_mitigacion}`;
    
    info = db.prepare("UPDATE incidencias SET estado = ?, problema = ? WHERE id = ?").run(nuevo_estado, problemaActualizado, id);
    console.log(`✅ [AUDITORÍA ISO 9001]: Cierre de ticket N.°${id} con mitigación: ${accion_mitigacion}`);
  } else {
    info = db.prepare("UPDATE incidencias SET estado = ? WHERE id = ?").run(nuevo_estado, id);
  }

  if (info.changes === 0) return res.status(404).json({ error: "Incidencia no encontrada." });
  res.json({ message: "Estado actualizado con trazabilidad SIG.", id, estado: nuevo_estado });
});

// ── Iniciar ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
  console.log(`🔧 Panel admin en http://localhost:${PORT}/admin`);
});