import React, { useState } from 'react';
import { DatabaseSchema, TableSchema } from '../types/schema';
import { ColumnForm } from './ColumnForm';
import { Plus, Minus, Trash2 } from 'lucide-react';

interface TableFormProps {
    schema: DatabaseSchema;
    setSchema: React.Dispatch<React.SetStateAction<DatabaseSchema>>;
}

export const TableForm: React.FC<TableFormProps> = ({ schema, setSchema }) => {
    const [collapsedTables, setCollapsedTables] = useState<Record<string, boolean>>({});

    const toggleCollapse = (tableId: string) => {
        setCollapsedTables((prev) => ({
            ...prev,
            [tableId]: !prev[tableId],
        }));
    };

    const removeTable = (tableId: string) => {
        setSchema({
            ...schema,
            tables: schema.tables.filter((t) => t.id !== tableId),
        });
    };

    const updateTable = (tableId: string, updatedFields: Partial<TableSchema>) => {
        setSchema({
            ...schema,
            tables: schema.tables.map((t) => (t.id === tableId ? { ...t, ...updatedFields } : t)),
        });
    };

    return (
        <div style={{ maxWidth: '1152px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#2D3748', margin: '0 0 8px 0' }}>
                Estructura de Tablas
            </h2>

            {schema.tables.length === 0 ? (
                <div style={{
                    border: '2px dashed #CBD5E0',
                    borderRadius: '12px',
                    padding: '40px 20px',
                    textAlign: 'center',
                    backgroundColor: '#FFFFFF'
                }}>
                    <p style={{ margin: 0, color: '#718096', fontSize: '0.9rem' }}>
                        No hay tablas configuradas. Haz clic en <span style={{ fontWeight: '600', color: '#2B6CB0' }}>➕ Nueva tabla</span> arriba para empezar.
                    </p>
                </div>
            ) : (
                schema.tables.map((table) => {
                    const isCollapsed = collapsedTables[table.id] || false;

                    return (
                        <div
                            key={table.id}
                            style={{
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                borderRadius: '12px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                                overflow: 'hidden',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {/* CABECERA TARJETA TABLA */}
                            <div style={{
                                padding: '16px 20px',
                                backgroundColor: '#F8FAFC',
                                borderBottom: isCollapsed ? 'none' : '1px solid #E2E8F0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '12px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                                    {/* Botón Minimizar / Desplegar */}
                                    <button
                                        onClick={() => toggleCollapse(table.id)}
                                        style={{
                                            padding: '6px 8px',
                                            borderRadius: '6px',
                                            border: isCollapsed ? '1px solid #BEE3F8' : '1px solid #CBD5E0',
                                            backgroundColor: isCollapsed ? '#EBF8FF' : '#EDF2F7',
                                            color: isCollapsed ? '#2B6CB0' : '#4A5568',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        title={isCollapsed ? 'Desplegar tabla' : 'Minimizar tabla'}
                                    >
                                        {isCollapsed ? <Plus style={{ width: 16, height: 16 }} /> : <Minus style={{ width: 16, height: 16 }} />}
                                    </button>

                                    <label style={{ fontSize: '0.88rem', fontWeight: '600', color: '#4A5568', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        Nombre:
                                        <input
                                            type="text"
                                            value={table.name}
                                            onChange={(e) => updateTable(table.id, { name: e.target.value })}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                border: '1px solid #CBD5E0',
                                                fontSize: '0.88rem',
                                                fontWeight: '600',
                                                color: '#2B6CB0',
                                                backgroundColor: '#FFFFFF',
                                                outline: 'none'
                                            }}
                                        />
                                    </label>

                                    <label style={{ fontSize: '0.88rem', fontWeight: '600', color: '#4A5568', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        Registros:
                                        <input
                                            type="number"
                                            min="1"
                                            value={table.rowCount}
                                            onChange={(e) => updateTable(table.id, { rowCount: Number(e.target.value) })}
                                            style={{
                                                width: '70px',
                                                padding: '6px 10px',
                                                borderRadius: '6px',
                                                border: '1px solid #CBD5E0',
                                                fontSize: '0.88rem',
                                                backgroundColor: '#FFFFFF',
                                                outline: 'none'
                                            }}
                                        />
                                    </label>
                                </div>

                                <button
                                    onClick={() => removeTable(table.id)}
                                    style={{
                                        padding: '6px 12px',
                                        fontSize: '0.82rem',
                                        fontWeight: '600',
                                        color: '#C53030',
                                        backgroundColor: '#FFF5F5',
                                        border: '1px solid #FEB2B2',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <Trash2 style={{ width: 14, height: 14 }} />
                                    Eliminar
                                </button>
                            </div>

                            {/* CONTENIDO DESPLEGABLE */}
                            {!isCollapsed && (
                                <div style={{ padding: '20px' }}>
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