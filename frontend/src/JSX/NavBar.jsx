import React from 'react';
import { Link } from 'react-router-dom';
import '../CSS/Navbar.css';

export default function Navbar() {
  
  const esOrganizador = !!localStorage.getItem('authToken');

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    window.location.href = '/';
  };

  return (
    <nav className="navbar-flotante">

      {/* IZQUIERDA: LOGO */}
      <div className="navbar-logo">
        <Link to="/">Rifas Iglesia</Link>
      </div>

      {/* CENTRO: ENLACES (NO SE MUEVEN) */}
      <ul className="navbar-links">
        <li><Link to="/inicio">Inicio</Link></li>
        <li><Link to="/rifas">Rifas</Link></li>
        {esOrganizador && (
          <li><Link to="/registro">Crear Sorteo</Link></li>
        )}
        {/*<li><Link to="/contacto">Contacto</Link></li> */}
      </ul>

      {/* DERECHA: BOTÓN */}
      <div className="navbar-auth-right">
        {esOrganizador && (
          <button 
            onClick={handleLogout} 
            className="navbar-logout-btn"
          >
            Cerrar Sesión
          </button>
        )}
      </div>

    </nav>
  );
}
