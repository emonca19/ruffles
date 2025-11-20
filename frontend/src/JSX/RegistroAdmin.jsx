import React, { useState, useEffect } from 'react';
import styles from '../CSS/RegistroAdmin.module.css';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config/apiRegistroAdmin.js';

export default function RegistroUsuario() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    user_type: 'organizer',
    password1: '',
    password2: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isFormDirty =
    formData.name ||
    formData.email ||
    formData.phone ||
    formData.user_type !== 'organizer' ||
    formData.password1 ||
    formData.password2;

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!isFormDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isFormDirty]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password1 !== formData.password2) {
      setError('Las contraseñas no coinciden');
      return;
    }

    const token = localStorage.getItem('authToken');

    if (!token) {
      setError('No estás autenticado. Inicia sesión primero.');
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          user_type: formData.user_type,
          password: formData.password1
        }),
      });

      if (!response.ok) {
        const rawError = await response.text();
        let errorMessage = 'Error al registrar el usuario. Revisa los datos.';

        try {
          const parsedError = JSON.parse(rawError);

          if (parsedError.detail && typeof parsedError.detail === 'string') {
            errorMessage = parsedError.detail;
          } else {
            const firstKey = Object.keys(parsedError)[0];
            if (firstKey) {
              const firstValue = parsedError[firstKey];
              if (Array.isArray(firstValue) && firstValue.length > 0) {
                errorMessage = firstValue[0];
              } else if (typeof firstValue === 'string') {
                errorMessage = firstValue;
              }
            }
          }
        } catch (parseError) {
          console.error('No se pudo analizar la respuesta de error como JSON:', parseError);
        }

        console.error('Error:', rawError);
        setError(errorMessage);
        return;
      }

      setSuccess('¡Registro exitoso! Redirigiendo al inicio de sesión...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.registroContainer}>
      <div className={styles.registroCard}>
        <h1>Registro de Usuario</h1>
        <p>Completa el formulario para crear una cuenta.</p>

        <form onSubmit={handleSubmit} className={styles.registroForm}>
          <div className={styles.formGroup}>
            <label>Nombre</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Correo electrónico</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Teléfono</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Tipo de usuario</label>
            <select
              name="user_type"
              value={formData.user_type}
              onChange={handleChange}
            >
              <option value="organizador">Organizador</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Contraseña</label>
            <input
              type="password"
              name="password1"
              value={formData.password1}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Confirmar contraseña</label>
            <input
              type="password"
              name="password2"
              value={formData.password2}
              onChange={handleChange}
              required
            />
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}
          {success && <div className={styles.successMessage}>{success}</div>}

          <button type="submit" className={styles.registroButton}>
            Crear cuenta
          </button>
        </form>
      </div>
    </div>
  );
}
