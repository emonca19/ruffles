import React, { useState, useEffect } from 'react';
import TarjetaSorteo from './TarjetaSorteo';
import './GaleriaSorteos.css';

export default function GaleriaSorteos() {
  const [lottery, setLottery] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  //SIMULACIÓN DE LLAMADA A API
  // En un caso real, aquí usarías fetch() para llamar a
  // /api/raffles/?status=active [cite: 11]
  useEffect(() => {
    // Simula una carga de 2 segundos (para TC-HU05-017 [cite: 79])
    setTimeout(() => {
      // PRUEBA Escenario 1: Con datos (TC-HU05-001 [cite: 32])
      const simulationData = [
        { id: 1, name: "iPhone 15 Pro", image_url: "https://m.media-amazon.com/images/I/81fO2C9cYjL._AC_SY300_SX300_QL70_ML2_.jpg", price_per_number: 100 },
        { id: 2, name: "Gift Box", image_url: "https://mantelyservilleta.com/cdn/shop/files/RegaloCajaGourmetULTRAPremium-mantelyservilleta_1_1024x1024@2x.jpg?v=1699581917", price_per_number: 50 },
        { id: 3, name: "Travel to the Beach", image_url: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1074", price_per_number: 250 },
        { id: 4, name: "Headphones Pro", image_url: "https://via.placeholder.com/300x200?text=Audio", price_per_number: 75 },
        { id: 5, name: "Dinner for two", image_url: "https://via.placeholder.com/300x200?text=Cena", price_per_number: 40 },
    ];
      setLottery(simulationData);

      // PRUEBA Escenario 2: Sin datos (TC-HU05-004 [cite: 39])
      // Descomenta esta línea para probar el estado vacío:
      // setSorteos([]); 

      setIsLoading(false); // Termina la carga
    }, 2000);
  }, []);


  // Escenario de Carga (TC-HU05-017 [cite: 79])
  if (isLoading) {
    return (
      <div className="raffle-loading" data-testid="loading-spinner">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Escenario Vacío (TC-HU05-004 [cite: 39])
  if (lottery.length === 0) {
    return (
      <div className="raffle-empty-state" data-testid="empty-state-msg">
        <p>There are not lottery avaliable at this momment...</p>
      </div>
    );
  }

  return (
    <>
      <header className="galeria-header">
        <h1>OUR ACTIVE LOTTERY</h1>
        <p>CHOOSE YOUR FAVORITE, HELP THE COMMUNITY AND WIN!</p>
      </header>
      <div className="raffle-gallery" data-testid="raffle-gallery">
        {sorteos.map(lottery => (
          <TarjetaSorteo key={lottery.id} sorteo={lottery} />
        ))}
      </div>
    </>
  );
}