import { DatabaseSchema, TableSchema, DataType } from '../types/schema.js';
import { sortTablesByDependencies } from '../utils/topologicalSort.js';
import { GeneratedDatabaseData } from './dataGenerator.js';


/**
 * Mapea los tipos de datos de la aplicación (DataType) a tipos de datos nativos de SQL.
 * Convierte tipos como EMAIL o PHONE a VARCHAR válidos para el motor de base de datos.
 * 
 * @param type Tipo de dato proveniente del esquema
 * @returns Tipo de dato SQL correspondiente
 */
function mapDataTypeToSql(type: DataType): string {
    switch (type) {
        case 'INT':
            return 'INT';
        case 'FLOAT':
            return 'FLOAT';
        case 'VARCHAR':
            return 'VARCHAR(255)';
        case 'NVARCHAR':
            return 'NVARCHAR(255)';
        case 'TEXT':
            return 'TEXT';
        case 'BOOLEAN':
            return 'BOOLEAN';
        case 'DATE':
            return 'DATE';
        case 'DATETIME':
            return 'DATETIME';
        case 'UUID':
            return 'CHAR(36)';
        case 'EMAIL':
            return 'VARCHAR(255)'; // EMAIL no es un tipo SQL nativo
        case 'PHONE':
            return 'VARCHAR(50)';  // PHONE no es un tipo SQL nativo
        default:
            return 'VARCHAR(255)';
    }
}

/**
 * Convierte un valor de JS a una representación segura dentro de una sentencia SQL.
 * 
 * @param value Valor JS a formatear
 * @returns Cadena de texto formateada para SQL
 */
function formatSqlValue(value: any): string {
    if (value === null || value === undefined) {
        return 'NULL';
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        return `${value}`;
    }
    // Escapar comillas simples duplicándolas para evitar errores de sintaxis o inyecciones (estándar SQL)
    const escaped = String(value).replace(/'/g, "''");
    return `'${escaped}'`;
}

/**
 * Genera el contenido completo de un archivo .sql con DDL (CREATE TABLE) y DML (INSERT).
 * Respetando el orden de dependencias de Foreign Keys tanto en creación como en inserción.
 * Omite las columnas AUTO_INCREMENT en los INSERT para que la BDD las gestione.
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

    // 2. Ordenar las tablas topológicamente (padres primero, hijas después)
    // Esto evita errores de referencia al ejecutar los 'CREATE TABLE' que contienen FKs
    const sortedTables = sortTablesByDependencies(schema.tables);

    // 3. Generar CREATE TABLE respetando el orden topológico
    sortedTables.forEach((table: TableSchema) => {
        sqlContent += `CREATE TABLE IF NOT EXISTS \`${table.name}\` (\n`;

        const columnDefinitions: string[] = [];
        const fkDefinitions: string[] = [];

        table.columns.forEach(col => {
            // Traducir el tipo de dato a SQL válido
            const sqlDataType = mapDataTypeToSql(col.type);
            let def = `  \`${col.name}\` ${sqlDataType}`;

            if (col.isPk) {
                def += ' PRIMARY KEY';
            }
            if (col.isAutoIncrement) {
                def += ' AUTO_INCREMENT';
            }
            if (!col.isNullable) {
                def += ' NOT NULL';
            }

            columnDefinitions.push(def);

            // Guardar las restricciones FK para declararlas por separado al final de la tabla
            if (col.foreignKey) {
                fkDefinitions.push(
                    `  FOREIGN KEY (\`${col.name}\`) REFERENCES \`${col.foreignKey.targetTable}\`(\`${col.foreignKey.targetColumn}\`)`
                );
            }
        });

        // Combinar definiciones de columnas y restricciones Foreign Key en una sola lista
        const allDefinitions = [...columnDefinitions, ...fkDefinitions];
        sqlContent += allDefinitions.join(',\n');
        sqlContent += `\n);\n\n`;
    });

    // 4. Generar sentencias INSERT INTO en el mismo orden topológico
    sortedTables.forEach((table: TableSchema) => {
        const rows = generatedData[table.name];
        if (!rows || rows.length === 0) return;

        sqlContent += `-- Inserciones para la tabla '${table.name}'\n`;

        // Filtramos las columnas que NO son autoincrementales para excluirlas del INSERT INTO
        const columnsToInsert = table.columns.filter(col => !col.isAutoIncrement);
        const columnNames = columnsToInsert.map(col => col.name);
        const columnsHeader = columnNames.map(col => `\`${col}\``).join(', ');

        rows.forEach(row => {
            const values = columnNames.map(col => formatSqlValue(row[col])).join(', ');
            sqlContent += `INSERT INTO \`${table.name}\` (${columnsHeader}) VALUES (${values});\n`;
        });

        sqlContent += `\n`;
    });

    return sqlContent;
}

/**
 * Descarga el script SQL generado como un archivo .sql utilizando el nombre de la base de datos (dbName).
 * 
 * @param schema Esquema configurado por el usuario
 * @param generatedData Datos de filas generados
 */
export function downloadSqlFile(schema: DatabaseSchema, generatedData: GeneratedDatabaseData): void {
    const sqlContent = generateSqlScript(schema, generatedData);
    const fileName = `${(schema.dbName || 'database').trim().toLowerCase().replace(/\s+/g, '_')}.sql`;

    const blob = new Blob([sqlContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}