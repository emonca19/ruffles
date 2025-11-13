import React, { useState } from 'react';
import styles from '../CSS/RegistroAdmin.module.css';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config/apiRegistroAdmin.js';

export default function RegistroUsuario() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    email: '',
    phone: '',
    user_type: 'organizador',
    password1: '',
    password2: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

    try {
      const response = await fetch(`${API_URL}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error(data);
        throw new Error(
          data.detail || 'Error al registrar el usuario. Revisa los datos.'
        );
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
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Apellido paterno</label>
            <input
              type="text"
              name="apellido_paterno"
              value={formData.apellido_paterno}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Apellido materno (opcional)</label>
            <input
              type="text"
              name="apellido_materno"
              value={formData.apellido_materno}
              onChange={handleChange}
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
              <option value="administrador">Administrador</option>
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

