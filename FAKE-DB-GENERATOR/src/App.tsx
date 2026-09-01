import React, { useState } from 'react';
import { DatabaseSchema, TableSchema } from './types/schema';
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

    // Lógica para el botón "Nueva tabla" desde el Header
    const handleAddTable = () => {
        const newTable: TableSchema = {
            id: crypto.randomUUID(),
            name: `tabla_${schema.tables.length + 1}`,
            rowCount: 10,
            columns: []
        };
        setSchema({ ...schema, tables: [...schema.tables, newTable] });
    };

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'sans-serif',
            boxSizing: 'border-box'
        }}>

            {/* 1. CABECERA FIJA (Header) */}
            <header style={{
                flexShrink: 0,
                padding: '20px 30px',
                borderBottom: '3px solid #1a1a1a',
                backgroundColor: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                zIndex: 10
            }}>
                {/* Lado Izquierdo: Títulos y Nombre BDD */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <h1 style={{
                            margin: 0,
                            fontSize: '1.5rem',
                            borderBottom: '3px solid #1a1a1a',
                            display: 'inline-block',
                            paddingBottom: '5px'
                        }}>
                            Generador de Datos Ficticios & SQL
                        </h1>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>

                        <div style={{
                            border: '2px solid #1a1a1a',
                            padding: '4px 8px'
                        }}>
                            <DatabaseConfig
                                dbName={schema.dbName}
                                setDbName={(newName) => setSchema({ ...schema, dbName: newName })}
                            />
                        </div>
                    </div>
                </div>

                {/* Lado Derecho: Botones con sus estilos originales */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '200px' }}>
                    <button
                        onClick={handleGenerate}
                        style={{ padding: '10px 20px', fontSize: '16px' }}
                    >
                        🚀 Generar Script SQL
                    </button>

                    <button
                        onClick={handleAddTable}
                        style={{ padding: '10px 20px', fontSize: '16px' }}
                    >
                        ➕ Nueva tabla
                    </button>

                    {error && (
                        <div style={{ color: 'red', fontSize: '13px', fontWeight: 'bold' }}>
                            Error: {error}
                        </div>
                    )}
                </div>
            </header>

            {/* 2. ÁREA CENTRAL (Tablas con scroll propio) */}
            <main style={{
                flex: 1,
                overflowY: 'auto',
                padding: '30px'
            }}>
                <TableForm schema={schema} setSchema={setSchema} />
            </main>

            {/* 3. ZONA INFERIOR (SQL Generado) */}
            {generatedSql && (
                <footer style={{
                    flexShrink: 0,
                    height: '35%',
                    minHeight: '250px',
                    borderTop: '3px solid #1a1a1a',
                    backgroundColor: '#ffffff',
                    padding: '20px 30px',
                    overflowY: 'auto'
                }}>
                    <h3 style={{ marginTop: 0 }}>SQL Generado</h3>
                    <SqlOutput sql={generatedSql} dbName={schema.dbName} />
                </footer>
            )}

        </div>
    );
};