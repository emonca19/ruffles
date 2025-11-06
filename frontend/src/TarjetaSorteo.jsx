import React from 'react';
import './GaleriaSorteos.css'; 

export default function TarjetaSorteo({ sorteo }) {
  
  const formatoPrecio = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  });

  return (
    <div className="raffle-card" data-testid="raffle-card">
      <img 
        src={sorteo.image_url} 
        alt={sorteo.name} 
        className="raffle-image" 
      />
      <div className="raffle-info">
        <h3 className="raffle-name">{sorteo.name}</h3>
        <p className="raffle-price">
          {formatoPrecio.format(sorteo.price_per_number)}
        </p>
      </div>
    </div>
  );
}