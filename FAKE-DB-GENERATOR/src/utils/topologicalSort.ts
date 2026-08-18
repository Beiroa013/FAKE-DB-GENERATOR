import { TableSchema } from '../types/schema.js';

/**
 * Ordena las tablas de un esquema de BDD basándose en sus dependencias de Foreign Keys (FK).
 * Garantiza que una tabla padre se inserte ANTES que una tabla hija que depende de ella.
 * 
 * @param tables Lista de tablas a ordenar
 * @returns Lista de tablas ordenadas topológicamente
 * @throws Error si detecta una dependencia circular (ej. A -> B y B -> A)
 */
export function sortTablesByDependencies(tables: TableSchema[]): TableSchema[] {
    // Mapa para buscar rápidamente una tabla por su nombre
    const tableMap = new Map<string, TableSchema>();
    tables.forEach(table => tableMap.set(table.name, table));

    // Mapa de adyacencia: parentTable -> lista de childTables que dependen de ella
    const adjList = new Map<string, string[]>();
    // Contador de dependencias (grados de entrada) por cada tabla
    const inDegree = new Map<string, number>();

    // Inicializar estructuras de datos
    tables.forEach(table => {
        adjList.set(table.name, []);
        inDegree.set(table.name, 0);
    });

    // Construir el grafo de dependencias
    tables.forEach(table => {
        table.columns.forEach(column => {
            // Si la columna es una FK y apunta a OTRA tabla existente en el esquema
            if (column.foreignKey && column.foreignKey.targetTable !== table.name) {
                const parentTable = column.foreignKey.targetTable;

                if (tableMap.has(parentTable)) {
                    // La tabla padre apunta a la tabla actual (hija)
                    adjList.get(parentTable)?.push(table.name);
                    // Incrementamos las dependencias pendientes de la tabla actual
                    inDegree.set(table.name, (inDegree.get(table.name) || 0) + 1);
                }
            }
        });
    });

    // Cola con las tablas que NO dependen de ninguna otra (inDegree === 0)
    const queue: string[] = [];
    inDegree.forEach((degree, tableName) => {
        if (degree === 0) {
            queue.push(tableName);
        }
    });

    const sortedResult: TableSchema[] = [];

    // Procesar la cola (Algoritmo de Kahn)
    while (queue.length > 0) {
        const currentTableName = queue.shift()!;
        const tableObj = tableMap.get(currentTableName);

        if (tableObj) {
            sortedResult.push(tableObj);
        }

        // Reducir el inDegree de las tablas hijas que dependían de la tabla actual
        const neighbors = adjList.get(currentTableName) || [];
        neighbors.forEach(childTable => {
            const currentDegree = inDegree.get(childTable) || 0;
            const newDegree = currentDegree - 1;
            inDegree.set(childTable, newDegree);

            // Si la tabla hija ya no tiene más dependencias pendientes, entra a la cola
            if (newDegree === 0) {
                queue.push(childTable);
            }
        });
    }

    // Si no se procesaron todas las tablas, existe una dependencia circular
    if (sortedResult.length !== tables.length) {
        throw new Error(
            'Error: Se ha detectado una referencia circular entre las claves foráneas de las tablas. Ajusta el esquema para evitar ciclos.'
        );
    }

    return sortedResult;
}