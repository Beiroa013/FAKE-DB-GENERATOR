/**
 * Este módulo traduce un tipo de dato abstracto (DataType) a un valor ficticio realista mapeando cada caso de uso con las API especializadas de Faker.
 */
import { faker } from '@faker-js/faker';
import { DataType, ColumnSchema } from '../types/schema.js';
import { PREDEFINED_LISTS } from '../data/predefinedLists.js';

/**
 * Auxiliar para formatear o limitar decimales en FLOATS.
 */
function formatFloat(val: number, decimals: number = 2): number {
    return parseFloat(val.toFixed(decimals));
}

/**
 * Genera un valor evaluando lista personalizada, rango numérico, lista predefinida o DataType por defecto.
 * 
 * @param column Configuración completa de la columna
 * @returns Valor seleccionado o generado
 */
export function generateValueByColumn(column: ColumnSchema): string | number | boolean {
    const decimals = column.decimalPlaces ?? 2;

    // 1. Evalúa si el usuario seleccionó implícita o explícitamente una Lista Predefinida
    if (column.valueSourceType === 'PREDEFINED_LIST' || column.predefinedList) {
        const selectedListKey = column.predefinedList || 'NOMBRES';
        const list = PREDEFINED_LISTS[selectedListKey];
        if (list && list.length > 0) {
            const randomIndex = Math.floor(Math.random() * list.length);
            return list[randomIndex];
        }
    }

    // 2. Evalúa si se ha seleccionado una Lista Personalizada
    if (column.valueSourceType === 'CUSTOM_LIST' && column.customValues && column.customValues.length > 0) {
        const validValues = column.customValues.filter(v => v.trim() !== '');

        if (validValues.length > 0) {
            const selectedRaw = validValues[Math.floor(Math.random() * validValues.length)].trim();

            if (column.type === 'INT') {
                const parsedInt = parseInt(selectedRaw, 10);
                return isNaN(parsedInt) ? 0 : parsedInt;
            }
            if (column.type === 'FLOAT') {
                const parsedFloat = parseFloat(selectedRaw);
                return isNaN(parsedFloat) ? formatFloat(0, decimals) : formatFloat(parsedFloat, decimals);
            }

            return selectedRaw;
        }
    }

    // 3. Evalúa si se ha configurado un Rango Numérico (INT o FLOAT)
    if (column.valueSourceType === 'RANGE' && column.numericRange) {
        const { min, max } = column.numericRange;
        if (column.type === 'INT') {
            return faker.number.int({ min, max });
        }
        if (column.type === 'FLOAT') {
            const rawFloat = faker.number.float({ min, max, fractionDigits: decimals });
            return formatFloat(rawFloat, decimals);
        }
    }

    // 4. Generación automática estándar por DataType (para el modo 100% Aleatorio / RANDOM)
    return generateValueByColumnDataType(column);
}

/**
 * Genera un valor ficticio respetando el tipo y las opciones avanzadas (como precisión decimal para FLOAT).
 */
export function generateValueByColumnDataType(column: ColumnSchema): string | number | boolean {
    const decimals = column.decimalPlaces ?? 2;

    switch (column.type) {
        case 'INT':
            return faker.number.int({ min: 1, max: 10000 });
        case 'VARCHAR':
            return faker.lorem.words({ min: 1, max: 3 });
        case 'NVARCHAR':
            return faker.person.fullName();
        case 'TEXT':
            return faker.lorem.paragraph();
        case 'BOOLEAN':
            return faker.datatype.boolean();
        case 'DATE':
            return faker.date.past().toISOString().split('T')[0]; // YYYY-MM-DD
        case 'DATETIME':
            return faker.date.past().toISOString().replace('T', ' ').split('.')[0]; // YYYY-MM-DD HH:mm:ss
        case 'UUID':
            return faker.string.uuid();
        case 'EMAIL':
            return faker.internet.email();
        case 'PHONE':
            return faker.phone.number();
        case 'FLOAT':
            return formatFloat(faker.number.float({ min: 1, max: 1000, fractionDigits: decimals }), decimals);
        default:
            return faker.lorem.word(); // Salida por defecto en caso de error.
    }
}

/**
 * Mantenido por retrocompatibilidad.
 */
export function generateValueByDataType(type: DataType): string | number | boolean {
    return generateValueByColumnDataType({ type } as ColumnSchema);
}