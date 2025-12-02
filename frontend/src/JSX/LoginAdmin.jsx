import React, { useState } from 'react';
import styles from '../CSS/LoginAdmin.module.css';
import { useNavigate } from 'react-router-dom';

// Token endpoint URL (Corrected to match Django project's path)
const TOKEN_API_URL = 'http://localhost:8000/api/v1/auth/token/';


export default function Login() {

  // Estado para el correo y la contraseña
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // State for loading status

  const navigate = useNavigate();

  // Manejador para el envío del formulario
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(''); // Limpia errores previos
    setIsLoading(true); // Activa el estado de carga

    try {
      // 1. Send 'email' and 'password' to the Django API to get the token
      const response = await fetch(TOKEN_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Line sends the 'email' and 'password' fields
        body: JSON.stringify({ email: email, password: password })
      });

      if (!response.ok) {
        // --- ROBUST ERROR HANDLING ---

        let errorMessage = 'Unknown authentication error.';

        // 1. READ BODY ONCE as text (to prevent stream read error)
        const rawResponseText = await response.text();

        try {
          // 2. Try to parse the text to JSON
          const errorData = JSON.parse(rawResponseText);

          // Try to extract a useful error message from the JSON structure
          const detailError = errorData.detail || errorData.non_field_errors?.[0];
          errorMessage = detailError || 'Invalid credentials.';
        } catch {
          // 3. If parsing fails, it means we received HTML (<!DOCTYPE) or plain text.
          console.error('Non-JSON error response received (raw text):', rawResponseText.substring(0, 100) + '...');

          if (response.status === 404) {
            errorMessage = 'Login endpoint not found (Check URL: /api/v1/auth/token/).';
          } else if (response.status >= 500) {
            errorMessage = 'Internal server error (Check your Django backend).';
          } else {
            // 400, 401, 403, etc.
            errorMessage = `Error ${response.status}: Invalid credentials or unexpected response.`;
          }
        }

        throw new Error(errorMessage);
      }
      // --- END ERROR HANDLING ---


      // 2. If login is successful, parse the JSON
      const data = await response.json();
      console.log('Token received (Access):', data.access);

      // 3. Save the access token
      localStorage.setItem('authToken', data.access);

      // 4. Redirect the administrator to the raffle registration page
      alert('¡Inicio de sesión exitoso!');
      // *** ELIMINADA: localStorage.setItem('raffleView', 'organizador'); ***
      navigate('/rifas');

    } catch (err) {
      console.error('Final authentication error:', err.message);
      setError(err.message || 'Error desconocido al intentar iniciar sesión.');
    } finally {
      setIsLoading(false); // Deactivates loading status
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
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="admin@iglesia.com"
              required
              disabled={isLoading}
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
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="••••••••"
              required
              disabled={isLoading}
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
            <button
              type="submit"
              className={styles['login-submit-button']}
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}