import React from 'react';
import './Navbar.css';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar-flotante">
      
      {/* Logo o Título Principal de la Iglesia */}
      <div className="navbar-logo">
        <a href="#">Iglesia Local</a>
      </div>

      {/* Links de Navegación */}
      <ul className="navbar-links">
        <li><Link to="/inicio">Inicio</Link></li> 
        <li><Link to="/rifas">Rifas</Link></li>
        <li><Link to="/contacto">Contactos</Link></li>
      </ul>
    </nav>
  );
}