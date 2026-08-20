import { DatabaseSchema } from './types/schema.js';
import { generateDatabaseData } from './generator/dataGenerator.js';
import { generateSqlScript } from './generator/sqlExporter.js';

// 1. Esquema con relación 1 a N (usuarios -> telefonos_usuarios y usuarios -> pedidos)
const mockSchema: DatabaseSchema = {
    dbName: 'tienda_online_db',
    tables: [
        // Tabla Hija 1: pedidos (depende de usuarios)
        {
            id: 'table-2',
            name: 'pedidos',
            rowCount: 5,
            columns: [
                { id: 'col-201', name: 'id', type: 'UUID', isPk: true, isNullable: false },
                {
                    id: 'col-202',
                    name: 'usuario_id',
                    type: 'INT',
                    isPk: false,
                    isNullable: false,
                    foreignKey: { targetTable: 'usuarios', targetColumn: 'id' }
                },
                { id: 'col-203', name: 'monto', type: 'FLOAT', isPk: false, isNullable: false },
                {
                    id: 'col-204',
                    name: 'notas',
                    type: 'VARCHAR',
                    isPk: false,
                    isNullable: true,
                    nullabilityConfig: { minInterval: 2, maxInterval: 3, mode: 'per-row' }
                }
            ]
        },
        // Tabla Hija 2: telefonos_usuarios (múltiples teléfonos por usuario)
        {
            id: 'table-3',
            name: 'telefonos_usuarios',
            rowCount: 8, // Generamos 8 registros para 5 usuarios (algunos tendrán más de un teléfono)
            columns: [
                {
                    id: 'col-301',
                    name: 'id',
                    type: 'INT',
                    isPk: true,
                    isAutoIncrement: true,
                    isNullable: false
                },
                {
                    id: 'col-302',
                    name: 'usuario_id',
                    type: 'INT',
                    isPk: false,
                    isNullable: false,
                    foreignKey: { targetTable: 'usuarios', targetColumn: 'id' }
                },
                { id: 'col-303', name: 'telefono', type: 'PHONE', isPk: false, isNullable: false }
            ]
        },
        // Tabla Padre: usuarios
        {
            id: 'table-1',
            name: 'usuarios',
            rowCount: 5,
            columns: [
                {
                    id: 'col-101',
                    name: 'id',
                    type: 'INT',
                    isPk: true,
                    isAutoIncrement: true,
                    isNullable: false
                },
                { id: 'col-102', name: 'nombre', type: 'NVARCHAR', isPk: false, isNullable: false },
                { id: 'col-103', name: 'email', type: 'EMAIL', isPk: false, isNullable: false }
            ]
        }
    ]
};

console.log('🚀 Generando datos ficticios y construyendo script SQL...\n');

try {
    // 2. Generar datos (Topología resolverá: usuarios primero, luego pedidos y telefonos_usuarios)
    const generatedData = generateDatabaseData(mockSchema);

    // 3. Convertir el resultado a script SQL
    const sqlScript = generateSqlScript(mockSchema, generatedData);

    console.log('--- SCRIPT SQL RESULTANTE ---');
    console.log(sqlScript);
    console.log('-----------------------------');
    console.log('✅ Generación finalizada con éxito.');
} catch (error) {
    console.error('❌ Error durante la generación:', error);
}