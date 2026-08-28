import React, { useState, useEffect, useRef } from 'react';
import { TableSchema, ColumnSchema, DataType, DatabaseSchema, NullabilityConfig, PredefinedListType } from '../types/schema';
import { PREDEFINED_LIST_OPTIONS } from '../data/predefinedLists';

interface ColumnFormProps {
    table: TableSchema;
    schema: DatabaseSchema;
    updateTable: (tableId: string, updatedFields: Partial<TableSchema>) => void;
}

const DATA_TYPES: DataType[] = [
    'INT', 'FLOAT', 'VARCHAR', 'NVARCHAR', 'TEXT', 'BOOLEAN', 'DATE', 'DATETIME', 'UUID', 'EMAIL', 'PHONE'
];

interface CustomValuesInputProps {
    value: string[];
    onChange: (values: string[]) => void;
}

const CustomValuesInput: React.FC<CustomValuesInputProps> = ({ value, onChange }) => {
    const [rawText, setRawText] = useState(value.join(', '));
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const currentJoined = value.join(', ');
        if (currentJoined !== rawText && !rawText.endsWith(',')) {
            setRawText(currentJoined);
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputVal = e.target.value;
        const cursorPosition = e.target.selectionStart;

        setRawText(inputVal);

        const parsedValues = inputVal
            .split(',')
            .map((v) => v.trim())
            .filter((v) => v.length > 0);

        onChange(parsedValues);

        requestAnimationFrame(() => {
            if (inputRef.current && cursorPosition !== null) {
                inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
            }
        });
    };

    return (
        <input
            ref={inputRef}
            type="text"
            placeholder="Ej: gonzalez, perez, lopez"
            style={{ width: '95%', fontSize: '12px' }}
            value={rawText}
            onChange={handleChange}
        />
    );
};

