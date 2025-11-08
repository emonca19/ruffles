import React from 'react';
import { Link } from 'react-router-dom';
import './Inicio.css';

export default function Inicio() {
  return (
    <div className="inicio-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Apoya a Nuestra Comunidad</h1>
          <p>
            Somos una asociación civil dedicada a realizar actividades mensuales
            para financiar proyectos comunitarios. Una de nuestras principales
            iniciativas es la organización de sorteos de artículos y servicios,
            donde tú puedes participar y ayudarnos a seguir creciendo.
          </p>
          <Link to="/rifas" className="hero-button">
            Ver Sorteos Activos
          </Link>
        </div>
      </section>
    </div>
  );
}
