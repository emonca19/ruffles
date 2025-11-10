import React from 'react';
import '../CSS/GaleriaSorteos.css'; 

export default function TarjetaSorteo({ sorteo, esOrganizador }) {
  const formatoPrecio = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  });

  const handleParticipar = () => {
    alert(`Participaste en el sorteo: ${sorteo.name}`);
  };

  return (
    <div className="raffle-card" data-testid="raffle-card">
      <img 
        src={sorteo.image_url} 
        alt={sorteo.name} 
        className="raffle-image" 
      />
      <div className="raffle-info">
        <h3 className="raffle-name">{sorteo.name}</h3>
        <p className="raffle-price">{formatoPrecio.format(sorteo.price_per_number)}</p>

        {/* 🔹 Botón solo para visitante */}
        {!esOrganizador && (
          <button className="raffle-btn" onClick={handleParticipar}>
            Participar
          </button>
        )}

        {/* 🔹 Solo visible si es organizador */}
        {esOrganizador && (
          <>
            <p className="raffle-status"><strong>Estado:</strong> {sorteo.status}</p>
            <p className="raffle-organizer"><strong>Organizador:</strong> {sorteo.organizer_name}</p>
          </>
        )}
      </div>
    </div>
  );
}
