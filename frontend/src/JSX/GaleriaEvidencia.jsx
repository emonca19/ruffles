import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../CSS/GaleriaSorteos.css'; 

// --- Datos Hardcodeados de Evidencias de Pago ---
const HARDCODED_EVIDENCES = [
    {
        id: 1,
        raffle_name: "Sorteo del Automóvil Clásico (ID: 45)",
        purchase_id: "P-45001",
        customer_name: "Ana Morales",
        total_amount: 1500.00,
        tickets: ["001", "002", "003", "105", "106", "107"],
        receipt_url: "https://placehold.co/800x600/1e40af/ffffff?text=Comprobante+de+Pago+ID+1",
        payment_date: "2024-11-28 10:30",
        status: "Pendiente de Verificación",
    },
    {
        id: 2,
        raffle_name: "Viaje a Cancún Todo Incluido (ID: 12)",
        purchase_id: "P-12005",
        customer_name: "Javier López",
        total_amount: 500.00,
        tickets: ["250", "251"],
        receipt_url: "https://placehold.co/800x600/10b981/ffffff?text=Comprobante+de+Pago+ID+2",
        payment_date: "2024-11-28 15:45",
        status: "Pendiente de Verificación",
    },
    {
        id: 3,
        raffle_name: "Kit Gamer Completo (ID: 78)",
        purchase_id: "P-78012",
        customer_name: "Sofia Rodríguez",
        total_amount: 250.00,
        tickets: ["500"],
        receipt_url: "https://placehold.co/800x600/f59e0b/ffffff?text=Comprobante+de+Pago+ID+3",
        payment_date: "2024-11-29 08:00",
        status: "Pendiente de Verificación",
    },
];

// Componente para una sola tarjeta de evidencia
const TarjetaEvidencia = ({ evidencia }) => {
    const navigate = useNavigate();

    const formatoPrecio = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
    });

    return (
        <div 
            className="raffle-card cursor-pointer"
            // Navega al detalle de la evidencia, pasando el objeto completo como estado
            onClick={() => navigate(`/evidencias/${evidencia.id}`, { state: { evidencia } })}
        >
            <img 
                src={evidencia.receipt_url} 
                alt={`Comprobante de ${evidencia.customer_name}`} 
                className="raffle-image" 
                
                onError={(e) => { 
                    e.target.onerror = null; 
                    e.target.src = "https://placehold.co/400x200/4f46e5/ffffff?text=COMPROBANTE+NO+DISPONIBLE"; 
                }}
            />
            
            <div className="raffle-info">
                <h3 className="raffle-name text-indigo-700">
                    {evidencia.purchase_id} - {evidencia.raffle_name.split('(')[0]}
                </h3>
                
                <p className="raffle-description font-medium">
                    <span className="font-semibold text-gray-700">Cliente:</span> {evidencia.customer_name}
                </p>

                <div className="flex justify-between items-center mt-2 border-t pt-2">
                    <p className="text-sm font-medium text-gray-500">
                        Total Pagado: 
                        <span className="ml-1 text-lg font-bold text-green-600">
                            {formatoPrecio.format(evidencia.total_amount)}
                        </span>
                    </p>
                    <p className="text-xs text-gray-500">
                        Boletos: <span className="font-bold text-gray-700">{evidencia.tickets.length}</span>
                    </p>
                </div>
                
                <p className="text-center text-sm mt-3 font-semibold text-red-600 border border-red-200 bg-red-50 py-1 rounded-lg">
                    {evidencia.status}
                </p>
            </div>
        </div>
    );
};

export default function GaleriaEvidencias() {
    const [evidencias, setEvidencias] = useState(HARDCODED_EVIDENCES);
    
    const isLoading = false;

    if (isLoading) {
        return <div className="raffle-loading">Cargando Evidencias...</div>;
    }

    return (
        <div>
            <header className="galeria-header">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                    <span className="text-indigo-600">Verificación de</span> Pagos
                </h1>
                <p className="text-lg text-gray-600">
                    Lista de comprobantes de pago pendientes de revisar y aprobar.
                </p>
            </header>

            {evidencias.length === 0 ? (
                <div className="raffle-empty-state">
                    <p className="text-lg font-medium">No hay evidencias pendientes de verificación.</p>
                </div>
            ) : (
                <div className="raffle-gallery">
                    {evidencias.map((evidencia) => (
                        <TarjetaEvidencia key={evidencia.id} evidencia={evidencia} />
                    ))}
                </div> 
            )}
        </div>
    );
}
