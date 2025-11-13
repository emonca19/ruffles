import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../CSS/RuffleDetail.css";

export default function RuffleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sorteo, setSorteo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    number: "",
  });

  useEffect(() => {
    // Simula obtener datos reales de API
    setTimeout(() => {
      const datosSimulados = [
        {
          id: 1,
          name: "iPhone 15 Pro",
          image_url:
            "https://m.media-amazon.com/images/I/81fO2C9cYjL._AC_SY300_SX300_QL70_ML2_.jpg",
          price_per_number: 100,
          description:
            "Participa por un increíble iPhone 15 Pro con 256GB de almacenamiento, triple cámara y tecnología de punta.",
          deadline: "2025-12-30",
        },
        {
          id: 2,
          name: "Canasta de Regalo",
          image_url:
            "https://mantelyservilleta.com/cdn/shop/files/RegaloCajaGourmetULTRAPremium-mantelyservilleta_1_1024x1024@2x.jpg?v=1699581917",
          price_per_number: 50,
          description:
            "Canasta gourmet con productos seleccionados de alta calidad, ideal para regalar o disfrutar en casa.",
          deadline: "2025-11-25",
        },
        {
          id: 3,
          name: "Viaje a la Playa",
          image_url:
            "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?ixlib=rb-4.1.0&auto=format&fit=crop&w=1074&q=80",
          price_per_number: 250,
          description:
            "Disfruta unas vacaciones inolvidables en la playa con todo incluido. ¡Relájate bajo el sol!",
          deadline: "2025-12-15",
        },
      ];

      const encontrado = datosSimulados.find(
        (item) => item.id === parseInt(id)
      );
      setSorteo(encontrado);
      setIsLoading(false);
    }, 800);
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleParticipar = () => {
    if (!formData.email || !formData.phone || !formData.number) {
      alert("Por favor completa todos los campos.");
      return;
    }
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="raffle-loading">
        <div className="spinner"></div>
        <p>Cargando detalle del sorteo...</p>
      </div>
    );
  }

  if (!sorteo) {
    return (
      <div className="raffle-detail">
        <h2>Sorteo no encontrado</h2>
        <button className="back-btn" onClick={() => navigate("/")}>
          Volver a la galería
        </button>
      </div>
    );
  }

  return (
    <div className="raffle-detail-container">
      <button className="back-btn" onClick={() => navigate("/rifas")}>
        Volver
      </button>

      <div className="raffle-detail-card">
        <img
          src={sorteo.image_url}
          alt={sorteo.name}
          className="raffle-detail-img"
        />

        <div className="raffle-detail-info">
          <h1 className="raffle-detail-title">{sorteo.name}</h1>
          <p className="raffle-detail-description">{sorteo.description}</p>
          <p className="raffle-detail-price">
            Precio por boleto:{" "}
            <span>
              {new Intl.NumberFormat("es-MX", {
                style: "currency",
                currency: "MXN",
              }).format(sorteo.price_per_number)}
            </span>
          </p>

          <p className="raffle-detail-date">
            Fecha límite de compra: <strong>{sorteo.deadline}</strong>
          </p>

          <form className="participation-form">
            <label>Correo electrónico:</label>
            <input
              type="email"
              name="email"
              placeholder="ejemplo@correo.com"
              value={formData.email}
              onChange={handleChange}
            />

            <label>Número de teléfono:</label>
            <input
              type="tel"
              name="phone"
              placeholder="662-123-4567"
              value={formData.phone}
              onChange={handleChange}
            />

            <label>Número que deseas elegir (1-100):</label>
            <input
              type="number"
              name="number"
              min="1"
              max="100"
              placeholder="Ej. 27"
              value={formData.number}
              onChange={handleChange}
            />

            <button
              type="button"
              className="raffle-participar-btn"
              onClick={handleParticipar}
            >
              Participar
            </button>
          </form>
        </div>
      </div>

      {showPopup && (
        <div className="popup-success">
          <h2>✅ Apartado Exitoso</h2>
          <p>Tu número ha sido registrado correctamente.</p>
        </div>
      )}
    </div>
  );
}
