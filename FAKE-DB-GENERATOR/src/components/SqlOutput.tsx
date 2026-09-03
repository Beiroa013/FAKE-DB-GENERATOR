import React, { useState } from 'react';
import { Copy, Download, Check } from 'lucide-react';

interface SqlOutputProps {
    sql: string;
    dbName?: string;
}

export const SqlOutput: React.FC<SqlOutputProps> = ({ sql, dbName = 'database' }) => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(sql);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#2D3748', marginTop: 0, marginBottom: '12px' }}>
                Script SQL Resultante:
            </h3>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {/* Botón Copiar SQL */}
                <button
                    onClick={copyToClipboard}
                    style={{
                        padding: '8px 16px',
                        fontSize: '0.88rem',
                        fontWeight: '600',
                        color: copied ? '#2F855A' : '#2B6CB0',
                        backgroundColor: copied ? '#F0FFF4' : '#EBF8FF',
                        border: copied ? '1px solid #C6F6D5' : '1px solid #BEE3F8',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    {copied ? (
                        <>
                            <Check style={{ width: 16, height: 16 }} />
                            ¡Copiado!
                        </>
                    ) : (
                        <>
                            <Copy style={{ width: 16, height: 16 }} />
                            Copiar SQL
                        </>
                    )}
                </button>

                {/* Botón Exportar .SQL */}
                <button
                    onClick={downloadSql}
                    style={{
                        padding: '8px 16px',
                        fontSize: '0.88rem',
                        fontWeight: '600',
                        color: '#2B6CB0',
                        backgroundColor: '#EBF8FF',
                        border: '1px solid #BEE3F8',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <Download style={{ width: 16, height: 16 }} />
                    Exportar .SQL
                </button>
            </div>

            <pre
                style={{
                    backgroundColor: '#1E1E1E',
                    color: '#D4D4D4',
                    padding: '16px 20px',
                    borderRadius: '8px',
                    overflowX: 'auto',
                    marginTop: '10px',
                    fontFamily: "'Fira Code', Consolas, Monaco, monospace",
                    fontSize: '0.88rem',
                    lineHeight: '1.5',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                }}
            >
                <code>{sql}</code>
            </pre>
        </div>
    );
};