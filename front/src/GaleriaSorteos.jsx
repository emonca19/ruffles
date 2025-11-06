import React, { useState, useEffect } from 'react';
import TarjetaSorteo from './TarjetaSorteo';
import './GaleriaSorteos.css';

export default function GaleriaSorteos() {
  // Estados para manejar los 3 escenarios
  const [sorteos, setSorteos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- SIMULACIÓN DE LLAMADA A API ---
  // En un caso real, aquí usarías fetch() para llamar a
  // /api/raffles/?status=active
  useEffect(() => {
    // Simula una carga de 2 segundos
    setTimeout(() => {
      // PRUEBA Escenario 1: Con datos
      const datosSimulados = [
        { id: 1, name: "iPhone 15 Pro", image_url: "https://m.media-amazon.com/images/I/81fO2C9cYjL._AC_SY300_SX300_QL70_ML2_.jpg", price_per_number: 100 },
        { id: 2, name: "Canasta de Regalo", image_url: "https://mantelyservilleta.com/cdn/shop/files/RegaloCajaGourmetULTRAPremium-mantelyservilleta_1_1024x1024@2x.jpg?v=1699581917", price_per_number: 50 },
        { id: 3, name: "Viaje a la Playa", image_url: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1074", price_per_number: 250 },
        { id: 4, name: "Audífonos Pro", image_url: "https://via.placeholder.com/300x200?text=Audio", price_per_number: 75 },
        { id: 5, name: "Cena para Dos", image_url: "https://via.placeholder.com/300x200?text=Cena", price_per_number: 40 },
    ];
      setSorteos(datosSimulados);

      // PRUEBA Escenario 2: Sin datos 
      // Descomenta esta línea para probar el estado vacío:
      // setSorteos([]); 

      setIsLoading(false); // Termina la carga
    }, 2000);
  }, []);


  if (isLoading) {
    return (
      <div className="raffle-loading" data-testid="loading-spinner">
        <div className="spinner"></div>
        <p>Cargando sorteos...</p>
      </div>
    );
  }

  // Escenario Vacío (TC-HU05-004 [cite: 39])
  if (sorteos.length === 0) {
    return (
      <div className="raffle-empty-state" data-testid="empty-state-msg">
        <p>No hay sorteos disponibles en este momento. Vuelve pronto para participar.</p>
      </div>
    );
  }

  

  // Escenario con Datos
  return (
    // Usamos un Fragment (<>) para agrupar el header y la galería
    <>
      {/* --- 1. AQUÍ ESTÁ LA SECCIÓN DE "PRESENTACIÓN" --- */}
      <header className="galeria-header" id='rifas'>
        <h1>Nuestros Sorteos Activos</h1>
        <p>¡Elige tu favorito, apoya a la comunidad y gana!</p>
      </header>

      {/* --- 2. LA GALERÍA DE SORTEOS --- */}
      <div className="raffle-gallery" data-testid="raffle-gallery">
        {sorteos.map(sorteo => (
          <TarjetaSorteo key={sorteo.id} sorteo={sorteo} />
        ))}
      </div>
    </>
  );
}