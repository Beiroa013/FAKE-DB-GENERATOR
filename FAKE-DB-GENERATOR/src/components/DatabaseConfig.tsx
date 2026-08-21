import React from 'react';

interface DatabaseConfigProps {
    dbName: string;
    setDbName: (name: string) => void;
}

export const DatabaseConfig: React.FC<DatabaseConfigProps> = ({ dbName, setDbName }) => {
    return (
        <section style={{ marginBottom: '15px' }}>
            <h2>Configuración General</h2>
            <label>
                <strong>Nombre de la Base de Datos: </strong>
                <input
                    type="text"
                    value={dbName}
                    onChange={(e) => setDbName(e.target.value)}
                    placeholder="ej. tienda_online_db"
                    style={{ padding: '5px', fontSize: '14px', marginLeft: '8px' }}
                />
            </label>
        </section>
    );
};