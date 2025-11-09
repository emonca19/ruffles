import React, { useState } from 'react';
import './RegistroSorteo.css';
import './GaleriaSorteos.css';

export default function RegistroSorteo() {

  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    ticketCount: '',
    endDate: ''
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // Aquí es donde se enviarian los datos a la API
    console.log('Datos del formulario para enviar:', formData);

    setFormData({
      title: '',
      imageUrl: '',
      ticketCount: '',
      endDate: ''
    });

    alert('¡Sorteo registrado exitosamente! (Revisa la consola)');
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="registro-container">
      <header className="galeria-header">
        <h1>Registrar Nuevo Sorteo</h1>
        <p>Completa los campos para crear una nueva rifa.</p>
      </header>
      <form className="registro-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Título del Premio:</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Ej: iPhone 15 Pro"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="imageUrl">URL de la Imagen del Premio:</label>
          <input
            type="url"
            id="imageUrl"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            placeholder="https://ejemplo.com/imagen.jpg"
            required
          />
          <small>Pega un enlace a una imagen que ya esté en internet.</small>
        </div>
        <div className="form-group">
          <label htmlFor="ticketCount">Cantidad de Números Disponibles:</label>
          <input
            type="number"
            id="ticketCount"
            name="ticketCount"
            value={formData.ticketCount}
            onChange={handleChange}
            placeholder="Ej: 100"
            min="1"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="endDate">Fecha de Terminación:</label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            min={today}
            required
          />
        </div>
        <div className="form-group">
          <button type="submit" className="submit-button">
            Crear Sorteo
          </button>
        </div>
      </form>
    </div>
  );
}
