/**
 * Unión de tipos de datos soportados para la generación de columnas.
 * Restringe los tipos permitidos a una lista específica para validar datos y saber qué generador de Faker usar.
 */
export type DataType =
    | 'INT'       // Números enteros
    | 'VARCHAR'   // Cadenas de texto estándar
    | 'NVARCHAR'  // Cadenas de texto con soporte Unicode (UTF-8/UTF-16)
    | 'TEXT'      // Cadenas de texto largas (ej. descripciones, párrafos)
    | 'BOOLEAN'   // Valores booleanos (true/false)
    | 'DATE'      // Fechas en formato AAAA-MM-DD
    | 'DATETIME'  // Fechas con hora completa
    | 'UUID'      // Identificadores únicos universales (UUID v4)
    | 'EMAIL'     // Direcciones de correo electrónico válidas
    | 'PHONE'     // Números telefónicos
    | 'FLOAT';    // Números decimales

/**
 * Define la relación de clave foránea (FK) de un campo con otra tabla.
 */
export interface ForeignKeyReference {
    targetTable: string;   // Nombre de la tabla a la que hace referencia (ej. "users")
    targetColumn: string;  // Nombre de la columna de destino (ej. "id")
}

/**
 * Define la configuración para el control de frecuencia y estrategia de campos vacíos (NULL).
 */
export interface NullabilityConfig {
    minInterval: number;              // Límite inferior del rango de frecuencia (ej. 3)
    maxInterval: number;              // Límite superior del rango de frecuencia (ej. 5)
    mode: 'per-row' | 'per-column';   // Estrategia: 'per-row' (por inserción/registro) o 'per-column' (por campo individual)
}

/**
 * Define la estructura y reglas de una columna o campo individual en la tabla.
 */
// Valores minimos y maximos introducidos por el usuario final.
export interface NumericRange {
    min: number;
    max: number;
}
export interface ColumnSchema {
    id: string;                             // Identificador único del campo
    name: string;                           // Nombre físico de la columna en la BDD (ej. "user_id")
    type: DataType;                         // Tipo de dato asociado
    isPk: boolean;                          // Indica si la columna es Clave Primaria (Primary Key)
    isAutoIncrement?: boolean;              // Nueva opción para claves numéricas autoincrementales
    isNullable: boolean;                    // Indica si el campo admite valores nulos (NULL)
    foreignKey?: ForeignKeyReference;       // Configuración opcional (?): solo presente si el campo es FK
    customValues?: string[];                // Array para lista de valores manuales.
    numericRange?: NumericRange;            // Rango para INT/FLOAT
    decimalPlaces?: number;                 // Cantidad de ceros/decimales para FLOAT (default: 2)
}

/**
 * Define la configuración completa de una tabla de la base de datos.
 */
export interface TableSchema {
    id: string;              // Identificador único de la tabla para la interfaz de usuario
    name: string;            // Nombre de la tabla (ej. "orders")
    rowCount: number;        // Cantidad de registros aleatorios (INSERTS) a generar para esta tabla
    columns: ColumnSchema[]; // Arreglo con la definición de todos los campos de la tabla
    nullabilityConfig?: NullabilityConfig;  // Configuración opcional para la frecuencia y modo de nulos
}

/**
 * Representa el esquema completo de la base de datos que configurará el usuario.
 */
export interface DatabaseSchema {
    dbName: string;         // Nombre global de la base de datos (ej. "mi_tienda_db")
    tables: TableSchema[];  // Lista de todas las tablas que componen la base de datos
}