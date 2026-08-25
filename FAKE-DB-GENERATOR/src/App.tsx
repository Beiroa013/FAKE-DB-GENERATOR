import React, { useState } from 'react';
import { DatabaseSchema } from './types/schema';
import { generateDatabaseData } from './generator/dataGenerator';
import { generateSqlScript } from './generator/sqlExporter';
import { TableForm } from './components/TableForm';
import { SqlOutput } from './components/SqlOutput';
import { DatabaseConfig } from './components/DatabaseConfig';

export const App: React.FC = () => {
    const [schema, setSchema] = useState<DatabaseSchema>({
        dbName: 'mi_base_de_datos',
        tables: []
    });

    const [generatedSql, setGeneratedSql] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    // Generar el Script SQL final
    const handleGenerate = () => {
        try {
            setError(null);
            if (schema.tables.length === 0) {
                throw new Error('Debes añadir al menos una tabla al esquema.');
            }

            const generatedData = generateDatabaseData(schema);
            const sql = generateSqlScript(schema, generatedData);
            setGeneratedSql(sql);
        } catch (err: any) {
            setError(err.message || 'Error al generar el script SQL');
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h1>Generador de Datos Ficticios & SQL</h1>

            {/* Configuración de la Base de Datos integrada */}
            <DatabaseConfig
                dbName={schema.dbName}
                setDbName={(newName) => setSchema({ ...schema, dbName: newName })}
            />

            <hr />

            {/* Formulario y listado de tablas */}
            <TableForm schema={schema} setSchema={setSchema} />

            <hr />

            {/* Botón Acción Principal */}
            <button onClick={handleGenerate} style={{ padding: '10px 20px', fontSize: '16px' }}>
                🚀 Generar Script SQL
            </button>

            {error && (
                <div style={{ color: 'red', marginTop: '10px' }}>
                    <strong>Error: </strong>{error}
                </div>
            )}

            {/* Salida del resultado SQL */}
            {generatedSql && <SqlOutput sql={generatedSql} dbName={schema.dbName} />}
        </div>
    );
};