import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import "../CSS/RuffleDetail.css";

const API_BASE_URL = "http://localhost:8000";

export default function ParticipacionDetalle() {
    const { id } = useParams();
    const location = useLocation();
    const phone = location.state?.phone;

    // Estado inicial de detalle debe ser lo suficientemente completo para evitar errores
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

                // Encuentra la compra asociada a la rifa actual (id de useParams)
                const compra = data.find(x => x.raffle_id === parseInt(id));

                if (!compra) {
                    throw new Error("No se encontró participación en esta rifa.");
                }

                setDetalle({
                    // 🚨 CORRECCIÓN CLAVE: Guardar el ID de la compra para usarlo en el upload
                    purchase_id: compra.id, // ASUMIMOS que el ID de la compra está en `compra.id`
                    // ----------------------
                    raffle_id: compra.raffle_id,
                    raffle_name: compra.raffle_name,
                    image_url: compra.raffle_image,
                    price: parseFloat(compra.details?.[0]?.unit_price || 0),
                });

                // ... (Cargar números)
                const numeros = compra.details.map(d => ({
                    number: d.number,
                    status: "pending" 
                }));

                numeros.sort((a, b) => a.number - b.number);
                setNumerosUsuario(numeros);

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

        if (obj.status === "paid") return;

        if (seleccionados.includes(num)) {
            setSeleccionados(seleccionados.filter(n => n !== num));
        } else {
            setSeleccionados([...seleccionados, num]);
        }
    };

    const handleUpload = async () => {
        // Validaciones iniciales
        if (seleccionados.length === 0) {
            alert("Selecciona al menos un número.");
            return;
        }

        if (!comprobante) {
            alert("Debes subir un comprobante.");
            return;
        }
        // Validación de ID de compra
        if (!detalle.purchase_id) {
             alert("Error: ID de compra no encontrado. Intenta recargar.");
             return;
        }


        const formData = new FormData();
        formData.append("receipt_image", comprobante);
        formData.append("phone", phone); 
        // Si tu backend lo requiere, podrías agregar los números seleccionados también:
        // formData.append("numbers", JSON.stringify(seleccionados)); 

        try {
            const resp = await fetch(
                // USANDO EL purchase_id OBTENIDO EN EL useEffect
                `${API_BASE_URL}/api/v1/purchases/${detalle.purchase_id}/upload_receipt/`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!resp.ok) {
                const errorData = await resp.json();
                throw new Error(`Error ${resp.status}: ${errorData.detail || "Fallo en el servidor."}`);
            }

            alert("Comprobante enviado correctamente. El administrador revisará el pago.");
            setSeleccionados([]);
            setComprobante(null);
            // Podrías recargar los datos de la rifa aquí si quieres actualizar el estado de los números

        } catch (err) {
            console.error("Error en el upload:", err);
            alert(err.message);
        }
    };

    // ... (JSX de renderizado)
    if (isLoading) return <div className="loading-screen"><div className="spinner"></div></div>;
    if (error) return <div className="error-screen">{error}</div>;

    // Se necesita una verificación adicional para `detalle` si la compra no se encontró
    if (!detalle) return <div className="error-screen">No se pudo cargar el detalle de la rifa.</div>;

    return (
        <div className="ruffle-detail-container">
            <div className="detail-header">

                <div className="detail-image-container">
                    <img 
                        src={detalle.image_url}
                        alt={detalle.raffle_name}
                        className="detail-image"
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
                        <h3>¿Qué puedes hacer aquí?</h3>
                        <p>
                            • Revisa tus números apartados.<br/>
                            • Selecciona los que deseas pagar.<br/>
                            • Sube un comprobante para confirmar el pago.
                        </p>
                    </div>
                </div>
            </div>
            <h2 style={{ textAlign: "center", marginBottom: "15px" }}>Tus números</h2>

            <div className="numeros-grid" style={{ maxHeight: "none" }}>
                {numerosUsuario.map(obj => {
                    const isSelected = seleccionados.includes(obj.number);

                    return (
                        <button
                            key={obj.number}
                            className={`numero-btn ${isSelected ? "seleccionado" : ""}`}
                            onClick={() => toggleNumero(obj.number)}
                        >
                            {obj.number.toString().padStart(3, "0")}
                        </button>
                    );
                })}
            </div>
            {seleccionados.length > 0 && (
                <div className="checkout-bar">
                    <div className="checkout-info">
                        <div className="checkout-count">{seleccionados.length}</div>
                        <div className="checkout-total">
                            ${seleccionados.length * detalle.price}
                        </div>
                    </div>

                    <label className="apartar-btn" style={{ cursor: "pointer" }}>
                        Subir Comprobante ({comprobante ? 'Listo' : 'Archivo...'})
                        <input
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={(e) => setComprobante(e.target.files[0])}
                        />
                    </label>

                    <button className="apartar-btn" onClick={handleUpload}>
                        Enviar Pago
                    </button>
                </div>
            )}

        </div>
    );
}