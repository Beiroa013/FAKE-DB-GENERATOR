import React, { useState } from 'react';
import { DatabaseSchema, TableSchema } from '../types/schema';
import { ColumnForm } from './ColumnForm';

interface TableFormProps {
    schema: DatabaseSchema;
    setSchema: React.Dispatch<React.SetStateAction<DatabaseSchema>>;
}

export const TableForm: React.FC<TableFormProps> = ({ schema, setSchema }) => {
    // Estado para rastrear qué tablas están minimizadas por su ID
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

    return (
        <div>
            <h2>Tablas de la Base de Datos</h2>

            {schema.tables.length === 0 ? (
                <p style={{ color: '#666', fontStyle: 'italic' }}>
                    No hay tablas creadas. Utiliza el botón "Nueva tabla" en la parte superior para crear una.
                </p>
            ) : (
                schema.tables.map((table) => {
                    const isCollapsed = collapsedTables[table.id] || false;

                    return (
                        <div
                            key={table.id}
                            style={{
                                border: '1px solid #ccc',
                                margin: '15px 0',
                                padding: '15px',
                                backgroundColor: '#fff'
                            }}
                        >
                            {/* Cabecera de la Tabla (siempre visible) */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    {/* Botón para Minimizar / Desplegar */}
                                    <button
                                        onClick={() => toggleCollapse(table.id)}
                                        style={{
                                            marginRight: '10px',
                                            padding: '2px 8px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                        title={isCollapsed ? 'Desplegar tabla' : 'Minimizar tabla'}
                                    >
                                        {isCollapsed ? '+' : '−'}
                                    </button>

                                    <label>
                                        <strong>Nombre Tabla: </strong>
                                        <input
                                            type="text"
                                            value={table.name}
                                            onChange={(e) => updateTable(table.id, { name: e.target.value })}
                                        />
                                    </label>
                                    &nbsp;&nbsp;
                                    <label>
                                        <strong>Nº Registros: </strong>
                                        <input
                                            type="number"
                                            min="1"
                                            value={table.rowCount}
                                            onChange={(e) => updateTable(table.id, { rowCount: Number(e.target.value) })}
                                        />
                                    </label>
                                </div>

                                <button onClick={() => removeTable(table.id)}>Eliminar Tabla</button>
                            </div>

                            {/* Contenido desplegable (se oculta al minimizar) */}
                            {!isCollapsed && (
                                <div style={{ marginTop: '15px' }}>
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