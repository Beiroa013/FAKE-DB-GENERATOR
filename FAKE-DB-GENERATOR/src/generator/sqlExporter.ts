import { DatabaseSchema } from '../types/schema.js';
import { GeneratedDatabaseData } from './dataGenerator.js';

/**
 * Convierte un valor de JS a una representación segura dentro de una sentencia SQL.
 */
function formatSqlValue(value: any): string {
    if (value === null || value === undefined) {
        return 'NULL';
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        return `${value}`;
    }
    // Escapar comillas simples para evitar errores de sintaxis o inyecciones
    const escaped = String(value).replace(/'/g, "''");
    return `'${escaped}'`;
}

/**
 * Genera el contenido completo de un archivo .sql con DDL (CREATE TABLE) y DML (INSERT).
 * 
 * @param schema Esquema configurado por el usuario
 * @param generatedData Datos de filas generados
 * @returns Cadena de texto con el script SQL completo
 */
export function generateSqlScript(schema: DatabaseSchema, generatedData: GeneratedDatabaseData): string {
    let sqlContent = `-- Script generado para la base de datos: ${schema.dbName}\n`;
    sqlContent += `-- Fecha de generación: ${new Date().toISOString()}\n\n`;

    // 1. Crear la Base de Datos
    sqlContent += `CREATE DATABASE IF NOT EXISTS \`${schema.dbName}\`;\n`;
    sqlContent += `USE \`${schema.dbName}\`;\n\n`;

    // 2. Generar CREATE TABLE para cada tabla
    schema.tables.forEach(table => {
        sqlContent += `CREATE TABLE IF NOT EXISTS \`${table.name}\` (\n`;

        const columnDefinitions = table.columns.map(col => {
            let def = `  \`${col.name}\` ${col.type}`;

            if (col.isPk) {
                def += ' PRIMARY KEY';
            }
            if (!col.isNullable) {
                def += ' NOT NULL';
            }
            if (col.foreignKey) {
                def += `, FOREIGN KEY (\`${col.name}\`) REFERENCES \`${col.foreignKey.targetTable}\`(\`${col.foreignKey.targetColumn}\`)`;
            }
            return def;
        });

        sqlContent += columnDefinitions.join(',\n');
        sqlContent += `\n);\n\n`;
    });

    // 3. Generar sentencias INSERT INTO ordenadas
    Object.keys(generatedData).forEach(tableName => {
        const rows = generatedData[tableName];
        if (rows.length === 0) return;

        sqlContent += `-- Inserciones para la tabla '${tableName}'\n`;

        const columnNames = Object.keys(rows[0]);
        const columnsHeader = columnNames.map(col => `\`${col}\``).join(', ');

        rows.forEach(row => {
            const values = columnNames.map(col => formatSqlValue(row[col])).join(', ');
            sqlContent += `INSERT INTO \`${tableName}\` (${columnsHeader}) VALUES (${values});\n`;
        });

        sqlContent += `\n`;
    });

    return sqlContent;
}