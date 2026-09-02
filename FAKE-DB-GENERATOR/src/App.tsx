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
            fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            backgroundColor: '#F7F9FC',
            color: '#2D3748',
            boxSizing: 'border-box'
        }}>

            {/* CABECERA PRINCIPAL */}
            <header style={{
                flexShrink: 0,
                padding: '20px 36px',
                backgroundColor: '#FFFFFF',
                borderBottom: '1px solid #E2E8F0',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                        <h1 style={{
                            margin: 0,
                            fontSize: '1.4rem',
                            fontWeight: '700',
                            color: '#2B6CB0',
                            letterSpacing: '-0.3px'
                        }}>
                            Generador de Datos Ficticios & SQL
                        </h1>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                            fontWeight: '600',
                            fontSize: '0.88rem',
                            color: '#718096'
                        }}>
                            Base de Datos:
                        </span>
                        <div style={{
                            backgroundColor: '#EDF2F7',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            border: '1px solid #CBD5E0'
                        }}>
                            <DatabaseConfig
                                dbName={schema.dbName}
                                setDbName={(newName) => setSchema({ ...schema, dbName: newName })}
                            />
                        </div>
                    </div>
                </div>

                {/* BOTONES ACCIÓN SUPERIOR */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '210px' }}>
                    <button
                        onClick={handleGenerate}
                        style={{
                            padding: '10px 18px',
                            fontSize: '0.92rem',
                            fontWeight: '600',
                            color: '#2B6CB0',
                            backgroundColor: '#EBF8FF',
                            border: '1px solid #BEE3F8',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 2px 4px rgba(66, 153, 225, 0.08)'
                        }}
                    >
                        🚀 Generar Script SQL
                    </button>

                    <button
                        onClick={handleAddTable}
                        style={{
                            padding: '10px 18px',
                            fontSize: '0.92rem',
                            fontWeight: '600',
                            color: '#2F855A',
                            backgroundColor: '#F0FFF4',
                            border: '1px solid #C6F6D5',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 2px 4px rgba(72, 187, 120, 0.08)'
                        }}
                    >
                        ➕ Nueva tabla
                    </button>

                    {error && (
                        <div style={{
                            color: '#C53030',
                            backgroundColor: '#FFF5F5',
                            border: '1px solid #FEB2B2',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: '500'
                        }}>
                            {error}
                        </div>
                    )}
                </div>
            </header>

            {/* CONTENEDOR DE TABLAS (SCROLL INDEPENDIENTE) */}
            <main style={{
                flex: 1,
                overflowY: 'auto',
                padding: '32px 36px',
                backgroundColor: '#F7F9FC'
            }}>
                <TableForm schema={schema} setSchema={setSchema} />
            </main>

            {/* SALIDA DE SCRIPT SQL GENERADO */}
            {generatedSql && (
                <footer style={{
                    flexShrink: 0,
                    height: '38%',
                    minHeight: '260px',
                    borderTop: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    padding: '20px 36px',
                    overflowY: 'auto',
                    boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.03)'
                }}>
                    <h3 style={{ marginTop: 0, color: '#4A5568', fontSize: '1.1rem' }}>SQL Generado</h3>
                    <SqlOutput sql={generatedSql} dbName={schema.dbName} />
                </footer>
            )}

        </div>
    );
};