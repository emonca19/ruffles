import React, { useState, useRef } from "react";
import "../CSS/RegistroSorteo.css";

export default function RegistroSorteo() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    number_end: 0,
    price_per_number: "",
    sale_start_at: "",
    sale_end_at: "",
    draw_scheduled_at: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  const token = localStorage.getItem("authToken");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dataToSend = new FormData();

    dataToSend.append("name", formData.name);
    dataToSend.append("description", formData.description);
    dataToSend.append("number_start", 0);
    dataToSend.append("number_end", formData.number_end);
    dataToSend.append("price_per_number", formData.price_per_number);

    if (formData.sale_start_at)
      dataToSend.append("sale_start_at", `${formData.sale_start_at}T00:00:00`);
    if (formData.sale_end_at)
      dataToSend.append("sale_end_at", `${formData.sale_end_at}T00:00:00`);
    if (formData.draw_scheduled_at)
      dataToSend.append("draw_scheduled_at", `${formData.draw_scheduled_at}T00:00:00`);

    if (imageFile) {
      dataToSend.append("image", imageFile);
    }

    try {
      const response = await fetch("http://localhost:8000/api/v1/raffles/organizer/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: dataToSend,
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Error:", text);
        alert("Error al registrar el sorteo");
        return;
      }

      alert("Sorteo registrado exitosamente");

      setFormData({
        name: "",
        description: "",
        number_end: 0,
        price_per_number: "",
        sale_start_at: "",
        sale_end_at: "",
        draw_scheduled_at: "",
      });
      setImageFile(null);
      setPreview(null);

    } catch (error) {
      console.error("Error:", error);
      alert("No se pudo registrar el sorteo");
    }
  };

  return (
    <div className="registro-sorteo-container">
      <h2>Registrar Nuevo Sorteo</h2>

      <form onSubmit={handleSubmit} className="registro-sorteo-form">
        
        <label>Nombre del sorteo</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} required />

        <label>Descripción</label>
        <textarea name="description" value={formData.description} onChange={handleChange} required />

        {/* DRAG AND DROP + INPUT */}
        <label>Imagen del sorteo</label>
        <div
          className={`dropzone ${isDragging ? "dragging" : ""}`}
          onClick={() => fileInputRef.current.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {preview ? (
            <img src={preview} alt="preview" className="preview-img" />
          ) : (
            <p>Arrastra una imagen aquí o haz clic para seleccionarla</p>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: "none" }}
          />
        </div>

        <label>Total de números</label>
        <input type="number" name="number_end" value={formData.number_end} onChange={handleChange} min="1" required />

        <label>Precio por número</label>
        <input type="number" name="price_per_number" value={formData.price_per_number} onChange={handleChange} step="0.01" min="1" required />

        <label>Inicio de venta</label>
        <input type="date" name="sale_start_at" value={formData.sale_start_at} onChange={handleChange} required />

        <label>Fin de venta</label>
        <input type="date" name="sale_end_at" value={formData.sale_end_at} onChange={handleChange} required />

        <label>Fecha del sorteo</label>
        <input type="date" name="draw_scheduled_at" value={formData.draw_scheduled_at} onChange={handleChange} required />

        <button type="submit" className="registro-btn">Registrar Sorteo</button>
      </form>
    </div>
  );
}
