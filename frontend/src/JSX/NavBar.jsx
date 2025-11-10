import React from 'react';
import { Link } from 'react-router-dom';
import '../CSS/Navbar.css';

export default function Navbar() {
  return (
    <nav className="navbar-flotante">
      <div className="navbar-logo">
        <Link to="/">Rifas Iglesia</Link>
      </div>
      <ul className="navbar-links">
        <li><Link to="/Inicio">Inicio</Link></li>
        <li><Link to="/rifas">Rifas</Link></li>
        <li><Link to="/registro">Registrar</Link></li>
        <li><Link to="/contacto">Contacto</Link></li>
      </ul>
    </nav>
  );
}