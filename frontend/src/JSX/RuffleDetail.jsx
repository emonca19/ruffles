import React, { useEffect, useState } from "react";
// CORRECCIÓN: Quitamos 'data' que causaba error
import { useParams, useNavigate } from "react-router-dom";
import "../CSS/RuffleDetail.css";

// Ajusta tu URL base
const API_BASE_URL = 'http://localhost:8000'; 

export default function RuffleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // --- ESTADOS DE DATOS ---
  const [sorteo, setSorteo] = useState(null);
  const [numerosOcupados, setNumerosOcupados] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- ESTADOS DE INTERACCIÓN ---
  const [seleccionados, setSeleccionados] = useState([]); // Carrito de números
  const [centenaActiva, setCentenaActiva] = useState(null); // Modal de números (0, 1, 2...)
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false); // Modal final de datos
  
  // --- ESTADO DEL FORMULARIO DE USUARIO ---
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    nombre: "", 
  });

  // --- 1. CARGA DE DATOS (Rifa + Disponibilidad) ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // A) Obtener detalles de la rifa
        const respRifa = await fetch(`${API_BASE_URL}/api/v1/raffles/${id}/`);
        if (!respRifa.ok) {
            const contentType = respRifa.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") === -1) {
                throw new Error(`Error del servidor (${respRifa.status}). Verifica que la rifa exista.`);
            }
            const errData = await respRifa.json();
            throw new Error(errData.detail || "No se pudo cargar la rifa.");
        }
        const dataRifa = await respRifa.json();

        // Adaptador de imagen
        if (dataRifa.image && !dataRifa.image.startsWith('http')) {
             dataRifa.image_url = `${API_BASE_URL}${dataRifa.image}`;
        } else {
             dataRifa.image_url = dataRifa.image || "https://placehold.co/600x400?text=Sin+Imagen";
        }
        
        // Asegurar precio
        dataRifa.price_per_number = dataRifa.ticket_price || dataRifa.price_per_number || 0;

        // --- ADAPTADOR DE FECHA (CORREGIDO CON UTC) ---
        const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };

        // Fecha de Cierre (sale_end_at)
        if (dataRifa.sale_end_at) {
            dataRifa.formatted_date = new Date(dataRifa.sale_end_at).toLocaleDateString('es-MX', options);
        } else {
            dataRifa.formatted_date = "Por definir";
        }

        // Fecha del Sorteo (draw_scheduled_at)
        if (dataRifa.draw_scheduled_at) {
            dataRifa.formatted_draw_date = new Date(dataRifa.draw_scheduled_at).toLocaleDateString('es-MX', options);
        } else {
            dataRifa.formatted_draw_date = "Por definir";
        }

        // B) Obtener números ocupados (CON DEBUG)
        try {
            const urlAvail = `${API_BASE_URL}/api/v1/raffles/${id}/availability/`;
            console.log("Consultando disponibilidad en:", urlAvail); // DEBUG
            
            const respAvail = await fetch(urlAvail);
            if (respAvail.ok) {
                const dataAvail = await respAvail.json();
                console.log("Respuesta de disponibilidad:", dataAvail); // DEBUG: Mira esto en la consola
                
                // Asegúrate de que el backend devuelve 'taken_numbers' o ajusta aquí
                const ocupados = dataAvail.taken_numbers || dataAvail.occupied_numbers || [];
                setNumerosOcupados(ocupados);
            } else {
                console.warn(`Advertencia: Falló la carga de disponibilidad (Status: ${respAvail.status}).`);
            }
        } catch (availErr) {
            console.error("Error de red al cargar disponibilidad:", availErr);
        }
        
        setSorteo(dataRifa);

      } catch (err) {
        console.error("Error general:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // --- 2. LÓGICA DE CENTENAS ---
  const totalBoletos = sorteo?.number_end || 100; 
  const safeTotal = Number.isInteger(totalBoletos) ? totalBoletos : 100;
  const totalCentenas = Math.ceil(safeTotal / 100);
  const listaCentenas = Array.from({ length: totalCentenas }, (_, i) => i);
  
  // --- 3. MANEJADORES ---
  const toggleNumero = (numero) => {
    // No permitir seleccionar si está ocupado
    if (numerosOcupados.includes(numero)) return;
    
    if (seleccionados.includes(numero)) {
      setSeleccionados(seleccionados.filter(n => n !== numero));
    } else {
      setSeleccionados([...seleccionados, numero]);
    }
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCompraFinal = async () => {
    if (!formData.email || !formData.nombre || !formData.phone) {
        alert("Por favor completa todos los campos.");
        return;
    }

    const purchasePayload = {
        raffle_id: parseInt(id),
        numbers: seleccionados,
        guest_name: formData.nombre,
        guest_email: formData.email,
        guest_phone: formData.phone
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/purchases/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(purchasePayload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMsg = errorData.detail || JSON.stringify(errorData);
            throw new Error(errorMsg);
        }

        const data = await response.json();
        alert(`¡Apartado Exitoso!\nID: ${data.id}\nTe hemos enviado los detalles a ${formData.email}`);
        
        setSeleccionados([]);
        setMostrarConfirmacion(false);
        window.location.reload();

    } catch (err) {
        console.error("Error en la compra:", err);
        let mensaje = err.message;
        if (mensaje.includes("not currently on sale")) {
            mensaje = "Lo sentimos, esta rifa no está activa para ventas en este momento.";
        }
        alert(`Hubo un problema:\n${mensaje}`);
    }
  };

  const totalPagar = seleccionados.length * (sorteo?.price_per_number || 0);

  // --- RENDERIZADO ---
  if (isLoading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (error) return <div className="error-screen">{error}</div>;
  if (!sorteo) return null;

  return (
    <div className="ruffle-detail-container">
      <div className="detail-header">
        <div className="detail-image-container">
          <img src={sorteo.image_url} alt={sorteo.name} className="detail-image" />
        </div>
        <div className="detail-info">
          <h1>{sorteo.name}</h1>
          <p className="detail-description">{sorteo.description}</p>
          
          <div className="detail-meta">
            <div className="meta-item price">
              <span>Precio:</span>
              <strong>${sorteo.price_per_number} MXN</strong>
            </div>
            
            <div className="meta-item date">
              <span>Cierra el:</span>
              <strong>{sorteo.formatted_date}</strong>
            </div>
            
            <div className="meta-item draw-date">
              <span>Se juega el:</span>
              <strong>{sorteo.formatted_draw_date}</strong>
            </div>

            <div className="meta-item total">
              <span>Boletos:</span>
              <strong>{safeTotal}</strong>
            </div>
          </div>

          <div className="instructions-box">
            <h3>¿Cómo participar?</h3>
            <p>1. Selecciona abajo una tarjeta (centena).<br/>
               2. Elige tus números de la suerte.<br/>
               3. Haz clic en "Apartar" para completar tus datos.</p>
          </div>
        </div>
      </div>

      <div className="centenas-section">
        <h2>Selecciona tus números</h2>
        <div className="centenas-grid">
          {listaCentenas.map((index) => {
            const inicio = index * 100;
            const fin = Math.min((index + 1) * 100 - 1, safeTotal - 1);
            
            if (inicio >= safeTotal) return null;

            // Calcula cuántos ocupados hay en este rango específico
            const ocupadosEnEsta = numerosOcupados.filter(n => n >= inicio && n <= fin).length;
            const totalEnEsta = fin - inicio + 1;
            const porcentaje = (ocupadosEnEsta / totalEnEsta) * 100;
            
            const seleccionadosEnEsta = seleccionados.filter(n => n >= inicio && n <= fin).length;

            return (
              <div 
                key={index} 
                className={`centena-card ${seleccionadosEnEsta > 0 ? 'has-selection' : ''}`}
                onClick={() => setCentenaActiva(index)}
              >
                <h3>{inicio} - {fin}</h3>
                <div className="progress-bar">
                  {/* Barra visual de ocupación */}
                  <div className="progress-fill" style={{ width: `${porcentaje}%` }}></div>
                </div>
                <div className="card-status">
                  <span>{totalEnEsta - ocupadosEnEsta} libres</span>
                  {seleccionadosEnEsta > 0 && <span className="badge-sel">{seleccionadosEnEsta} tuyos</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL DE NÚMEROS */}
      {centenaActiva !== null && (
        <div className="modal-overlay" onClick={() => setCentenaActiva(null)}>
          <div className="modal-content numbers-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Rango {centenaActiva * 100} - {Math.min((centenaActiva + 1) * 100 - 1, safeTotal - 1)}</h3>
              <button className="close-btn" onClick={() => setCentenaActiva(null)}>×</button>
            </div>
            <div className="numeros-grid">
              {Array.from({ length: 100 }, (_, i) => {
                const numeroReal = (centenaActiva * 100) + i;
                if (numeroReal >= safeTotal) return null;

                // Verifica si este número específico está en la lista de ocupados
                const esOcupado = numerosOcupados.includes(numeroReal);
                const esSeleccionado = seleccionados.includes(numeroReal);

                return (
                  <button
                    key={numeroReal}
                    // Si está ocupado, añade la clase 'ocupado' (gris/tachado)
                    className={`numero-btn ${esOcupado ? 'ocupado' : ''} ${esSeleccionado ? 'seleccionado' : ''}`}
                    onClick={() => toggleNumero(numeroReal)}
                    disabled={esOcupado} // Deshabilita el clic si está ocupado
                  >
                    {numeroReal.toString().padStart(3, '0')}
                  </button>
                );
              })}
            </div>
            <div className="modal-footer">
              <button className="primary-btn" onClick={() => setCentenaActiva(null)}>Listo</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMACIÓN */}
      {mostrarConfirmacion && (
        <div className="modal-overlay">
          <div className="modal-content confirm-modal">
            <div className="modal-header">
              <h3>Completa tus datos</h3>
              <button className="close-btn" onClick={() => setMostrarConfirmacion(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="summary-box">
                <p><strong>Números:</strong> {seleccionados.join(', ')}</p>
                <p><strong>Total a Pagar:</strong> <span className="price-highlight">${totalPagar} MXN</span></p>
              </div>
              <form className="confirm-form" onSubmit={(e) => { e.preventDefault(); handleCompraFinal(); }}>
                <label>Nombre Completo</label>
                <input type="text" name="nombre" required value={formData.nombre} onChange={handleFormChange}/>
                <label>Correo Electrónico</label>
                <input type="email" name="email" required value={formData.email} onChange={handleFormChange}/>
                <label>Teléfono (WhatsApp)</label>
                <input type="tel" name="phone" required value={formData.phone} onChange={handleFormChange}/>
                <button type="submit" className="pay-btn">Confirmar Apartado</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* BARRA FLOTANTE */}
      {seleccionados.length > 0 && !mostrarConfirmacion && (
        <div className="checkout-bar">
          <div className="checkout-info">
            <div className="checkout-count">{seleccionados.length}</div>
            <div className="checkout-total">${totalPagar}</div>
          </div>
          <button className="apartar-btn" onClick={() => setMostrarConfirmacion(true)}>Apartar</button>
        </div>
      )}
    </div>
  );
}