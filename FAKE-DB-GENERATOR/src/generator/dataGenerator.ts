import { DatabaseSchema, TableSchema, ColumnSchema } from '../types/schema.js';
import { sortTablesByDependencies } from '../utils/topologicalSort.js';
import { generateValueByColumn } from './valueGenerator.js';

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

    // 3. Mapa para guardar los registros/columnas generadas por tabla para resolución de FKs
    const tableDataMap = new Map<string, RowData[]>();

    sortedTables.forEach((table: TableSchema) => {
        const tableRows: RowData[] = [];
        const pkColumns = table.columns.filter(col => col.isPk);
        const hasCompositePk = pkColumns.length > 1;

        // Conjunto para controlar duplicados de claves primarias compuestas (ej: Alumno + Asignatura)
        const compositePkSet = new Set<string>();

        const nullableColumns = table.columns.filter(col => col.isNullable && !col.isPk);

        // Mapa para llevar el registro de valores únicos generados en esta tabla (para UNIQUE y PK simples)
        const uniqueValuesMap = new Map<string, Set<any>>();
        table.columns.forEach(col => {
            // Si es PK compuesta, la unicidad individual por columna no aplica si es FK
            if (col.isUnique || (col.isPk && !hasCompositePk)) {
                uniqueValuesMap.set(col.name, new Set());
            }
        });

        // --- GESTIÓN DE AUTOINCREMENTALES ---
        const autoIncrementCounters = new Map<string, number>();
        table.columns.forEach(col => {
            if (col.isAutoIncrement) {
                autoIncrementCounters.set(col.name, 1);
            }
        });

        // --- ESTRUCTURAS Y ESTADOS PARA LA CONFIGURACIÓN DE NULOS A NIVEL DE TABLA ---
        const nullConfig = table.nullabilityConfig || {
            mode: 'per-row',
            minInterval: 2,
            maxInterval: 3
        };

        // A) MODO POR COLUMNA ('per-column')
        const colCounters = new Map<string, number>();
        const colTargets = new Map<string, number>();

        if (nullConfig.mode === 'per-column') {
            nullableColumns.forEach(col => {
                colCounters.set(col.name, 0);
                const initialTarget = getRandomInt(nullConfig.minInterval, nullConfig.maxInterval);
                colTargets.set(col.name, initialTarget);
            });
        }

        // B) MODO POR FILA ('per-row')
        let rowCounter = 0;
        let rowTarget = nullConfig.mode === 'per-row'
            ? getRandomInt(nullConfig.minInterval, nullConfig.maxInterval)
            : null;

        // --- BUCLE PRINCIPAL DE INSERCIÓN DE REGISTROS ---
        for (let i = 0; i < table.rowCount; i++) {
            let row: RowData = {};
            let isRowValid = false;
            let rowAttempts = 0;
            const maxRowAttempts = 1000;

            // Bucle de intento para garantizar combinaciones únicas de claves primarias compuestas
            while (!isRowValid && rowAttempts < maxRowAttempts) {
                rowAttempts++;
                row = {};
                rowCounter++;

                // Evaluamos si el MODO POR FILA se activa en esta iteración
                let isRowModeNullActive = false;
                if (nullConfig.mode === 'per-row' && rowTarget !== null) {
                    if (rowCounter >= rowTarget) {
                        isRowModeNullActive = true;
                        rowCounter = 0;
                        rowTarget = getRandomInt(nullConfig.minInterval, nullConfig.maxInterval);
                    }
                }

                const rowColumnsToNull = isRowModeNullActive
                    ? getRandomSubset(nullableColumns).map(c => c.name)
                    : [];

                table.columns.forEach((column: ColumnSchema) => {
                    let shouldBeNull = false;

                    if (column.isNullable && !column.isPk) {
                        if (nullConfig.mode === 'per-row') {
                            if (rowColumnsToNull.includes(column.name)) {
                                shouldBeNull = true;
                            }
                        } else if (nullConfig.mode === 'per-column') {
                            const currentCounter = (colCounters.get(column.name) || 0) + 1;
                            const target = colTargets.get(column.name) || nullConfig.minInterval;

                            if (currentCounter >= target) {
                                shouldBeNull = true;
                                colCounters.set(column.name, 0);
                                const newTarget = getRandomInt(nullConfig.minInterval, nullConfig.maxInterval);
                                colTargets.set(column.name, newTarget);
                            } else {
                                colCounters.set(column.name, currentCounter);
                            }
                        }
                    }

                    // --- ASIGNACIÓN DE VALORES AL REGISTRO ---
                    // CASO 1: Columna Autoincremental
                    if (column.isAutoIncrement) {
                        const currentVal = autoIncrementCounters.get(column.name) || 1;
                        row[column.name] = currentVal;
                    }
                    // CASO 2: Valor NULL
                    else if (shouldBeNull) {
                        row[column.name] = null;
                    }
                    // CASO 3: Foreign Key (FK)
                    else if (column.foreignKey) {
                        const targetTable = column.foreignKey.targetTable;
                        const targetColumn = column.foreignKey.targetColumn;
                        const parentRows = tableDataMap.get(targetTable) || [];

                        if (parentRows.length === 0) {
                            throw new Error(
                                `Error: No existen registros en la tabla padre '${targetTable}' para la FK '${table.name}.${column.name}'.`
                            );
                        }

                        // Extraer los valores disponibles de la columna destino en la tabla padre
                        const availableValues = parentRows
                            .map(r => r[targetColumn])
                            .filter(v => v !== null && v !== undefined);

                        if (availableValues.length === 0) {
                            throw new Error(
                                `Error: No hay valores disponibles en '${targetTable}.${targetColumn}' para la FK '${table.name}.${column.name}'.`
                            );
                        }

                        const randomParentValue = availableValues[Math.floor(Math.random() * availableValues.length)];
                        row[column.name] = randomParentValue;
                    }
                    // CASO 4: Generación regular por tipo de dato / lista personalizada
                    else {
                        const isUniqueRequired = column.isUnique || (column.isPk && !hasCompositePk);
                        const existingSet = uniqueValuesMap.get(column.name);

                        let generatedVal: any;
                        let attempts = 0;
                        const maxAttempts = 1000;

                        do {
                            generatedVal = generateValueByColumn(column);
                            attempts++;

                            if (attempts > maxAttempts && isUniqueRequired) {
                                console.warn(`[Warning]: Rango/Valores agotados para la columna '${column.name}'. Se asigna fallback único.`);
                                if (typeof generatedVal === 'number') {
                                    generatedVal = generatedVal + i + Date.now();
                                } else {
                                    generatedVal = `${generatedVal}_${i}`;
                                }
                                break;
                            }
                        } while (isUniqueRequired && existingSet && existingSet.has(generatedVal));

                        row[column.name] = generatedVal;
                    }
                });

                // Validación para Claves Primarias Compuestas (evitar tuplas duplicadas)
                if (hasCompositePk) {
                    const compositeKeyString = pkColumns.map(c => row[c.name]).join('___');
                    if (!compositePkSet.has(compositeKeyString)) {
                        compositePkSet.add(compositeKeyString);
                        isRowValid = true;
                    }
                } else {
                    isRowValid = true;
                }
            }

            // Si se agotaron las combinaciones posibles en una PK compuesta (ej. 8 alumnos x 8 asignaturas = max 64 combinaciones)
            if (!isRowValid) {
                console.warn(`[Warning]: No se pudieron generar más registros únicos para la tabla '${table.name}' debido al número de combinaciones máximas de la Clave Primaria.`);
                break;
            }

            // Registrar y actualizar contadores para columnas autoincrementales y valores únicos simples
            table.columns.forEach(column => {
                if (column.isAutoIncrement && row[column.name] !== undefined) {
                    autoIncrementCounters.set(column.name, row[column.name] + 1);
                }
                if (uniqueValuesMap.has(column.name) && row[column.name] !== undefined) {
                    uniqueValuesMap.get(column.name)!.add(row[column.name]);
                }
            });

            tableRows.push(row);
        }

        generatedData[table.name] = tableRows;
        tableDataMap.set(table.name, tableRows);
    });

    return generatedData;
}