// verificar.js
const Database = require("better-sqlite3");
const db = new Database("incidencias.db");

console.log("=".repeat(60));
console.log("🔍 VERIFICACIÓN DE MIGRACIÓN");
console.log("=".repeat(60));

// 1. Ver estructura de la tabla
console.log("\n📋 ESTRUCTURA DE LA TABLA:");
const columns = db.prepare("PRAGMA table_info(incidencias)").all();
console.log(`Total de columnas: ${columns.length}\n`);

columns.forEach(col => {
    console.log(`  ${col.name.padEnd(20)} ${col.type.padEnd(10)} ${col.dflt_value || 'NULL'}`);
});

// 2. Verificar nuevas columnas
console.log("\n🔎 NUEVAS COLUMNAS AGREGADAS:");
const nuevas = ['categoria', 'responsable', 'accion_correctiva', 'fecha_solucion', 'riesgo', 'tipo_peligro', 'impacto_ambiental', 'tipo_residuo'];
const columnNames = columns.map(c => c.name);

nuevas.forEach(col => {
    const existe = columnNames.includes(col);
    console.log(`  ${existe ? '✅' : '❌'} ${col}`);
});

// 3. Ver estadísticas
console.log("\n📊 ESTADÍSTICAS DE REGISTROS:");
const total = db.prepare("SELECT COUNT(*) as count FROM incidencias").get().count;
console.log(`Total de registros: ${total}`);

if (total > 0) {
    // Ver un registro de muestra
    const muestra = db.prepare("SELECT * FROM incidencias LIMIT 1").get();
    console.log("\n📝 MUESTRA DE REGISTRO:");
    console.log(`  ID: ${muestra.id}`);
    console.log(`  Nombre: ${muestra.nombre}`);
    console.log(`  Categoría: ${muestra.categoria || 'NULL'}`);
    console.log(`  Riesgo: ${muestra.riesgo || 'NULL'}`);
    console.log(`  Impacto Ambiental: ${muestra.impacto_ambiental || 'NULL'}`);
    console.log(`  Responsable: ${muestra.responsable || 'NULL'}`);
    console.log(`  Acción Correctiva: ${muestra.accion_correctiva || 'NULL'}`);
}

// 4. Distribución de categorías
console.log("\n📊 DISTRIBUCIÓN DE CATEGORÍAS:");
const categorias = db.prepare("SELECT categoria, COUNT(*) as count FROM incidencias GROUP BY categoria").all();
categorias.forEach(cat => {
    console.log(`  ${cat.categoria || 'NULL'}: ${cat.count} registros`);
});

// 5. Distribución de riesgos
console.log("\n📊 DISTRIBUCIÓN DE RIESGOS:");
const riesgos = db.prepare("SELECT riesgo, COUNT(*) as count FROM incidencias GROUP BY riesgo").all();
riesgos.forEach(riesgo => {
    console.log(`  ${riesgo.riesgo || 'NULL'}: ${riesgo.count} registros`);
});

console.log("\n" + "=".repeat(60));
console.log("✅ VERIFICACIÓN COMPLETADA");
console.log("=".repeat(60));

db.close();
