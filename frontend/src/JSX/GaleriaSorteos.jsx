import React, { useState, useEffect } from 'react';
import TarjetaSorteo from './TarjetaSorteo.jsx';
import '../CSS/GaleriaSorteos.css';

export default function GaleriaSorteos() {
  const [sorteos, setSorteos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vista, setVista] = useState('visitante'); // visitante | organizador

  useEffect(() => {
    setIsLoading(true);

    // Simula una carga (aquí iría tu fetch real)
    setTimeout(() => {
      if (vista === 'visitante') {
        const datosSimulados = [
          { id: 1, name: "iPhone 15 Pro", image_url: "https://m.media-amazon.com/images/I/81fO2C9cYjL._AC_SY300_SX300_QL70_ML2_.jpg", price_per_number: 100 },
          { id: 2, name: "Canasta de Regalo", image_url: "https://mantelyservilleta.com/cdn/shop/files/RegaloCajaGourmetULTRAPremium-mantelyservilleta_1_1024x1024@2x.jpg?v=1699581917", price_per_number: 50 },
          { id: 3, name: "Viaje a la Playa", image_url: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?ixlib=rb-4.1.0&auto=format&fit=crop&w=1074&q=80", price_per_number: 250 },
          { id: 4, name: "Audífonos Pro", image_url: "https://via.placeholder.com/300x200?text=Audio", price_per_number: 75 },
          { id: 5, name: "Cena para Dos", image_url: "https://via.placeholder.com/300x200?text=Cena", price_per_number: 40 },
        ];
        setSorteos(datosSimulados);
      } else {
        // Escenario 4: Organizador sin sorteos creados
        const datosOrganizador = []; // Simula que no tiene sorteos
        setSorteos(datosOrganizador);
      }

      setIsLoading(false);
    }, 1500);
  }, [vista]);

  if (isLoading) {
    return (
      <div className="raffle-loading">
        <div className="spinner"></div>
        <p>Cargando sorteos...</p>
      </div>
    );
  }

  // --- Escenario sin sorteos ---
  if (sorteos.length === 0) {
    return (
      <>
        <nav className="raffle-nav">
          <button
            className={vista === 'visitante' ? 'active' : ''}
            onClick={() => setVista('visitante')}
          >
            Visitante
          </button>
          <button
            className={vista === 'organizador' ? 'active' : ''}
            onClick={() => setVista('organizador')}
          >
            Organizador
          </button>
        </nav>

        <div className="raffle-empty-state">
          {vista === 'visitante' ? (
            <>
              <p>No hay sorteos disponibles en este momento. Vuelve pronto para participar.</p>
            </>
          ) : (
            <>
              <h2>No hay sorteos en el sistema</h2>
              <button
                className="raffle-participar-btn"
                onClick={() => (window.location.href = "/registro")}
              >
                Registrar Nuevo Sorteo
              </button>
            </>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <nav className="raffle-nav">
        <button
          className={vista === 'visitante' ? 'active' : ''}
          onClick={() => setVista('visitante')}
        >
          Visitante
        </button>
        <button
          className={vista === 'organizador' ? 'active' : ''}
          onClick={() => setVista('organizador')}
        >
          Organizador
        </button>
      </nav>

      <header className="galeria-header" id="rifas">
        <h1>
          {vista === 'visitante'
            ? 'Nuestros Sorteos Activos'
            : 'Todos los Sorteos del Sistema'}
        </h1>
        <p>
          {vista === 'visitante'
            ? '¡Elige tu favorito, apoya a la comunidad y gana!'
            : 'Visualiza y administra tus sorteos.'}
        </p>
      </header>

      <div className="raffle-gallery">
        {sorteos.map((sorteo) => (
          <TarjetaSorteo
            key={sorteo.id}
            sorteo={sorteo}
            esOrganizador={vista === 'organizador'}
          />
        ))}
      </div>
    </>
  );
}
