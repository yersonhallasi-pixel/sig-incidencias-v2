// init_db.js
// Ejecutar: node init_db.js
// Es seguro correrlo aunque ya tengas datos — no borra nada.

const Database = require("better-sqlite3");
const db = new Database("incidencias.db");

// Crear tabla si no existe
db.exec(`
  CREATE TABLE IF NOT EXISTS incidencias (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre              TEXT    NOT NULL,
    apellido            TEXT    NOT NULL,
    correo              TEXT    NOT NULL,
    pc_numero           TEXT    NOT NULL,
    problema            TEXT    NOT NULL,

    categoria           TEXT    DEFAULT 'Software',

    urgencia            TEXT    NOT NULL,
    foto                TEXT    DEFAULT NULL,

    fecha               TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
    estado              TEXT    NOT NULL DEFAULT 'Pendiente',

    responsable         TEXT    DEFAULT NULL,
    accion_correctiva   TEXT    DEFAULT NULL,
    fecha_solucion      TEXT    DEFAULT NULL,

    riesgo              TEXT    DEFAULT 'Bajo',
    tipo_peligro        TEXT    DEFAULT NULL,

    impacto_ambiental   TEXT    DEFAULT 'No',
    tipo_residuo        TEXT    DEFAULT NULL
  );
`);

// =======================
// MIGRACIONES SEGURAS
// =======================

// Foto
try {
  db.exec(`ALTER TABLE incidencias ADD COLUMN foto TEXT DEFAULT NULL;`);
  console.log("✅ Columna 'foto' agregada correctamente.");
} catch (_) {
  console.log("ℹ️ Columna 'foto' ya existía — sin cambios.");
}

// Categoría
try {
  db.exec(`ALTER TABLE incidencias ADD COLUMN categoria TEXT DEFAULT 'Software';`);
  console.log("✅ Columna 'categoria' agregada correctamente.");
} catch (_) {
  console.log("ℹ️ Columna 'categoria' ya existía — sin cambios.");
}

// Responsable
try {
  db.exec(`ALTER TABLE incidencias ADD COLUMN responsable TEXT DEFAULT NULL;`);
  console.log("✅ Columna 'responsable' agregada correctamente.");
} catch (_) {
  console.log("ℹ️ Columna 'responsable' ya existía — sin cambios.");
}

// Acción Correctiva
try {
  db.exec(`ALTER TABLE incidencias ADD COLUMN accion_correctiva TEXT DEFAULT NULL;`);
  console.log("✅ Columna 'accion_correctiva' agregada correctamente.");
} catch (_) {
  console.log("ℹ️ Columna 'accion_correctiva' ya existía — sin cambios.");
}

// Fecha de Solución
try {
  db.exec(`ALTER TABLE incidencias ADD COLUMN fecha_solucion TEXT DEFAULT NULL;`);
  console.log("✅ Columna 'fecha_solucion' agregada correctamente.");
} catch (_) {
  console.log("ℹ️ Columna 'fecha_solucion' ya existía — sin cambios.");
}

// Riesgo
try {
  db.exec(`ALTER TABLE incidencias ADD COLUMN riesgo TEXT DEFAULT 'Bajo';`);
  console.log("✅ Columna 'riesgo' agregada correctamente.");
} catch (_) {
  console.log("ℹ️ Columna 'riesgo' ya existía — sin cambios.");
}

// Tipo de Peligro
try {
  db.exec(`ALTER TABLE incidencias ADD COLUMN tipo_peligro TEXT DEFAULT NULL;`);
  console.log("✅ Columna 'tipo_peligro' agregada correctamente.");
} catch (_) {
  console.log("ℹ️ Columna 'tipo_peligro' ya existía — sin cambios.");
}

// Impacto Ambiental
try {
  db.exec(`ALTER TABLE incidencias ADD COLUMN impacto_ambiental TEXT DEFAULT 'No';`);
  console.log("✅ Columna 'impacto_ambiental' agregada correctamente.");
} catch (_) {
  console.log("ℹ️ Columna 'impacto_ambiental' ya existía — sin cambios.");
}

// Tipo de Residuo
try {
  db.exec(`ALTER TABLE incidencias ADD COLUMN tipo_residuo TEXT DEFAULT NULL;`);
  console.log("✅ Columna 'tipo_residuo' agregada correctamente.");
} catch (_) {
  console.log("ℹ️ Columna 'tipo_residuo' ya existía — sin cambios.");
}

console.log("✅ Base de datos lista: incidencias.db");
db.close();