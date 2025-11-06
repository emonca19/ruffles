import React from 'react';
import './Navbar.css';

export default function Navbar() {
  return (
    <nav className="navbar-flotante">
      
      {/* Logo o Título Principal de la Iglesia */}
      <div className="navbar-logo">
        <a href="#">Iglesia Local</a>
      </div>

      {/* Links de Navegación */}
      <ul className="navbar-links">
        <li><a href="#inicio">Inicio</a></li>
        <li><a href="#rifas">Rifas</a></li>
        <li><a href="#contacto">Contacto</a></li>
      </ul>
    </nav>
  );
}