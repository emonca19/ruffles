import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../CSS/RuffleDetail.css"; // Reutilizamos tu CSS de detalle

const API_BASE_URL = "http://localhost:8000";

// Función para obtener el token de autenticación
const getToken = () => localStorage.getItem('authToken'); 

// Función auxiliar para mapear el estado al texto de UI
const mapStatusToUI = (status) => {
  switch (status?.toLowerCase()) {
    case 'approved':
      return 'APROBADO';
    case 'rejected':
      return 'RECHAZADO';
    case 'pending':
      return 'Pendiente de Verificación';
    default:
      return 'Pendiente de Verificación'; // Estado por defecto
  }
}

export default function DetalleComprobante() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const evidencia = location.state?.evidencia; 

  const [isLoading, setIsLoading] = useState(false);
  const [statusLocal, setStatusLocal] = useState(mapStatusToUI(evidencia?.status)); 


  if (!evidencia) {
    return (
      // Pantalla de error más visible si faltan datos
      <div className="error-screen p-10 text-center bg-red-50 border border-red-300 rounded-lg m-10" style={{maxWidth: '800px', margin: '40px auto'}}>
        <h2 className="text-xl font-bold text-red-700 mb-4">Error: No se encontraron los detalles de la evidencia.</h2>
        <p className="text-red-600 mb-4">Esto sucede cuando la tarjeta no pasa los datos correctamente.</p>
        <button 
          className="apartar-btn bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded" 
          onClick={() => navigate('/galeriaEvidencia')}
        >
          Volver a la Galería
        </button>
      </div>
    );
  }

  // ✅ FUNCIÓN CORREGIDA: Ahora realiza la llamada a la API
  const handleVerification = async (action) => {
    setIsLoading(true);
    const token = getToken();
    const paymentId = evidencia.payment_id; // payment_id es el PK de PaymentWithReceipt
    const actionPayload = { action }; // { action: "approve" } o { action: "reject" }

    if (!token) {
      alert("Error de Autenticación. Por favor, inicie sesión.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        // Endpoint: /api/v1/purchases/verifications/{id}/verify/
        `${API_BASE_URL}/api/v1/purchases/verifications/${paymentId}/verify/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(actionPayload),
        }
      );

      if (!response.ok) {
        let errorMsg = `Error: ${response.status} ${response.statusText}.`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.detail || errorMsg;
        } catch (e) {
          // No es JSON
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      
      // Actualizar el estado local usando la respuesta de la API
      const newStatus = mapStatusToUI(data.status); 
      setStatusLocal(newStatus);
      
      if (action === 'approve') {
        alert(`Pago APROBADO exitosamente. Los boletos están vendidos.`);
      } else {
        // Mensaje específico para la acción de rechazo
        alert(`Pago RECHAZADO exitosamente. Los números han sido liberados.`);
      }

    } catch (error) {
      alert(`Error al procesar la verificación: ${error.message}`);
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

        {/* Los botones solo aparecen si el estado es 'Pendiente de Verificación' */}
        {statusLocal === 'Pendiente de Verificación' && (
          <>
            <button 
              className="apartar-btn" 
              style={{ background: 'var(--color-exito)' }}
              onClick={() => handleVerification('approve')}
              disabled={isLoading}
            >
              {isLoading ? 'Cargando...' : 'Aprobar Pago'}
            </button>

            <button 
              className="apartar-btn" 
              style={{ background: '#dc2626' }}
              onClick={() => handleVerification('reject')}
              disabled={isLoading}
            >
              Rechazar Pago
            </button>
          </>
        )}
      </div>


    </div>
  );
}