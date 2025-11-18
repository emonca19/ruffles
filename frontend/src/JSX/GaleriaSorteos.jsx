import React, { useState, useEffect } from 'react';
import TarjetaSorteo from './TarjetaSorteo.jsx';
import '../CSS/GaleriaSorteos.css';

export default function GaleriaSorteos() {
  const [sorteos, setSorteos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // *** DETERMINACIÓN DE VISTA AUTOMÁTICA ***
  const esOrganizador = !!localStorage.getItem('authToken');
  const vista = esOrganizador ? 'organizador' : 'visitante';
  
  // *** FUNCIÓN DE CERRAR SESIÓN ***
  const handleLogout = () => {
    localStorage.removeItem('authToken'); // 1. Elimina el token
    // 2. Recarga para aplicar la nueva vista (visitante)
    window.location.reload(); 
  };


  useEffect(() => {
    setIsLoading(true);

    // Simula una carga (aquí iría tu fetch real)
    setTimeout(() => {
      if (vista === 'visitante') {
        // Datos para Visitante
        const datosSimulados = [
          { id: 1, name: "iPhone 15 Pro", image_url: "https://m.media-amazon.com/images/I/81fO2C9cYjL._AC_SY300_SX300_QL70_ML2_.jpg", price_per_number: 100 },
          { id: 2, name: "Canasta de Regalo", image_url: "https://mantelyservilleta.com/cdn/shop/files/RegaloCajaGourmetULTRAPremium-mantelyservilleta_1_1024x1024@2x.jpg?v=1699581917", price_per_number: 50 },
          { id: 3, name: "Viaje a la Playa", image_url: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?ixlib=rb-4.1.0&auto=format&fit=crop&w=1074&q=80", price_per_number: 250 },
          { id: 4, name: "Audífonos Pro", image_url: "https://via.placeholder.com/300x200?text=Audio", price_per_number: 75 },
          { id: 5, name: "Cena para Dos", image_url: "https://via.placeholder.com/300x200?text=Cena", price_per_number: 40 },
        ];
        setSorteos(datosSimulados);
      } else {
        // *** DATOS MODIFICADOS PARA ORGANIZADOR (1 SORTEO DE PRUEBA) ***
        const datosOrganizador = [
            { 
            id: 101, 
            name: "Sorteo de Laptop Gaming", 
            image_url: "https://via.placeholder.com/300x200?text=Laptop+Gaming", 
            price_per_number: 80,
            status: "Activo", // Información adicional que un organizador podría ver
            tickets_sold: 150,
            total_tickets: 500,
            ganancia_estimada: 12000 // Ejemplo de datos solo para organizador
          } 
        ]; 
        setSorteos(datosOrganizador);
      }

      setIsLoading(false);
    }, 1500);
  }, [vista]); 
  
  // No se necesita limpiar 'raffleView' porque la vista ahora se basa en 'authToken'


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
      <div className="raffle-empty-state">
        {vista === 'visitante' ? (
            <>
              <p>No hay sorteos disponibles en este momento. Vuelve pronto para participar.</p>
              {/* Botón/Enlace para ir al Login */}
              <p>¿Eres organizador? <a href="/login">Inicia Sesión aquí.</a></p> 
            </>
        ) : (
            <>
              <h2>No hay sorteos creados</h2>
              <button
                className="raffle-participar-btn"
                onClick={() => (window.location.href = "/registro")}
              >
                Registrar Nuevo Sorteo
              </button>
              {/* Botón de Cerrar Sesión */}
              <button
                className="raffle-logout-btn"
                onClick={handleLogout}
              >
                Cerrar Sesión
              </button>
            </>
        )}
      </div>
    );
  }

  return (
    <>
      <header className="galeria-header" id="rifas">
        <h1>
          {vista === 'visitante'
            ? 'Nuestros Sorteos Activos'
            : 'Tus Sorteos Registrados'}
        </h1>
        <p>
          {vista === 'visitante'
            ? '¡Elige tu favorito, apoya a la comunidad y gana!'
            : 'Visualiza y administra tus sorteos.'}
        </p>
        {/* Botón de Cerrar Sesión visible solo para organizadores */}
        {esOrganizador && (
          <button
            className="raffle-logout-btn"
            onClick={handleLogout}
          >
            Cerrar Sesión
          </button>
        )}
      </header>

      <div className="raffle-gallery">
        {sorteos.map((sorteo) => (
          <TarjetaSorteo
            key={sorteo.id}
            sorteo={sorteo}
            esOrganizador={esOrganizador}
          />
        ))}
      </div>
    </>
  );
}