import React, { useState } from 'react';
import { DatabaseSchema, TableSchema } from '../types/schema';
import { ColumnForm } from './ColumnForm';

interface TableFormProps {
    schema: DatabaseSchema;
    setSchema: React.Dispatch<React.SetStateAction<DatabaseSchema>>;
}

export const TableForm: React.FC<TableFormProps> = ({ schema, setSchema }) => {
    const [collapsedTables, setCollapsedTables] = useState<Record<string, boolean>>({});

    const toggleCollapse = (tableId: string) => {
        setCollapsedTables((prev) => ({
            ...prev,
            [tableId]: !prev[tableId]
        }));
    };

    const removeTable = (tableId: string) => {
        setSchema({
            ...schema,
            tables: schema.tables.filter((t) => t.id !== tableId)
        });
    };

    const updateTable = (tableId: string, updatedFields: Partial<TableSchema>) => {
        setSchema({
            ...schema,
            tables: schema.tables.map((t) => (t.id === tableId ? { ...t, ...updatedFields } : t))
        });
    };

    const inputStyle: React.CSSProperties = {
        padding: '6px 10px',
        borderRadius: '6px',
        border: '1px solid #CBD5E0',
        backgroundColor: '#FFFFFF',
        fontSize: '0.9rem',
        outline: 'none',
        color: '#2D3748'
    };

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <h2 style={{
                fontSize: '1.15rem',
                fontWeight: '600',
                color: '#4A5568',
                marginBottom: '20px'
            }}>
                Estructura de Tablas
            </h2>

            {schema.tables.length === 0 ? (
                <div style={{
                    border: '2px dashed #CBD5E0',
                    borderRadius: '12px',
                    padding: '40px',
                    textAlign: 'center',
                    backgroundColor: '#FFFFFF'
                }}>
                    <p style={{ color: '#A0AEC0', fontSize: '0.95rem', margin: 0 }}>
                        No hay tablas configuradas. Haz clic en <strong>➕ Nueva tabla</strong> arriba para empezar.
                    </p>
                </div>
            ) : (
                schema.tables.map((table) => {
                    const isCollapsed = collapsedTables[table.id] || false;

                    return (
                        <div
                            key={table.id}
                            style={{
                                border: '1px solid #E2E8F0',
                                borderRadius: '12px',
                                marginBottom: '20px',
                                padding: '20px',
                                backgroundColor: '#FFFFFF',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {/* CABECERA TARJETA TABLA */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    {/* Botón Minimizar / Desplegar pastel */}
                                    <button
                                        onClick={() => toggleCollapse(table.id)}
                                        style={{
                                            padding: '4px 10px',
                                            fontWeight: 'bold',
                                            fontSize: '0.9rem',
                                            cursor: 'pointer',
                                            backgroundColor: isCollapsed ? '#EBF8FF' : '#EDF2F7',
                                            color: isCollapsed ? '#2B6CB0' : '#4A5568',
                                            border: 'none',
                                            borderRadius: '6px'
                                        }}
                                        title={isCollapsed ? 'Desplegar tabla' : 'Minimizar tabla'}
                                    >
                                        {isCollapsed ? '➕' : '➖'}
                                    </button>

                                    <label style={{ fontSize: '0.9rem', fontWeight: '500', color: '#4A5568' }}>
                                        Nombre: &nbsp;
                                        <input
                                            type="text"
                                            value={table.name}
                                            onChange={(e) => updateTable(table.id, { name: e.target.value })}
                                            style={inputStyle}
                                        />
                                    </label>

                                    <label style={{ fontSize: '0.9rem', fontWeight: '500', color: '#4A5568' }}>
                                        Registros: &nbsp;
                                        <input
                                            type="number"
                                            min="1"
                                            value={table.rowCount}
                                            onChange={(e) => updateTable(table.id, { rowCount: Number(e.target.value) })}
                                            style={{ ...inputStyle, width: '70px' }}
                                        />
                                    </label>
                                </div>

                                <button
                                    onClick={() => removeTable(table.id)}
                                    style={{
                                        padding: '6px 12px',
                                        fontSize: '0.85rem',
                                        color: '#C53030',
                                        backgroundColor: '#FFF5F5',
                                        border: '1px solid #FEB2B2',
                                        borderRadius: '8px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Eliminar
                                </button>
                            </div>

                            {/* CONTENIDO DESPLEGABLE */}
                            {!isCollapsed && (
                                <div style={{
                                    marginTop: '20px',
                                    paddingTop: '16px',
                                    borderTop: '1px dashed #E2E8F0'
                                }}>
                                    <ColumnForm table={table} schema={schema} updateTable={updateTable} />
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
};