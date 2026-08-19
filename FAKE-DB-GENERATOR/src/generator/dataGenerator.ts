import { DatabaseSchema, TableSchema } from '../types/schema.js';
import { sortTablesByDependencies } from '../utils/topologicalSort.js';
import { generateValueByDataType } from './valueGenerator.js';

// Representa un registro generado como un objeto clave-valor (ej. { id: 1, name: 'Juan' })
export type RowData = Record<string, any>;

// Estructura del resultado final con los datos de todas las tablas ordenadas por nombre
export type GeneratedDatabaseData = Record<string, RowData[]>;

/**
 * Genera todos los registros ficticios para un esquema completo de base de datos.
 * 
 * @param schema Esquema de la base de datos a poblar
 * @returns Objeto con las tablas como claves y sus arreglos de filas como valores
 */
export function generateDatabaseData(schema: DatabaseSchema): GeneratedDatabaseData {
    // 1. Ordenar tablas usando la ordenación topológica para respetar jerarquía de FKs
    const sortedTables = sortTablesByDependencies(schema.tables);

    // 2. Almacén de filas generadas por tabla
    const generatedData: GeneratedDatabaseData = {};

    // 3. Mapa para guardar las claves primarias (PK) generadas por cada tabla: { 'users': [1, 2, 3] }
    const primaryKeyMap = new Map<string, any[]>();

    sortedTables.forEach((table: TableSchema) => {
        const tableRows: RowData[] = [];
        const generatedPKs: any[] = [];

        // Buscar la columna marcada como Clave Primaria (PK)
        const pkColumn = table.columns.find(col => col.isPk);

        for (let i = 0; i < table.rowCount; i++) {
            const row: RowData = {};

            table.columns.forEach(column => {
                // CASO 1: Es Foreign Key (FK) -> Seleccionar una PK existente de la tabla padre
                if (column.foreignKey) {
                    const parentTable = column.foreignKey.targetTable;
                    const parentPKs = primaryKeyMap.get(parentTable) || [];

                    if (parentPKs.length === 0) {
                        throw new Error(
                            `Error: No existen registros o claves primarias en la tabla padre '${parentTable}' para la FK '${table.name}.${column.name}'.`
                        );
                    }

                    // Seleccionar una PK del padre de forma aleatoria
                    const randomParentPk = parentPKs[Math.floor(Math.random() * parentPKs.length)];
                    row[column.name] = randomParentPk;
                }
                // CASO 2: Manejo de Nulos opcionales (~20% de probabilidad si es nullable)
                else if (column.isNullable && !column.isPk && Math.random() < 0.2) {
                    row[column.name] = null;
                }
                // CASO 3: Generación regular por DataType
                else {
                    row[column.name] = generateValueByDataType(column.type);
                }
            });

            tableRows.push(row);

            // Guardar la PK de esta fila para resolver dependencias de tablas hijas
            if (pkColumn) {
                generatedPKs.push(row[pkColumn.name]);
            }
        }

        generatedData[table.name] = tableRows;

        if (pkColumn) {
            primaryKeyMap.set(table.name, generatedPKs);
        }
    });

    return generatedData;
}