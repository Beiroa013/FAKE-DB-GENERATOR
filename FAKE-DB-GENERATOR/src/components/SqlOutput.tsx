import React from 'react';

interface SqlOutputProps {
    sql: string;
    dbName?: string;
}

export const SqlOutput: React.FC<SqlOutputProps> = ({ sql, dbName = 'database' }) => {
    const copyToClipboard = () => {
        navigator.clipboard.writeText(sql);
        alert('¡Script SQL copiado al portapapeles!');
    };

    const downloadSql = () => {
        const fileName = `${dbName.trim().toLowerCase().replace(/\s+/g, '_')}.sql`;
        const blob = new Blob([sql], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div style={{ marginTop: '20px' }}>
            <h3>Script SQL Resultante:</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <button onClick={copyToClipboard}>📋 Copiar SQL</button>
                <button onClick={downloadSql}>📥 Exportar .SQL</button>
            </div>
            <pre
                style={{
                    backgroundColor: '#1e1e1e',
                    color: '#d4d4d4',
                    padding: '15px',
                    borderRadius: '5px',
                    overflowX: 'auto',
                    marginTop: '10px'
                }}
            >
                <code>{sql}</code>
            </pre>
        </div>
    );
};