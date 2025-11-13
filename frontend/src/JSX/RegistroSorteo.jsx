import React, { useState } from "react";
import "../CSS/RegistroSorteo.css";

export default function RegistroSorteo() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image_url: "",
    number_start: 1,
    number_end: 100,
    price_per_number: "",
    sale_start_at: "",
    sale_end_at: "",
    draw_scheduled_at: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("authToken");

      const response = await fetch("http://localhost:8000/api/v1/raffles/organizer/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          image_url: formData.image_url,
          number_start: parseInt(formData.number_start, 10),
          number_end: parseInt(formData.number_end, 10),
          price_per_number: parseFloat(formData.price_per_number),
          sale_start_at: new Date(formData.sale_start_at).toISOString(),
          sale_end_at: new Date(formData.sale_end_at).toISOString(),
          draw_scheduled_at: new Date(formData.draw_scheduled_at).toISOString(),
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Error al crear sorteo:", response.status, text);
        alert(`Error al crear sorteo (${response.status})`);
        return;
      }

      const data = await response.json();
      console.log("Sorteo creado:", data);
      alert("Sorteo creado exitosamente");

      setFormData({
        name: "",
        description: "",
        image_url: "",
        number_start: 1,
        number_end: 100,
        price_per_number: "",
        sale_start_at: "",
        sale_end_at: "",
        draw_scheduled_at: "",
      });
    } catch (error) {
      console.error("Error de red o de servidor:", error);
      alert("Ocurrió un error al intentar registrar el sorteo");
    }
  };

  return (
    <div className="registro-sorteo-container">
      <h2>Registrar Nuevo Sorteo</h2>
      <form onSubmit={handleSubmit} className="registro-sorteo-form">
        <label>Nombre del sorteo</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ej. Rifa de una bicicleta"
          required
        />

        <label>Descripción</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe tu sorteo"
          required
        ></textarea>

        <label>URL de la imagen</label>
        <input
          type="text"
          name="image_url"
          value={formData.image_url}
          onChange={handleChange}
          placeholder="Ej. https://..."
          required
        />

        <label>Número inicial</label>
        <input
          type="number"
          name="number_start"
          min="1"
          value={formData.number_start}
          onChange={handleChange}
          required
        />

        <label>Número final</label>
        <input
          type="number"
          name="number_end"
          min="1"
          value={formData.number_end}
          onChange={handleChange}
          required
        />

        <label>Precio por número</label>
        <input
          type="number"
          name="price_per_number"
          step="0.01"
          value={formData.price_per_number}
          onChange={handleChange}
          placeholder="Ej. 50.00"
          required
        />

        <label>Inicio de venta</label>
        <input
          type="datetime-local"
          name="sale_start_at"
          value={formData.sale_start_at}
          onChange={handleChange}
          required
        />

        <label>Fin de venta</label>
        <input
          type="datetime-local"
          name="sale_end_at"
          value={formData.sale_end_at}
          onChange={handleChange}
          required
        />

        <label>Fecha del sorteo</label>
        <input
          type="datetime-local"
          name="draw_scheduled_at"
          value={formData.draw_scheduled_at}
          onChange={handleChange}
          required
        />

        <button type="submit" className="registro-btn">Registrar Sorteo</button>
      </form>
    </div>
  );
}
