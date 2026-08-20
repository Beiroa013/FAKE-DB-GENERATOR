import { DatabaseSchema, TableSchema, ColumnSchema } from '../types/schema.js';
import { sortTablesByDependencies } from '../utils/topologicalSort.js';
import { generateValueByDataType } from './valueGenerator.js';

// Representa un registro generado como un objeto clave-valor
export type RowData = Record<string, any>;

// Estructura del resultado final con los datos de todas las tablas ordenadas
export type GeneratedDatabaseData = Record<string, RowData[]>;

/**
 * Función auxiliar para obtener un número entero aleatorio en el rango cerrado [min, max].
 */
function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Selecciona aleatoriamente un subconjunto de elementos de un array.
 * Garantiza que al menos se elija 1 elemento si el array no está vacío.
 */
function getRandomSubset<T>(array: T[]): T[] {
    if (array.length === 0) return [];
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    const countToPick = getRandomInt(1, array.length);
    return shuffled.slice(0, countToPick);
}

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

        // Identificar todas las columnas de esta tabla que permiten NULLs y no son PKs
        const nullableColumns = table.columns.filter(col => col.isNullable && !col.isPk);

        // --- GESTIÓN DE AUTOINCREMENTALES ---
        // Lleva la secuencia secuencial (1, 2, 3...) para columnas marcadas como isAutoIncrement
        const autoIncrementCounters = new Map<string, number>();
        table.columns.forEach(col => {
            if (col.isAutoIncrement) {
                autoIncrementCounters.set(col.name, 1);
            }
        });

        // --- ESTRUCTURAS Y ESTADOS PARA AMBOS MODOS DE NULLS ---

        // A) MODO POR COLUMNA ('per-column'): Contadores y objetivos independientes
        const colCounters = new Map<string, number>();
        const colTargets = new Map<string, number>();

        nullableColumns.forEach(col => {
            if (col.nullabilityConfig && col.nullabilityConfig.mode === 'per-column') {
                colCounters.set(col.name, 0);
                const initialTarget = getRandomInt(
                    col.nullabilityConfig.minInterval,
                    col.nullabilityConfig.maxInterval
                );
                colTargets.set(col.name, initialTarget);
            }
        });

        // B) MODO POR FILA ('per-row'): Contador y objetivo unificado a nivel de inserción
        let rowCounter = 0;
        const rowConfigColumn = nullableColumns.find(
            col => col.nullabilityConfig && col.nullabilityConfig.mode === 'per-row'
        );
        const rowConfig = rowConfigColumn?.nullabilityConfig;

        let rowTarget = rowConfig
            ? getRandomInt(rowConfig.minInterval, rowConfig.maxInterval)
            : null;

        // --- BUCLE PRINCIPAL DE INSERCIÓN DE REGISTROS ---
        for (let i = 0; i < table.rowCount; i++) {
            const row: RowData = {};
            rowCounter++;

            // Evaluamos si el MODO POR FILA se activa en esta iteración
            let isRowModeNullActive = false;
            if (rowConfig && rowTarget !== null) {
                if (rowCounter >= rowTarget) {
                    isRowModeNullActive = true;
                    rowCounter = 0; // Reiniciamos contador de filas
                    rowTarget = getRandomInt(rowConfig.minInterval, rowConfig.maxInterval);
                }
            }

            // Si el MODO POR FILA está activo, elegimos aleatoriamente un grupo de columnas con modo 'per-row' para vaciar
            const rowColumnsToNull = isRowModeNullActive
                ? getRandomSubset(nullableColumns.filter(c => c.nullabilityConfig?.mode === 'per-row')).map(c => c.name)
                : [];

            table.columns.forEach((column: ColumnSchema) => {
                let shouldBeNull = false;

                if (column.isNullable && !column.isPk) {
                    // IF PRINCIPAL: EVALUACIÓN SEGÚN EL MODO CONFIGURADO
                    if (column.nullabilityConfig) {

                        // OPCIÓN A: MODO POR FILA ('per-row')
                        if (column.nullabilityConfig.mode === 'per-row') {
                            if (rowColumnsToNull.includes(column.name)) {
                                shouldBeNull = true;
                            }
                        }
                        // OPCIÓN B: MODO POR COLUMNA ('per-column')
                        else if (column.nullabilityConfig.mode === 'per-column') {
                            const currentCounter = (colCounters.get(column.name) || 0) + 1;
                            const target = colTargets.get(column.name) || column.nullabilityConfig.minInterval;

                            if (currentCounter >= target) {
                                shouldBeNull = true;
                                colCounters.set(column.name, 0); // Reiniciar contador de esta columna
                                const newTarget = getRandomInt(
                                    column.nullabilityConfig.minInterval,
                                    column.nullabilityConfig.maxInterval
                                );
                                colTargets.set(column.name, newTarget);
                            } else {
                                colCounters.set(column.name, currentCounter);
                            }
                        }

                    }
                    // OPCIÓN C: SIN CONFIGURACIÓN (Probabilidad por defecto del 20%)
                    else if (Math.random() < 0.2) {
                        shouldBeNull = true;
                    }
                }

                // --- ASIGNACIÓN DE VALORES AL REGISTRO ---
                // CASO 1: Es columna Autoincremental -> Asignar número secuencial
                if (column.isAutoIncrement) {
                    const currentVal = autoIncrementCounters.get(column.name) || 1;
                    row[column.name] = currentVal;
                    autoIncrementCounters.set(column.name, currentVal + 1);
                }
                // CASO 2: Dejar celda como NULL
                else if (shouldBeNull) {
                    row[column.name] = null;
                }
                // CASO 3: Es Foreign Key (FK) -> Asignar una PK existente de la tabla padre
                else if (column.foreignKey) {
                    const parentTable = column.foreignKey.targetTable;
                    const parentPKs = primaryKeyMap.get(parentTable) || [];

                    if (parentPKs.length === 0) {
                        throw new Error(
                            `Error: No existen registros o claves primarias en la tabla padre '${parentTable}' para la FK '${table.name}.${column.name}'.`
                        );
                    }

                    const randomParentPk = parentPKs[Math.floor(Math.random() * parentPKs.length)];
                    row[column.name] = randomParentPk;
                }
                // CASO 4: Generación regular por DataType
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