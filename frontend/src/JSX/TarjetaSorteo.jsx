import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../CSS/GaleriaSorteos.css';

export default function TarjetaSorteo({ sorteo, esOrganizador }) {
  const navigate = useNavigate();

  const formatoPrecio = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  });

  const handleClick = () => {
    navigate(`/detalle/${sorteo.id}`);
  };

  const handleParticipar = (e) => {
    e.stopPropagation(); // evita que se dispare el click del card
    navigate(`/detalle/${sorteo.id}`);
  };

  return (
    <div className="raffle-card" data-testid="raffle-card" onClick={handleClick}>
      <img
        src={sorteo.image_url}
        alt={sorteo.name}
        className="raffle-image"
      />
      <div className="raffle-info">
        <h3 className="raffle-name">{sorteo.name}</h3>
        <p className="raffle-price">{formatoPrecio.format(sorteo.price_per_number)}</p>

        {!esOrganizador && (
          <button className="raffle-btn" onClick={handleParticipar}>
            Participar
          </button>
        )}

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
