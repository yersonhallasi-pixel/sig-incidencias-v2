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

// ── POST /api/reportar (MEJORADO CON CLASIFICACIÓN AUTOMÁTICA MULTI-ISO) ───
app.post("/api/reportar", upload.single("foto"), (req, res) => {
  let { nombre, apellido, correo, pc_numero, problema, urgencia } = req.body;

  if (!nombre || !apellido || !correo || !pc_numero || !problema || !urgencia) {
    return res.status(400).json({ error: "Todos los campos son obligatorios." });
  }

  // ============================================================
  // 🤖 NUEVO MOTOR DE CLASIFICACIÓN AUTOMÁTICA
  // ============================================================
  const texto = problema.toLowerCase();
  
  // Variables para los nuevos campos
  let categoria = 'Software';
  let riesgo = 'Bajo';
  let impacto_ambiental = 'No';
  let tipo_peligro = null;
  let tipo_residuo = null;
  let problemaClasificado = problema;

  // --- 1. CLASIFICACIÓN POR CATEGORÍA (ISO 9001) ---
  if (texto.includes('pantalla') || texto.includes('monitor') || texto.includes('mouse') ||
      texto.includes('teclado') || texto.includes('hardware') || texto.includes('disco duro') ||
      texto.includes('memoria ram') || texto.includes('fuente de poder') || texto.includes('[hw]')) {
      categoria = 'Hardware';
  } else if (texto.includes('windows') || texto.includes('office') || texto.includes('programa') ||
             texto.includes('software') || texto.includes('aplicación') || texto.includes('sistema operativo') ||
             texto.includes('virus') || texto.includes('antivirus')) {
      categoria = 'Software';
  } else if (texto.includes('internet') || texto.includes('wifi') || texto.includes('red') ||
             texto.includes('conexión') || texto.includes('cable de red') || texto.includes('puerto')) {
      categoria = 'Red';
  } else if (texto.includes('cable') || texto.includes('enchufe') || texto.includes('eléctrico') ||
             texto.includes('tomacorriente') || texto.includes('infraestructura') || texto.includes('pared') ||
             texto.includes('piso') || texto.includes('techo') || texto.includes('[inf]')) {
      categoria = 'Infraestructura';
  }

  // --- 2. EVALUACIÓN DE RIESGO Y PELIGRO (ISO 45001) ---
  if (categoria === 'Infraestructura' || texto.includes('cable expuesto') || texto.includes('caída') ||
      texto.includes('incendio') || texto.includes('humo') || texto.includes('chispa') || texto.includes('[inf]')) {
      riesgo = 'Alto';
      if (texto.includes('cable') || texto.includes('eléctrico') || texto.includes('enchufe')) {
          tipo_peligro = 'Eléctrico';
      } else if (texto.includes('caída')) {
          tipo_peligro = 'Caída';
      } else if (texto.includes('incendio') || texto.includes('humo') || texto.includes('chispa')) {
          tipo_peligro = 'Incendio';
      } else {
          tipo_peligro = 'Infraestructura';
      }
  } else if (texto.includes('virus') || texto.includes('error grave') || texto.includes('pérdida de datos')) {
      riesgo = 'Medio';
  }

  // --- 3. EVALUACIÓN DE IMPACTO AMBIENTAL (ISO 14001) ---
  if (texto.includes('batería') || texto.includes('toner') || texto.includes('residuo') ||
      texto.includes('químico') || texto.includes('contaminación') || texto.includes('reciclaje') ||
      texto.includes('derrame') || texto.includes('lámpara') || texto.includes('foco')) {
      impacto_ambiental = 'Sí';
      if (texto.includes('batería')) {
          tipo_residuo = 'Batería';
      } else if (texto.includes('toner')) {
          tipo_residuo = 'Tóner';
      } else if (texto.includes('lámpara') || texto.includes('foco')) {
          tipo_residuo = 'Lámpara';
      } else {
          tipo_residuo = 'RAEE';
      }
  }

  // --- 4. ACTUALIZAR PROBLEMA CON ETIQUETAS ISO (MANTIENE COMPATIBILIDAD) ---
  if (categoria === 'Infraestructura' && riesgo === 'Alto') {
      // 🔴 CASO CRÍTICO MIXTO (Activa las 3 ISOs simultáneamente)
      problemaClasificado = `[ISO 45001 / ISO 9001 / ISO 14001] - ${categoria} - ${problema}`;
      urgencia = "Alta"; // Fuerza prioridad alta por seguridad ocupacional
      console.log(`🚨 [IPERC CRÍTICO]: Falla de Infraestructura en PC ${pc_numero}. Clasificado bajo las 3 ISOs integradas.`);
  } else if (categoria === 'Hardware') {
      // 🟢 CASO DE HARDWARE (Activa Calidad + Ambiental)
      problemaClasificado = `[ISO 9001 / ISO 14001] - ${categoria} - ${problema}`;
      console.log(`🔧 [IPERC MODERADO]: Recambio físico de Hardware en PC ${pc_numero}. Vinculado a Calidad y Residuo RAEE.`);
  } else {
      // 🔵 CASO DE SOFTWARE/CONFIGURACIÓN (Activa únicamente Calidad)
      problemaClasificado = `[ISO 9001] - ${categoria} - ${problema}`;
      console.log(`💻 [IPERC CONTROLADO]: Incidencia lógica de Software en PC ${pc_numero}. Vinculado a Calidad de Servicio.`);
  }

  const foto = req.file ? req.file.filename : null;

  // ============================================================
  // 📝 NUEVO INSERT CON TODOS LOS CAMPOS
  // ============================================================
  const stmt = db.prepare(`
    INSERT INTO incidencias (
      nombre, apellido, correo, pc_numero, problema,
      categoria, urgencia, foto,
      riesgo, tipo_peligro, impacto_ambiental, tipo_residuo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const info = stmt.run(
    nombre, apellido, correo, pc_numero, problemaClasificado,
    categoria, urgencia, foto,
    riesgo, tipo_peligro, impacto_ambiental, tipo_residuo
  );

  console.log(`✅ Incidencia #${info.lastInsertRowid} registrada con clasificación automática:`);
  console.log(`   📂 Categoría: ${categoria}`);
  console.log(`   ⚠️  Riesgo: ${riesgo}`);
  console.log(`   🌱 Impacto Ambiental: ${impacto_ambiental}`);
  
  res.status(201).json({ 
    message: "Incidencia registrada bajo normativa SIG.", 
    id: info.lastInsertRowid,
    clasificacion: { categoria, riesgo, impacto_ambiental, tipo_peligro, tipo_residuo }
  });
});

// ── GET /api/incidencias (alumno) ──────────────────────────────────────────
app.get("/api/incidencias", (req, res) => {
  const rows = db.prepare("SELECT * FROM incidencias ORDER BY id DESC").all();
  res.json(rows);
});

// ── GET /api/admin/incidencias (admin) ────────────────────────────────────
app.get("/api/admin/incidencias", (req, res) => {
  // Obtenemos todas las incidencias con los nuevos campos
  const rows = db.prepare(`
    SELECT 
      id, nombre, apellido, correo, pc_numero, problema,
      categoria, urgencia, foto, fecha, estado,
      responsable, accion_correctiva, fecha_solucion,
      riesgo, tipo_peligro, impacto_ambiental, tipo_residuo
    FROM incidencias 
    ORDER BY id DESC
  `).all();
  res.json(rows);
});

// ── GET /api/admin/incidencias/filtrar (NUEVO: FILTROS AVANZADOS) ────────
app.get("/api/admin/incidencias/filtrar", (req, res) => {
  const { estado, categoria, riesgo, impacto_ambiental, laboratorio } = req.query;
  
  let query = "SELECT * FROM incidencias WHERE 1=1";
  const params = [];

  if (estado && estado !== 'todos') {
    query += " AND estado = ?";
    params.push(estado);
  }
  if (categoria && categoria !== 'todos') {
    query += " AND categoria = ?";
    params.push(categoria);
  }
  if (riesgo && riesgo !== 'todos') {
    query += " AND riesgo = ?";
    params.push(riesgo);
  }
  if (impacto_ambiental && impacto_ambiental !== 'todos') {
    query += " AND impacto_ambiental = ?";
    params.push(impacto_ambiental);
  }
  if (laboratorio && laboratorio !== 'todos') {
    query += " AND pc_numero LIKE ?";
    params.push(`%${laboratorio}%`);
  }

  query += " ORDER BY id DESC";
  
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

// ── POST /api/incidencias/cambiar-estado (MEJORADO CON CAMPOS ISO) ───
app.post("/api/incidencias/cambiar-estado", (req, res) => {
  const { 
    id, 
    nuevo_estado, 
    responsable, 
    accion_correctiva,
    accion_mitigacion  // Mantenemos compatibilidad con tu nombre original
  } = req.body;

  // Estados permitidos (mejorados para el ciclo PHVA)
  const estados = ["Registrado", "Asignado", "En Proceso", "Solucionado", "Verificado"];
  
  // Mantenemos compatibilidad con tus estados originales
  const estadosCompatibles = ["Pendiente", "En Revisión", "Solucionado"];
  const estadoFinal = estados.includes(nuevo_estado) ? nuevo_estado : 
                     (estadosCompatibles.includes(nuevo_estado) ? nuevo_estado : null);

  if (!id || !estadoFinal) {
    return res.status(400).json({ 
      error: "id y nuevo_estado válidos son requeridos.",
      estados_permitidos: estados
    });
  }

  try {
    // Verificamos que la incidencia exista
    const incidenciaActual = db.prepare("SELECT * FROM incidencias WHERE id = ?").get(id);
    if (!incidenciaActual) {
      return res.status(404).json({ error: "Incidencia no encontrada." });
    }

    let fechaSolucion = null;
    let problemaActualizado = incidenciaActual.problema;

    // Si se marca como Solucionado o Verificado, registramos la fecha
    if (estadoFinal === "Solucionado" || estadoFinal === "Verificado") {
      fechaSolucion = new Date().toISOString().replace('T', ' ').substring(0, 19);
      
      // Si hay acción correctiva, la agregamos al problema (manteniendo trazabilidad)
      const accion = accion_correctiva || accion_mitigacion || "Sin acción registrada";
      problemaActualizado = `${incidenciaActual.problema} | [ACCIÓN CORRECTIVA]: ${accion}`;
      
      console.log(`✅ [AUDITORÍA ISO 9001]: Cierre de ticket N.°${id} con mitigación: ${accion}`);
    }

    // Construimos la consulta de actualización dinámicamente
    let updateQuery = `
      UPDATE incidencias 
      SET estado = ?,
          fecha_solucion = COALESCE(?, fecha_solucion),
          problema = ?
    `;
    const params = [estadoFinal, fechaSolucion, problemaActualizado];

    // Si se proporciona responsable, lo actualizamos
    if (responsable !== undefined && responsable !== null && responsable !== '') {
      updateQuery += `, responsable = ?`;
      params.push(responsable);
    }

    // Si se proporciona acción correctiva, la guardamos en su campo dedicado
    const accionFinal = accion_correctiva || accion_mitigacion;
    if (accionFinal !== undefined && accionFinal !== null && accionFinal !== '') {
      updateQuery += `, accion_correctiva = ?`;
      params.push(accionFinal);
    }

    updateQuery += ` WHERE id = ?`;
    params.push(id);

    const stmt = db.prepare(updateQuery);
    const info = stmt.run(...params);

    if (info.changes === 0) {
      return res.status(404).json({ error: "Incidencia no encontrada." });
    }

    // Registramos el cambio en un log (para auditoría)
    console.log(`📋 [AUDITORÍA ISO ${estadoFinal === "Solucionado" || estadoFinal === "Verificado" ? "9001/14001/45001" : "9001"}]:`);
    console.log(`   Ticket #${id} -> Estado: ${estadoFinal}`);
    if (responsable) console.log(`   👤 Responsable: ${responsable}`);
    if (accionFinal) console.log(`   🔧 Acción: ${accionFinal}`);
    if (fechaSolucion) console.log(`   📅 Fecha solución: ${fechaSolucion}`);

    res.json({ 
      message: "Estado actualizado con trazabilidad SIG.", 
      id, 
      estado: estadoFinal,
      fecha_solucion: fechaSolucion,
      responsable: responsable || incidenciaActual.responsable,
      accion_correctiva: accionFinal || incidenciaActual.accion_correctiva
    });

  } catch (error) {
    console.error("❌ Error al actualizar estado:", error);
    res.status(500).json({ error: "Error interno al actualizar el estado." });
  }
});

// ── GET /api/admin/estadisticas (NUEVO: KPIs PARA ISO) ──────────────────
app.get("/api/admin/estadisticas", (req, res) => {
  try {
    const stats = {
      // ISO 9001: Indicadores de Calidad
      calidad: {
        total: db.prepare("SELECT COUNT(*) as count FROM incidencias").get().count,
        pendientes: db.prepare("SELECT COUNT(*) as count FROM incidencias WHERE estado IN ('Registrado', 'Pendiente', 'Asignado')").get().count,
        en_proceso: db.prepare("SELECT COUNT(*) as count FROM incidencias WHERE estado IN ('En Proceso', 'En Revisión')").get().count,
        solucionadas: db.prepare("SELECT COUNT(*) as count FROM incidencias WHERE estado IN ('Solucionado', 'Verificado')").get().count,
        por_categoria: db.prepare("SELECT categoria, COUNT(*) as count FROM incidencias GROUP BY categoria").all(),
        tiempo_promedio: db.prepare(`
          SELECT AVG(
            (strftime('%s', fecha_solucion) - strftime('%s', fecha)) / 3600.0
          ) as horas 
          FROM incidencias 
          WHERE fecha_solucion IS NOT NULL
        `).get().horas || 0
      },
      
      // ISO 14001: Indicadores Ambientales
      ambiental: {
        total_impacto: db.prepare("SELECT COUNT(*) as count FROM incidencias WHERE impacto_ambiental = 'Sí'").get().count,
        por_tipo_residuo: db.prepare("SELECT tipo_residuo, COUNT(*) as count FROM incidencias WHERE tipo_residuo IS NOT NULL GROUP BY tipo_residuo").all(),
        porcentaje_impacto: 0 // Se calcula después
      },
      
      // ISO 45001: Indicadores de Seguridad
      seguridad: {
        riesgo_alto: db.prepare("SELECT COUNT(*) as count FROM incidencias WHERE riesgo = 'Alto'").get().count,
        riesgo_medio: db.prepare("SELECT COUNT(*) as count FROM incidencias WHERE riesgo = 'Medio'").get().count,
        riesgo_bajo: db.prepare("SELECT COUNT(*) as count FROM incidencias WHERE riesgo = 'Bajo'").get().count,
        por_tipo_peligro: db.prepare("SELECT tipo_peligro, COUNT(*) as count FROM incidencias WHERE tipo_peligro IS NOT NULL GROUP BY tipo_peligro").all()
      }
    };

    // Calculamos porcentajes
    const total = stats.calidad.total;
    if (total > 0) {
      stats.ambiental.porcentaje_impacto = Math.round((stats.ambiental.total_impacto / total) * 100);
    }

    res.json(stats);
  } catch (error) {
    console.error("❌ Error al obtener estadísticas:", error);
    res.status(500).json({ error: "Error al obtener estadísticas." });
  }
});

// ── GET /api/admin/incidencias/:id (NUEVO: DETALLE DE INCIDENCIA) ──────
app.get("/api/admin/incidencias/:id", (req, res) => {
  const { id } = req.params;
  
  try {
    const incidencia = db.prepare(`
      SELECT 
        id, nombre, apellido, correo, pc_numero, problema,
        categoria, urgencia, foto, fecha, estado,
        responsable, accion_correctiva, fecha_solucion,
        riesgo, tipo_peligro, impacto_ambiental, tipo_residuo
      FROM incidencias 
      WHERE id = ?
    `).get(id);

    if (!incidencia) {
      return res.status(404).json({ error: "Incidencia no encontrada." });
    }

    res.json(incidencia);
  } catch (error) {
    console.error("❌ Error al obtener incidencia:", error);
    res.status(500).json({ error: "Error al obtener la incidencia." });
  }
});

// ── GET /api/admin/exportar (NUEVO: EXPORTAR REPORTE) ──────────────────
app.get("/api/admin/exportar", (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        id, nombre, apellido, correo, pc_numero, problema,
        categoria, urgencia, fecha, estado,
        responsable, accion_correctiva, fecha_solucion,
        riesgo, tipo_peligro, impacto_ambiental, tipo_residuo
      FROM incidencias 
      ORDER BY id DESC
    `).all();

    // Formateamos para exportación (CSV simple)
    let csv = "ID,Nombre,Apellido,Correo,PC,Problema,Categoría,Urgencia,Fecha,Estado,Responsable,Acción Correctiva,Fecha Solución,Riesgo,Tipo Peligro,Impacto Ambiental,Tipo Residuo\n";
    
    rows.forEach(row => {
      csv += `${row.id},"${row.nombre || ''}","${row.apellido || ''}","${row.correo || ''}","${row.pc_numero || ''}","${(row.problema || '').replace(/"/g, '""')}","${row.categoria || ''}","${row.urgencia || ''}","${row.fecha || ''}","${row.estado || ''}","${row.responsable || ''}","${(row.accion_correctiva || '').replace(/"/g, '""')}","${row.fecha_solucion || ''}","${row.riesgo || ''}","${row.tipo_peligro || ''}","${row.impacto_ambiental || ''}","${row.tipo_residuo || ''}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=incidencias_export.csv');
    res.send(csv);
  } catch (error) {
    console.error("❌ Error al exportar:", error);
    res.status(500).json({ error: "Error al exportar datos." });
  }
});

// ── Iniciar ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
  console.log(`🔧 Panel admin en http://localhost:${PORT}/admin`);
  console.log(`📊 API Estadísticas en http://localhost:${PORT}/api/admin/estadisticas`);
});