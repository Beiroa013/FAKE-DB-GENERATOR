/**
 * Este módulo traduce un tipo de dato abstracto (DataType) a un valor ficticio realista mapeando cada caso de uso con las API especializadas de Faker.
 */
import { faker } from '@faker-js/faker'; //Importa la librería encargada de generar datos aleatorios de prueba.
import { DataType } from '../types/schema.js'; //Importa la unión de tipos que restringe los valores permitidos ('INT', 'VARCHAR', 'EMAIL', etc.).

/**
 * Genera un valor ficticio coherente según el DataType recibido.
 * 
 * @param type Tipo de dato de la columna
 * @returns Valor aleatorio generado
 */
export function generateValueByDataType(type: DataType): string | number | boolean {
    switch (type) {
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
            return faker.number.float({ min: 1, max: 1000, fractionDigits: 2 });
        default:
            return faker.lorem.word();// Salida por defecto en caso de error. Si se recibe un tipo de dato no mapeado explícitamente, retorna una palabra aleatoria de relleno.
    }
}