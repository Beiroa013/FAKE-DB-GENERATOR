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

// Estilos reutilizables para el formulario y controles
const inputStyle: React.CSSProperties = {
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid #d0d7de',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
};

const selectStyle: React.CSSProperties = {
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid #d0d7de',
    backgroundColor: '#fff',
    fontSize: '13px',
    outline: 'none',
    cursor: 'pointer',
    width: '100%'
};

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
            style={inputStyle}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '15px', color: '#1f2937' }}>Columnas:</h4>
                <button
                    onClick={addColumn}
                    style={{
                        backgroundColor: '#4f46e5',
                        color: '#fff',
                        border: 'none',
                        padding: '8px 14px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 500
                    }}
                >
                    + Añadir Columna
                </button>
            </div>

            {hasNullableColumns && (
                <div style={{
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '16px'
                }}>
                    <strong style={{ color: '#1e40af', fontSize: '13px' }}>⚙️ Configuración Global de Nulos para la tabla "{table.name}":</strong>
                    <div style={{ display: 'flex', gap: '20px', marginTop: '8px', alignItems: 'center', fontSize: '13px' }}>
                        <label>
                            Estrategia:&nbsp;
                            <select
                                style={{ ...selectStyle, width: 'auto' }}
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
                                style={{ ...inputStyle, width: '60px', display: 'inline-block' }}
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
                                style={{ ...inputStyle, width: '60px', display: 'inline-block' }}
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

            {/* Tabla con diseño CSS estilizado */}
            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#374151', textAlign: 'left' }}>
                            <th style={{ padding: '10px 12px', fontWeight: 600 }}>Nombre Columna</th>
                            <th style={{ padding: '10px 12px', fontWeight: 600 }}>Tipo Dato</th>
                            <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'center' }}>PK</th>
                            <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'center' }}>Unique</th>
                            <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'center' }}>Auto Inc</th>
                            <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'center' }}>Permite Null</th>
                            <th style={{ padding: '10px 12px', fontWeight: 600 }}>Foreign Key (FK)</th>
                            <th style={{ padding: '10px 12px', fontWeight: 600 }}>Valores / Origen</th>
                            <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'center' }}>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {table.columns.map((col, index) => {
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
                                <tr
                                    key={col.id}
                                    style={{
                                        borderBottom: index === table.columns.length - 1 ? 'none' : '1px solid #f3f4f6',
                                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa'
                                    }}
                                >
                                    <td style={{ padding: '8px 12px' }}>
                                        <input
                                            type="text"
                                            style={inputStyle}
                                            value={col.name}
                                            onChange={(e) => updateColumn(col.id, { name: e.target.value })}
                                        />
                                    </td>
                                    <td style={{ padding: '8px 12px' }}>
                                        <select
                                            style={selectStyle}
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
                                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={col.isPk}
                                            onChange={(e) => updateColumn(col.id, { isPk: e.target.checked })}
                                        />
                                    </td>
                                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={col.isUnique || col.isPk || false}
                                            disabled={col.isPk}
                                            onChange={(e) => updateColumn(col.id, { isUnique: e.target.checked })}
                                        />
                                    </td>
                                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={col.isAutoIncrement || false}
                                            onChange={(e) => updateColumn(col.id, { isAutoIncrement: e.target.checked })}
                                        />
                                    </td>
                                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={col.isNullable}
                                            onChange={(e) => updateColumn(col.id, { isNullable: e.target.checked })}
                                        />
                                    </td>
                                    <td style={{ padding: '8px 12px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <select
                                                style={selectStyle}
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
                                                    style={selectStyle}
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
                                        </div>
                                    </td>
                                    <td style={{ padding: '8px 12px' }}>
                                        {isFk ? (
                                            <span style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
                                                🔗 Heredado de FK
                                            </span>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <select
                                                    style={selectStyle}
                                                    value={currentMode}
                                                    onChange={(e) => {
                                                        const mode = e.target.value;
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
                                                    <CustomValuesInput
                                                        value={col.customValues || []}
                                                        onChange={(newValues) => updateColumn(col.id, { customValues: newValues })}
                                                    />
                                                )}

                                                {currentMode === 'PREDEFINED_LIST' && isTextType && (
                                                    <select
                                                        style={selectStyle}
                                                        value={col.predefinedList || 'DNI'}
                                                        onChange={(e) => updateColumn(col.id, { predefinedList: e.target.value as PredefinedListType })}
                                                    >
                                                        {PREDEFINED_LIST_OPTIONS.map((opt) => (
                                                            <option key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}

                                                {currentMode === 'RANGE' && isNumeric && (
                                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                                                        <span style={{ fontSize: '11px', color: '#6b7280' }}>Mín:</span>
                                                        <input
                                                            type="number"
                                                            style={{ ...inputStyle, padding: '4px 6px' }}
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
                                                        <span style={{ fontSize: '11px', color: '#6b7280' }}>Máx:</span>
                                                        <input
                                                            type="number"
                                                            style={{ ...inputStyle, padding: '4px 6px' }}
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
                                                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                                                        <label>
                                                            Decimales:&nbsp;
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="6"
                                                                style={{ ...inputStyle, width: '45px', display: 'inline-block', padding: '2px 4px' }}
                                                                value={col.decimalPlaces ?? 2}
                                                                onChange={(e) =>
                                                                    updateColumn(col.id, { decimalPlaces: Math.max(0, Number(e.target.value)) })
                                                                }
                                                            />
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                        <button
                                            onClick={() => removeColumn(col.id)}
                                            style={{
                                                backgroundColor: '#fee2e2',
                                                color: '#991b1b',
                                                border: 'none',
                                                padding: '6px 10px',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                fontWeight: 500
                                            }}
                                        >
                                            Borrar
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};