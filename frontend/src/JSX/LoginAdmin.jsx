import React, { useState } from 'react';
import styles from '../CSS/LoginAdmin.module.css';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  
  // Estado para el correo y la contraseña
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); 

  const navigate = useNavigate();

  // Manejador para el envío del formulario
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(''); // Limpia errores previos

    // --- AQUÍ VA TU LÓGICA DE BACKEND ---
    // 1. Envía 'email' y 'password' a tu API de Django (ej: /api/token/ o /api/login/)
    // 2. Si el login es exitoso, el backend te devolverá un token JWT.
    // 3. Debes guardar ese token (ej. en localStorage) y redirigir al admin
    //    a la página de "Registrar Sorteo" (usando useNavigate de react-router-dom).

    try {
      // --- Simulación de llamada a API ---
      console.log('Intentando iniciar sesión con:', { email, password });
      // const response = await fetch('http://localhost:8000/api/token/', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password })
      // });
      
      // if (!response.ok) {
      //   throw new Error('Correo o contraseña incorrectos');
      // }

      // const data = await response.json();
      // console.log('Token recibido:', data.access);
      // localStorage.setItem('authToken', data.access);
      
      // --- Fin de simulación ---
      alert('¡Inicio de sesión exitoso! (Revisa la consola)');
      // Aquí iría la redirección: navigate('/inicio');

      navigate('/inicio');

    } catch (err) {
      console.error(err);
      setError('Correo o contraseña incorrectos. Intenta de nuevo.');
    }
  };

  return (
    <div className={styles['login-page-container']}>
      <div className={styles['login-form-card']}>
        <h2>Acceso de Administrador</h2>
        <p>Inicia sesión para gestionar los sorteos.</p>
        
        <form onSubmit={handleSubmit} className={styles['login-form']}>
          
          {/* Campo: Correo Electrónico */}
          <div className={styles['form-group']}>
            <label htmlFor="email">Correo Electrónico:</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@iglesia.com"
              required 
            />
          </div>

          {/* Campo: Contraseña */}
          <div className={styles['form-group']}>
            <label htmlFor="password">Contraseña:</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required 
            />
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className={styles['login-error-message']}>
              {error}
            </div>
          )}

          {/* Botón de Envío */}
          <div className={styles['form-group']}>
            <button type="submit" className={styles['login-submit-button']}>
              Iniciar Sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}