export const ColumnForm: React.FC<ColumnFormProps> = ({ table, schema, updateTable }) => {
    const addColumn = () => {
        const newCol: ColumnSchema = {
            id: `col-${Date.now()}`,
            name: `columna_${table.columns.length + 1}`,
            type: 'VARCHAR',
            isPk: false,
            isAutoIncrement: false,
            isNullable: false,
            isUnique: false
        };
        updateTable(table.id, { columns: [...table.columns, newCol] });
    };

    const updateColumn = (colId: string, updatedFields: Partial<ColumnSchema>) => {
        const updatedColumns = table.columns.map((col) => {
            if (col.id === colId) {
                if (updatedFields.isPk) {
                    updatedFields.isUnique = true;
                }
                return { ...col, ...updatedFields };
            }
            return col;
        });

        const hasNullable = updatedColumns.some((c) => c.isNullable);
        const updatedNullConfig = hasNullable
            ? table.nullabilityConfig || { mode: 'per-row', minInterval: 2, maxInterval: 3 }
            : undefined;

        updateTable(table.id, {
            columns: updatedColumns,
            nullabilityConfig: updatedNullConfig
        });
    };

    const removeColumn = (colId: string) => {
        const remainingColumns = table.columns.filter((c) => c.id !== colId);
        const hasNullable = remainingColumns.some((c) => c.isNullable);

        updateTable(table.id, {
            columns: remainingColumns,
            nullabilityConfig: hasNullable ? table.nullabilityConfig : undefined
        });
    };

    const hasNullableColumns = table.columns.some((c) => c.isNullable);
    const nullConfig: NullabilityConfig = table.nullabilityConfig || {
        mode: 'per-row',
        minInterval: 2,
        maxInterval: 3
    };

    const availableParentTables = schema.tables.filter((t) => t.id !== table.id);

    return (
        <div style={{ marginTop: '15px' }}>
            <h4>Columnas:</h4>
            <button onClick={addColumn}>+ Añadir Columna</button>

            {hasNullableColumns && (
                <div style={{
                    backgroundColor: '#f0f7ff',
                    border: '1px solid #b6d4fe',
                    borderRadius: '6px',
                    padding: '12px',
                    marginTop: '10px',
                    marginBottom: '10px'
                }}>
                    <strong style={{ color: '#084298' }}>⚙️ Configuración Global de Nulos para la tabla "{table.name}":</strong>
                    <div style={{ display: 'flex', gap: '20px', marginTop: '8px', alignItems: 'center' }}>
                        <label>
                            Estrategia:&nbsp;
                            <select
                                value={nullConfig.mode}
                                onChange={(e) =>
                                    updateTable(table.id, {
                                        nullabilityConfig: {
                                            ...nullConfig,
                                            mode: e.target.value as 'per-row' | 'per-column'
                                        }
                                    })
                                }
                            >
                                <option value="per-row">Por Registro (per-row)</option>
                                <option value="per-column">Por Campo (per-column)</option>
                            </select>
                        </label>

                        <label>
                            Mín. Intervalo:&nbsp;
                            <input
                                type="number"
                                min="1"
                                style={{ width: '55px' }}
                                value={nullConfig.minInterval}
                                onChange={(e) =>
                                    updateTable(table.id, {
                                        nullabilityConfig: {
                                            ...nullConfig,
                                            minInterval: Math.max(1, Number(e.target.value))
                                        }
                                    })
                                }
                            />
                        </label>

                        <label>
                            Máx. Intervalo:&nbsp;
                            <input
                                type="number"
                                min="1"
                                style={{ width: '55px' }}
                                value={nullConfig.maxInterval}
                                onChange={(e) =>
                                    updateTable(table.id, {
                                        nullabilityConfig: {
                                            ...nullConfig,
                                            maxInterval: Math.max(1, Number(e.target.value))
                                        }
                                    })
                                }
                            />
                        </label>
                    </div>
                </div>
            )}

            <table border={1} cellPadding={5} style={{ marginTop: '10px', width: '100%' }}>
                <thead>
                    <tr>
                        <th>Nombre Columna</th>
                        <th>Tipo Dato</th>
                        <th>PK</th>
                        <th>Unique</th>
                        <th>Auto Inc</th>
                        <th>Permite Null</th>
                        <th>Foreign Key (FK)</th>
                        <th>Valores / Origen</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {table.columns.map((col) => {
                        const selectedParentTable = schema.tables.find((t) => t.name === col.foreignKey?.targetTable);
                        const isNumeric = col.type === 'INT' || col.type === 'FLOAT';
                        const isTextType = col.type === 'VARCHAR' || col.type === 'NVARCHAR' || col.type === 'TEXT';
                        const isFk = Boolean(col.foreignKey?.targetTable);

                        let currentMode = col.valueSourceType || 'RANDOM';
                        if (!col.valueSourceType) {
                            if (Array.isArray(col.customValues)) currentMode = 'CUSTOM_LIST';
                            else if (col.numericRange) currentMode = 'RANGE';
                            else if (col.predefinedList) currentMode = 'PREDEFINED_LIST';
                        }

                        return (
                            <tr key={col.id}>
                                <td>
                                    <input
                                        type="text"
                                        value={col.name}
                                        onChange={(e) => updateColumn(col.id, { name: e.target.value })}
                                    />
                                </td>
                                <td>
                                    <select
                                        value={col.type}
                                        disabled={isFk}
                                        onChange={(e) => {
                                            const newType = e.target.value as DataType;
                                            const isNewTypeNumeric = newType === 'INT' || newType === 'FLOAT';
                                            const isNewTypeText = newType === 'VARCHAR' || newType === 'NVARCHAR' || newType === 'TEXT';

                                            const updatedValues: Partial<ColumnSchema> = {
                                                type: newType,
                                                numericRange: isNewTypeNumeric ? col.numericRange : undefined,
                                                decimalPlaces: newType === 'FLOAT' ? (col.decimalPlaces ?? 2) : undefined
                                            };

                                            if (!isNewTypeText && col.valueSourceType === 'PREDEFINED_LIST') {
                                                updatedValues.valueSourceType = 'RANDOM';
                                                updatedValues.predefinedList = undefined;
                                            }

                                            updateColumn(col.id, updatedValues);
                                        }}
                                    >
                                        {DATA_TYPES.map((type) => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </td>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={col.isPk}
                                        onChange={(e) => updateColumn(col.id, { isPk: e.target.checked })}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={col.isUnique || col.isPk || false}
                                        disabled={col.isPk}
                                        onChange={(e) => updateColumn(col.id, { isUnique: e.target.checked })}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={col.isAutoIncrement || false}
                                        onChange={(e) => updateColumn(col.id, { isAutoIncrement: e.target.checked })}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={col.isNullable}
                                        onChange={(e) => updateColumn(col.id, { isNullable: e.target.checked })}
                                    />
                                </td>
                                <td>
                                    <select
                                        value={col.foreignKey?.targetTable || ''}
                                        onChange={(e) => {
                                            const targetTable = e.target.value;
                                            if (!targetTable) {
                                                updateColumn(col.id, { foreignKey: undefined });
                                            } else {
                                                const pTable = schema.tables.find((t) => t.name === targetTable);
                                                const pkColObj = pTable?.columns.find((c) => c.isPk) || pTable?.columns[0];
                                                const pkColName = pkColObj?.name || 'id';
                                                const pkColType = pkColObj?.type || 'INT';

                                                updateColumn(col.id, {
                                                    type: pkColType,
                                                    foreignKey: { targetTable, targetColumn: pkColName },
                                                    valueSourceType: 'RANDOM',
                                                    customValues: undefined,
                                                    numericRange: undefined,
                                                    predefinedList: undefined
                                                });
                                            }
                                        }}
                                    >
                                        <option value="">-- No es FK --</option>
                                        {availableParentTables.map((pt) => (
                                            <option key={pt.id} value={pt.name}>{pt.name}</option>
                                        ))}
                                    </select>

                                    {col.foreignKey && selectedParentTable && (
                                        <select
                                            value={col.foreignKey.targetColumn}
                                            onChange={(e) => {
                                                const targetColName = e.target.value;
                                                const targetColObj = selectedParentTable.columns.find((c) => c.name === targetColName);

                                                updateColumn(col.id, {
                                                    type: targetColObj?.type || col.type,
                                                    foreignKey: { ...col.foreignKey!, targetColumn: targetColName }
                                                });
                                            }}
                                        >
                                            {selectedParentTable.columns.map((pCol) => (
                                                <option key={pCol.id} value={pCol.name}>{pCol.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </td>
                                <td>
                                    {isFk ? (
                                        <span style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                                            🔗 Heredado de FK
                                        </span>
                                    ) : (
                                        <>
                                            <select
                                                value={currentMode}
                                                onChange={(e) => {
                                                    const mode = e.target.value as any;
                                                    if (mode === 'CUSTOM_LIST') {
                                                        updateColumn(col.id, { valueSourceType: 'CUSTOM_LIST', customValues: [], numericRange: undefined, predefinedList: undefined });
                                                    } else if (mode === 'RANGE') {
                                                        updateColumn(col.id, { valueSourceType: 'RANGE', customValues: undefined, numericRange: { min: 1, max: 100 }, predefinedList: undefined });
                                                    } else if (mode === 'PREDEFINED_LIST') {
                                                        const defaultList = col.predefinedList || (PREDEFINED_LIST_OPTIONS[0]?.value as PredefinedListType) || 'DNI';
                                                        updateColumn(col.id, {
                                                            valueSourceType: 'PREDEFINED_LIST',
                                                            customValues: undefined,
                                                            numericRange: undefined,
                                                            predefinedList: defaultList
                                                        });
                                                    } else {
                                                        updateColumn(col.id, { valueSourceType: 'RANDOM', customValues: undefined, numericRange: undefined, predefinedList: undefined });
                                                    }
                                                }}
                                            >
                                                <option value="RANDOM">🎲 100% Aleatorio</option>
                                                <option value="CUSTOM_LIST">📝 Lista Personalizada</option>
                                                {isNumeric && <option value="RANGE">📏 Rango Numérico</option>}
                                                {isTextType && <option value="PREDEFINED_LIST">📚 Listas Predefinidas</option>}
                                            </select>

                                            {currentMode === 'CUSTOM_LIST' && (
                                                <div style={{ marginTop: '5px' }}>
                                                    <CustomValuesInput
                                                        value={col.customValues || []}
                                                        onChange={(newValues) => updateColumn(col.id, { customValues: newValues })}
                                                    />
                                                </div>
                                            )}

                                            {currentMode === 'PREDEFINED_LIST' && isTextType && (
                                                <div style={{ marginTop: '5px' }}>
                                                    <select
                                                        value={col.predefinedList || 'DNI'}
                                                        onChange={(e) => updateColumn(col.id, { predefinedList: e.target.value as PredefinedListType })}
                                                        style={{ width: '95%' }}
                                                    >
                                                        {PREDEFINED_LIST_OPTIONS.map((opt) => (
                                                            <option key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {currentMode === 'RANGE' && isNumeric && (
                                                <div style={{ marginTop: '5px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                                                    <label style={{ fontSize: '12px' }}>Mín:</label>
                                                    <input
                                                        type="number"
                                                        style={{ width: '50px' }}
                                                        value={col.numericRange?.min ?? 1}
                                                        onChange={(e) =>
                                                            updateColumn(col.id, {
                                                                numericRange: {
                                                                    min: Number(e.target.value),
                                                                    max: col.numericRange?.max ?? 100
                                                                }
                                                            })
                                                        }
                                                    />
                                                    <label style={{ fontSize: '12px' }}>Máx:</label>
                                                    <input
                                                        type="number"
                                                        style={{ width: '50px' }}
                                                        value={col.numericRange?.max ?? 100}
                                                        onChange={(e) =>
                                                            updateColumn(col.id, {
                                                                numericRange: {
                                                                    min: col.numericRange?.min ?? 1,
                                                                    max: Number(e.target.value)
                                                                }
                                                            })
                                                        }
                                                    />
                                                </div>
                                            )}

                                            {col.type === 'FLOAT' && (
                                                <div style={{ marginTop: '5px', fontSize: '12px' }}>
                                                    <label>
                                                        Decimales:&nbsp;
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="6"
                                                            style={{ width: '40px' }}
                                                            value={col.decimalPlaces ?? 2}
                                                            onChange={(e) =>
                                                                updateColumn(col.id, { decimalPlaces: Math.max(0, Number(e.target.value)) })
                                                            }
                                                        />
                                                    </label>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </td>
                                <td>
                                    <button onClick={() => removeColumn(col.id)}>Borrar</button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};