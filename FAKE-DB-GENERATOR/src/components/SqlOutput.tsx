import React from 'react';

interface SqlOutputProps {
    sql: string;
}

export const SqlOutput: React.FC<SqlOutputProps> = ({ sql }) => {
    const copyToClipboard = () => {
        navigator.clipboard.writeText(sql);
        alert('¡Script SQL copiado al portapapeles!');
    };

    return (
        <div style={{ marginTop: '20px' }}>
            <h3>Script SQL Resultante:</h3>
            <button onClick={copyToClipboard}>📋 Copiar SQL</button>
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