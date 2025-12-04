import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../CSS/RuffleDetail.css"; // Reutilizamos tu CSS de detalle

const API_BASE_URL = "http://localhost:8000";

export default function DetalleComprobante() {
    // 1. OBTENER DATOS: Usamos useLocation para obtener la 'evidencia' pasada por la tarjeta.
    const location = useLocation();
    const navigate = useNavigate();
    
    // La evidencia viene en 'location.state.evidencia'. Si no existe, volvemos a la galería.
    const evidencia = location.state?.evidencia; 

    // Estado local para simular la verificación
    const [isLoading, setIsLoading] = useState(false);
    const [statusLocal, setStatusLocal] = useState(evidencia?.status || "Cargando...");


    if (!evidencia) {
        return (
            <div className="error-screen">
                Error: No se encontraron los detalles de la evidencia.
                <button 
                    className="apartar-btn" 
                    onClick={() => navigate('/galeriaEvidencia')}
                >
                    Volver a la Galería
                </button>
            </div>
        );
    }

    // Función de simulación para Aprobar/Rechazar
    const handleVerification = async (action) => {
        setIsLoading(true);
            
        console.log(`Simulando acción: ${action} para la compra ID: ${evidencia.purchase_id}`);

        try {
            // Simulamos la espera de la API
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const newStatus = action === 'approve' ? 'APROBADO' : 'RECHAZADO';
            setStatusLocal(newStatus);
            alert(`Pago ${newStatus} exitosamente.`);

            // Opcional: Volver a la galería después de la acción
            // navigate('/galeriaEvidencia'); 

        } catch (error) {
            alert("Error al procesar la verificación. Inténtalo de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    // Formato de moneda
    const formatoPrecio = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
    });
    
    // Determinar color del estado
    const getStatusColor = (status) => {
        switch (status) {
            case 'APROBADO':
                return 'text-green-600 bg-green-50 border-green-200';
            case 'RECHAZADO':
                return 'text-red-600 bg-red-50 border-red-200';
            default:
                return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        }
    };


    return (
        <div className="ruffle-detail-container">
            
            <h1 style={{ color: "var(--detail-accent)", textAlign: "center", marginBottom: "30px" }}>
                Verificación de Comprobante #{evidencia.purchase_id}
            </h1>

            <div className="detail-header">
                
                {/* Columna de Información del Cliente y Compra */}
                <div className="detail-info">
                    <h2>Detalles de la Compra</h2>
                    <p className="detail-description">
                        **Cliente:** {evidencia.customer_name}<br/>
                        **Rifa:** {evidencia.raffle_name}<br/>
                        **Fecha de Pago:** {evidencia.payment_date}
                    </p>

                    <div className="detail-meta">
                        <div className="meta-item">
                            <span>Total Pagado</span>
                            <strong className="price-highlight" style={{ fontSize: '1.8rem' }}>
                                {formatoPrecio.format(evidencia.total_amount)}
                            </strong>
                        </div>

                        <div className="meta-item">
                            <span>Boletos Pagados</span>
                            <strong style={{ fontSize: '1.8rem' }}>{evidencia.tickets.length}</strong>
                        </div>
                    </div>

                    {/* Lista de Boletos */}
                    <h3>Boletos involucrados:</h3>
                    <div className="numeros-grid" style={{maxHeight: '150px'}}>
                        {evidencia.tickets.map(ticket => (
                            <div key={ticket} className="numero-btn ocupado" style={{ textDecoration: 'none', background: '#eef2ff', color: 'var(--detail-accent)' }}>
                                {ticket.toString().padStart(3, "0")}
                            </div>
                        ))}
                    </div>
                </div>


                {/* Columna de Comprobante y Acciones */}
                <div className="detail-image-container">
                    <h2>Comprobante</h2>
                    <img 
                        src={evidencia.receipt_url}
                        alt={`Comprobante de ${evidencia.customer_name}`}
                        className="detail-image"
                        style={{ maxHeight: '400px', objectFit: 'contain' }}
                    />
                </div>
            </div>
            
            <div className="checkout-bar" style={{ position: 'relative', transform: 'none', left: '0', margin: '40px auto', maxWidth: '800px', borderRadius: '12px' }}>
                <div className="checkout-info" style={{ flexGrow: 1, textAlign: 'center' }}>
                    <p className={`p-2 font-bold rounded-lg border ${getStatusColor(statusLocal)}`} style={{ fontSize: '1.2rem' }}>
                        ESTATUS ACTUAL: {statusLocal}
                    </p>
                </div>

                {statusLocal === 'Pendiente de Verificación' && (
                    <>
                        <button 
                            className="apartar-btn" 
                            style={{ background: 'var(--color-exito)' }}
                            onClick={() => handleVerification('approve')}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Cargando...' : '✅ Aprobar Pago'}
                        </button>

                        <button 
                            className="apartar-btn" 
                            style={{ background: '#dc2626' }}
                            onClick={() => handleVerification('reject')}
                            disabled={isLoading}
                        >
                            ❌ Rechazar Pago
                        </button>
                    </>
                )}
            </div>


        </div>
    );
}