import React, { useState, useRef } from 'react';
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

    // Referencia para desplazar la página hacia el SQL cuando se genera
    const sqlSectionRef = useRef<HTMLDivElement>(null);

    const handleGenerate = () => {
        try {
            setError(null);
            if (schema.tables.length === 0) {
                throw new Error('Debes añadir al menos una tabla al esquema.');
            }

            const generatedData = generateDatabaseData(schema);
            const sql = generateSqlScript(schema, generatedData);
            setGeneratedSql(sql);

            // Hacer scroll en la página principal hacia el SQL
            setTimeout(() => {
                sqlSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);

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
            minHeight: '100vh',
            width: '100%',
            maxWidth: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflowX: 'hidden',
            fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            backgroundColor: '#F7F9FC',
            color: '#2D3748',
            boxSizing: 'border-box'
        }}>

            {/* CABECERA PRINCIPAL */}
            <header style={{
                position: 'sticky',
                top: 0,
                flexShrink: 0,
                padding: '14px 24px',
                backgroundColor: '#FFFFFF',
                borderBottom: '1px solid #E2E8F0',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
                    <h1 style={{
                        margin: 0,
                        fontSize: '1.3rem',
                        fontWeight: '700',
                        color: '#2B6CB0',
                        letterSpacing: '-0.3px',
                        whiteSpace: 'nowrap'
                    }}>
                        Generador de Datos Ficticios & SQL
                    </h1>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                            fontWeight: '600',
                            fontSize: '0.88rem',
                            color: '#718096'
                        }}>
                            Base de Datos:
                        </span>
                        <div style={{
                            backgroundColor: '#EDF2F7',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E0'
                        }}>
                            <DatabaseConfig
                                dbName={schema.dbName}
                                setDbName={(newName) => setSchema({ ...schema, dbName: newName })}
                            />
                        </div>
                    </div>
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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

                    <button
                        onClick={handleAddTable}
                        style={{
                            padding: '8px 16px',
                            fontSize: '0.88rem',
                            fontWeight: '600',
                            color: '#2F855A',
                            backgroundColor: '#F0FFF4',
                            border: '1px solid #C6F6D5',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        ➕ Nueva tabla
                    </button>

                    <button
                        onClick={handleGenerate}
                        style={{
                            padding: '8px 16px',
                            fontSize: '0.88rem',
                            fontWeight: '600',
                            color: '#2B6CB0',
                            backgroundColor: '#EBF8FF',
                            border: '1px solid #BEE3F8',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        🚀 Generar Script SQL
                    </button>
                </div>
            </header>

            {/* SECCIÓN PRINCIPAL */}
            <div style={{
                padding: '24px',
                maxWidth: '1200px',
                width: '100%',
                margin: '0 auto',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                gap: '32px'
            }}>

                {/* CAJA / CONTENEDOR CENTRAL DE TABLAS (CON SCROLL INDEPENDIENTE) */}
                <section style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    height: '52vh',             // <-- ALTURA FIJA PARA FORZAR SCROLL INTERNO
                    minHeight: '380px',
                    overflowY: 'auto',          // <-- SCROLL SOLO PARA LAS TABLAS
                    boxSizing: 'border-box'
                }}>
                    <TableForm schema={schema} setSchema={setSchema} />
                </section>

                {/* BLOQUE SQL GENERADO (SEPARADO, SIGUE EL SCROLL DE LA PÁGINA) */}
                {generatedSql && (
                    <section
                        ref={sqlSectionRef}
                        style={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderRadius: '12px',
                            padding: '24px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                            boxSizing: 'border-box',
                            marginBottom: '40px'
                        }}
                    >
                        <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#2D3748', fontSize: '1.1rem', fontWeight: '600' }}>
                            SQL Generado
                        </h3>
                        <SqlOutput sql={generatedSql} dbName={schema.dbName} />
                    </section>
                )}

            </div>

        </div>
    );
};