import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import "../CSS/RuffleDetail.css";

const API_BASE_URL = "http://localhost:8000";

export default function ParticipacionDetalle() {
    const { id } = useParams();
    const location = useLocation();
    const phone = location.state?.phone;

    // Estado inicial
    const [detalle, setDetalle] = useState(null); 
    const [numerosUsuario, setNumerosUsuario] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [seleccionados, setSeleccionados] = useState([]);
    const [comprobante, setComprobante] = useState(null);

    useEffect(() => {
        if (!phone) {
            setError("No se proporcionó el número de teléfono.");
            setIsLoading(false);
            return;
        }

        const loadData = async () => {
            try {
                const resp = await fetch(`${API_BASE_URL}/api/v1/purchases/?phone=${phone}`);

                if (!resp.ok) throw new Error("Error al cargar datos.");

                const data = await resp.json();

                // Encuentra la compra asociada a la rifa actual
                const compra = data.find(x => x.raffle_id === parseInt(id));

                if (!compra) {
                    throw new Error("No se encontró participación en esta rifa.");
                }

                // 1. Obtener todos los detalles de la compra
                const allNumerosDetails = (compra.details || []).map(d => ({
                    number: d.number,
                    // Usamos d.status, que debería ser 'Pending', 'Paid', etc.
                    status: d.status || 'Pending' 
                }));

                // 2. FILTRAR para mantener SOLO los boletos que están en estado 'Pending' (Apartado)
                const numerosApartados = allNumerosDetails
                    .filter(detail => detail.status === 'Pending'); // <-- Debe coincidir con el valor de Django

                // 3. Ordenar la lista filtrada
                numerosApartados.sort((a, b) => a.number - b.number);
                
                setNumerosUsuario(numerosApartados);

                // --- Corrección de imagen y otros detalles ---
                let imgUrl = compra.raffle_image;
                if (imgUrl && !imgUrl.startsWith('http')) {
                    imgUrl = `${API_BASE_URL}${imgUrl}`;
                } else if (!imgUrl) {
                    imgUrl = "https://placehold.co/600x400?text=Sorteo";
                }

                // 5. Establecer el detalle de la rifa para la UI
                setDetalle({
                    purchase_id: compra.id,
                    raffle_id: compra.raffle_id,
                    raffle_name: compra.raffle_name,
                    image_url: imgUrl,
                    price: parseFloat(compra.details?.[0]?.unit_price || 0), 
                });

            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [id, phone]);


    const toggleNumero = (num) => {
        const obj = numerosUsuario.find(n => n.number === num);
        if (obj?.status === "paid") return;

        if (seleccionados.includes(num)) {
            setSeleccionados(seleccionados.filter(n => n !== num));
        } else {
            setSeleccionados([...seleccionados, num]);
        }
    };

    const handleUpload = async () => {
        if (seleccionados.length === 0) {
            alert("Por favor, selecciona los números que vas a pagar con este comprobante.");
            return;
        }

        if (!comprobante) {
            alert("Debes seleccionar una imagen del comprobante.");
            return;
        }
        
        if (!detalle?.purchase_id) {
             alert("Error: ID de compra no encontrado. Intenta recargar.");
             return;
        }

        const formData = new FormData();
        formData.append("receipt_image", comprobante);
        formData.append("phone", phone); 
        
        seleccionados.forEach(num => {
            formData.append("numbers", num); 
        });

        try {
            const resp = await fetch(
                `${API_BASE_URL}/api/v1/purchases/${detalle.purchase_id}/upload_receipt/`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!resp.ok) {
                const errorText = await resp.text();
                let errorJson;
                try { errorJson = JSON.parse(errorText); /* eslint-disable-next-line no-unused-vars, no-empty */ } catch (_) {}
                
                const mensaje = errorJson?.detail || "Fallo en el servidor (Revisa logs de Django).";
                throw new Error(`Error ${resp.status}: ${mensaje}`);
            }

            alert(`Comprobante enviado correctamente para los números: ${seleccionados.join(', ')}.`);
            
            // Limpieza
            setSeleccionados([]);
            setComprobante(null);
            window.location.reload(); // Recargar para actualizar la lista

        } catch (err) {
            console.error("Error en el upload:", err);
            alert(err.message);
        }
    };

    const handleCancelReservation = async () => {
    if (!detalle?.purchase_id) {
        alert("Error: ID de compra no encontrado. Intenta recargar.");
        return;
    }

    const confirmacion = window.confirm(
        `¿Estás seguro de que quieres cancelar esta reservación y liberar los ${numerosUsuario.length} números apartados? Esta acción no se puede deshacer.`
    );

    if (!confirmacion) return;

    try {
        const resp = await fetch(
            `${API_BASE_URL}/api/v1/purchases/${detalle.purchase_id}/cancel/`,
            {
                method: "POST", 
                headers: {
                    'Content-Type': 'application/json',
                },
                // Enviamos el teléfono para la autenticación del invitado en el backend
                body: JSON.stringify({ phone: phone }),
            }
        );

        if (!resp.ok) {
            const errorText = await resp.text();
            let errorJson;
            try { errorJson = JSON.parse(errorText); /* eslint-disable-next-line no-unused-vars, no-empty */ } catch (_) {}
            
            const mensaje = errorJson?.detail || "Fallo en el servidor al cancelar.";
            throw new Error(`Error ${resp.status}: ${mensaje}`);
        }

        alert("Reservación cancelada y números liberados exitosamente.");
        
        // Recargar para actualizar la vista: ya no habrá números pendientes
        window.location.reload(); 

    } catch (err) {
        console.error("Error al cancelar la reserva:", err);
        alert(err.message);
    }
};


    if (isLoading) return <div className="loading-screen"><div className="spinner"></div></div>;
    if (error) return <div className="error-screen">{error}</div>;
    if (!detalle) return <div className="error-screen">No se pudo cargar el detalle.</div>;

    const totalPagar = seleccionados.length * detalle.price;
    const showCancelButton = numerosUsuario.length > 0; // Mostrar si hay números pendientes


    return (
        <div className="ruffle-detail-container">
            <div className="detail-header">

                <div className="detail-image-container">
                    <img 
                        src={detalle.image_url}
                        alt={detalle.raffle_name}
                        className="detail-image"
                        onError={(e) => { e.target.src = "https://placehold.co/600x400?text=Sorteo"; }}
                    />
                </div>

                <div className="detail-info">
                    <h1>{detalle.raffle_name}</h1>
                    <p className="detail-description">
                        Aquí puedes ver los números que tienes en esta rifa y seleccionar cuáles deseas pagar.
                    </p>

                    <div className="detail-meta">
                        <div className="meta-item">
                            <span>Precio por número</span>
                            <strong>${detalle.price} MXN</strong>
                        </div>

                        <div className="meta-item">
                            <span>Total de números</span>
                            <strong>{numerosUsuario.length}</strong>
                        </div>
                    </div>

                    <div className="instructions-box">
                        <h3>Instrucciones</h3>
                        <p>
                            1. Toca los números que vas a pagar.<br/>
                            2. Sube la foto de tu comprobante.<br/>
                            3. Envía para validación.
                        </p>
                    </div>
                </div>
            </div>
            
            <h2 style={{ textAlign: "center", marginBottom: "15px" }}>Tus números</h2>

            <div className="numeros-grid" style={{ maxHeight: "none", marginBottom: "30px" }}>
                {numerosUsuario.map(obj => {
                    const isSelected = seleccionados.includes(obj.number);
                    const isPaid = obj.status === "paid";

                    return (
                        <button
                            key={obj.number}
                            className={`numero-btn ${isSelected ? "seleccionado" : ""} ${isPaid ? "ocupado" : ""}`}
                            style={{
                                backgroundColor: isPaid ? '#dcfce7' : (isSelected ? 'var(--detail-accent)' : '#fff'),
                                color: isPaid ? '#166534' : (isSelected ? '#fff' : '#333'),
                                borderColor: isPaid ? '#86efac' : (isSelected ? 'var(--detail-accent)' : '#ccc'),
                                cursor: isPaid ? 'default' : 'pointer'
                            }}
                            onClick={() => toggleNumero(obj.number)}
                            disabled={isPaid}
                        >
                            {obj.number.toString().padStart(3, "0")}
                        </button>
                    );
                })}
            </div>

            {showCancelButton && seleccionados.length === 0 && (
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <button
                        className="apartar-btn"
                        onClick={handleCancelReservation}
                        style={{
                            backgroundColor: '#dc2626', // Rojo para cancelar/liberar
                            color: '#fff',
                            padding: '10px 20px',
                            borderRadius: '5px',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s'
                        }}
                    >
                        ❌ Liberar y cancelar mi reservación
                    </button>
                </div>
            )}

            {seleccionados.length > 0 && (
                <div className="checkout-bar" style={{flexDirection: 'column', gap: '10px', padding: '20px', borderRadius: '20px'}}>
                    
                    <div style={{width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px'}}>
                        <div>
                            <span style={{fontWeight: 'bold', color: 'var(--detail-accent)'}}>
                                {seleccionados.length} seleccionados
                            </span>
                            <span style={{marginLeft: '10px', color: '#666'}}>
                                (Total: ${totalPagar})
                            </span>
                        </div>
                    </div>

                    <div style={{width: '100%', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between'}}>
                        <label 
                            className="apartar-btn" 
                            style={{ 
                                cursor: "pointer", 
                                backgroundColor: comprobante ? '#10b981' : '#6b7280',
                                flex: 1,
                                textAlign: 'center'
                            }}
                        >
                            {comprobante ? 'Comprobante Listo' : 'Subir Comprobante'}
                            <input
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={(e) => setComprobante(e.target.files[0])}
                            />
                        </label>

                        <button 
                            className="apartar-btn" 
                            onClick={handleUpload}
                            disabled={!comprobante}
                            style={{
                                opacity: comprobante ? 1 : 0.5,
                                flex: 1
                            }}
                        >
                            Enviar Pago
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}