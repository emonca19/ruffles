import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const respRifa = await fetch(`${API_BASE_URL}/api/v1/raffles/${id}/`);
        if (!respRifa.ok) throw new Error("No se pudo cargar la rifa");
        const dataRifa = await respRifa.json();

        if (dataRifa.image && !dataRifa.image.startsWith('http')) {
             dataRifa.image_url = `${API_BASE_URL}${dataRifa.image}`;
        } else {
             dataRifa.image_url = dataRifa.image || "https://via.placeholder.com/600x400?text=Sin+Imagen";
        }
        
        dataRifa.price_per_number = dataRifa.ticket_price || dataRifa.price_per_number || 0;
        
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            timeZone: 'UTC'
        };


        if (dataRifa.sale_end_at) {
            dataRifa.formatted_date = new Date(dataRifa.sale_end_at).toLocaleDateString('es-MX', options);
        } else {
            dataRifa.formatted_date = "Fecha por definir";
        }


        if (dataRifa.draw_scheduled_at) {
            dataRifa.formatted_draw_date = new Date(dataRifa.draw_scheduled_at).toLocaleDateString('es-MX', options);
        } else {
            dataRifa.formatted_draw_date = "Fecha por definir";
        }



        const respAvail = await fetch(`${API_BASE_URL}/api/v1/raffles/${id}/availability/`);
        const dataAvail = await respAvail.json();
        
        setSorteo(dataRifa);
        setNumerosOcupados(dataAvail.taken_numbers || []);

      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);
  const totalBoletos = sorteo ? sorteo.number_end : 100;
  
  const totalCentenas = Math.ceil(totalBoletos / 100);
  const listaCentenas = Array.from({ length: totalCentenas }, (_, i) => i);
  

  const toggleNumero = (numero) => {
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

    alert(`¡Compra Exitosa!\nNúmeros: ${seleccionados.join(', ')}\nUsuario: ${formData.email}`);
    setSeleccionados([]);
    setMostrarConfirmacion(false);
    window.location.reload();
  };

  const totalPagar = seleccionados.length * (sorteo?.price_per_number || 0);

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
              <span>Precio por boleto:</span>
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
            const fin = Math.min((index + 1) * 100 - 1, totalBoletos - 1);
            
            const ocupadosEnEsta = numerosOcupados.filter(n => n >= inicio && n <= fin).length;
            const porcentaje = (ocupadosEnEsta / 100) * 100;
            
            const seleccionadosEnEsta = seleccionados.filter(n => n >= inicio && n <= fin).length;

            return (
              <div 
                key={index} 
                className={`centena-card ${seleccionadosEnEsta > 0 ? 'has-selection' : ''}`}
                onClick={() => setCentenaActiva(index)}
              >
                <h3>{inicio} - {fin}</h3>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${porcentaje}%` }}></div>
                </div>
                <div className="card-status">
                  <span>{100 - ocupadosEnEsta} libres</span>
                  {seleccionadosEnEsta > 0 && <span className="badge-sel">{seleccionadosEnEsta} tuyos</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {centenaActiva !== null && (
        <div className="modal-overlay" onClick={() => setCentenaActiva(null)}>
          <div className="modal-content numbers-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Centena {centenaActiva * 100} - {Math.min((centenaActiva + 1) * 100 - 1, totalBoletos - 1)}</h3>
              <button className="close-btn" onClick={() => setCentenaActiva(null)}>×</button>
            </div>
            
            <div className="numeros-grid">
              {Array.from({ length: 100 }, (_, i) => {
                const numeroReal = (centenaActiva * 100) + i;
                if (numeroReal >= totalBoletos) return null;

                const esOcupado = numerosOcupados.includes(numeroReal);
                const esSeleccionado = seleccionados.includes(numeroReal);

                return (
                  <button
                    key={numeroReal}
                    className={`numero-btn ${esOcupado ? 'ocupado' : ''} ${esSeleccionado ? 'seleccionado' : ''}`}
                    onClick={() => toggleNumero(numeroReal)}
                    disabled={esOcupado}
                  >
                    {numeroReal.toString().padStart(3, '0')}
                  </button>
                );
              })}
            </div>
            
            <div className="modal-footer">
              <button className="primary-btn" onClick={() => setCentenaActiva(null)}>
                Listo, seguir viendo
              </button>
            </div>
          </div>
        </div>
      )}

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
                <input 
                  type="text" name="nombre" required 
                  value={formData.nombre} onChange={handleFormChange}
                />
                
                <label>Correo Electrónico</label>
                <input 
                  type="email" name="email" required 
                  value={formData.email} onChange={handleFormChange}
                />

                <label>Teléfono (WhatsApp)</label>
                <input 
                  type="tel" name="phone" required 
                  value={formData.phone} onChange={handleFormChange}
                />

                <button type="submit" className="pay-btn">Confirmar Apartado</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {seleccionados.length > 0 && !mostrarConfirmacion && (
        <div className="checkout-bar">
          <div className="checkout-info">
            <div className="checkout-count">{seleccionados.length} números</div>
            <div className="checkout-total">Total: ${totalPagar}</div>
          </div>
          <button className="apartar-btn" onClick={() => setMostrarConfirmacion(true)}>
            Apartar Ahora
          </button>
        </div>
      )}
    </div>
  );
}