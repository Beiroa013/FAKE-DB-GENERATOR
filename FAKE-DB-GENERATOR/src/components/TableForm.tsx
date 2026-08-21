import React from 'react';
import { DatabaseSchema, TableSchema } from '../types/schema';
import { ColumnForm } from './ColumnForm';

interface TableFormProps {
    schema: DatabaseSchema;
    setSchema: React.Dispatch<React.SetStateAction<DatabaseSchema>>;
}

export const TableForm: React.FC<TableFormProps> = ({ schema, setSchema }) => {
    const addTable = () => {
        const newTable: TableSchema = {
            id: `table-${Date.now()}`,
            name: `tabla_${schema.tables.length + 1}`,
            rowCount: 5,
            columns: []
        };
        setSchema({ ...schema, tables: [...schema.tables, newTable] });
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
            <button onClick={addTable}>+ Añadir Tabla</button>

            {schema.tables.map((table) => (
                <div key={table.id} style={{ border: '1px solid #ccc', margin: '15px 0', padding: '15px' }}>
                    <div>
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
                        &nbsp;&nbsp;
                        <button onClick={() => removeTable(table.id)}>Eliminar Tabla</button>
                    </div>

                    {/* Formulario para añadir/editar columnas de esta tabla */}
                    <ColumnForm table={table} schema={schema} updateTable={updateTable} />
                </div>
            ))}
        </div>
    );
};