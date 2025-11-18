import React, { useState, useEffect } from 'react';
import TarjetaSorteo from './TarjetaSorteo.jsx';
import '../CSS/GaleriaSorteos.css';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:8000';

export default function GaleriaSorteos() {
        const [sorteos, setSorteos] = useState([]);
        const [isLoading, setIsLoading] = useState(true);
        const [error, setError] = useState(null);
        const navigate = useNavigate();

        // *** DETERMINACIÓN DE VISTA AUTOMÁTICA ***
        const token = localStorage.getItem('authToken');
        const esOrganizador = !!token;
        const vista = esOrganizador ? 'organizador' : 'visitante';

        // *** FUNCIÓN DE CERRAR SESIÓN ***
        const handleLogout = () => {
                localStorage.removeItem('authToken');
                window.location.reload();
        };

        useEffect(() => {
                const fetchSorteos = async () => {
                        setIsLoading(true);
                        setError(null);

                        try {
                                let url = `${API_BASE_URL}/api/v1/raffles/`; // URL Pública
                                const headers = {
                                        'Content-Type': 'application/json',
                                };

                                if (vista === 'organizador') {
                                        url = `${API_BASE_URL}/api/v1/raffles/organizer/`; // URL Organizador
                                        headers['Authorization'] = `Bearer ${token}`;
                                }

                                console.log(`Cargando datos desde: ${url}`);

                                const response = await fetch(url, {
                                        method: 'GET',
                                        headers: headers,
                                });

                                if (!response.ok) {
                                        if (response.status === 401 && vista === 'organizador') {
                                                handleLogout();
                                                return;
                                        }
                                        throw new Error('Error al obtener los sorteos');
                                }

                                const data = await response.json();
                                console.log("Datos recibidos:", data);

                                const listaRifas = Array.isArray(data) ? data : (data.results || []);

                                if (!Array.isArray(listaRifas)) {
                                        throw new Error("El servidor no devolvió una lista válida.");
                                }

                                const sorteosAdaptados = listaRifas.map(item => ({
                                        id: item.id,
                                        name: item.name,
                                        image_url: item.image ? (item.image.startsWith('http') ? item.image : `${API_BASE_URL}${item.image}`) : 'https://via.placeholder.com/300x200?text=Sin+Imagen',
                                        price_per_number: item.price_per_number || 0
                                }));

                                setSorteos(sorteosAdaptados);

                        } catch (err) {
                                console.error("Error:", err);
                                setError(err.message);
                        } finally {
                                setIsLoading(false);
                        }
                };

                fetchSorteos();
        }, [vista, token]);

        if (isLoading) {
                return (
                        <div className="raffle-loading">
                                <div className="spinner"></div>
                                <p>Cargando sorteos de la base de datos...</p>
                        </div>
                );
        }

        if (error) {
                return (
                        <div className="raffle-empty-state">
                                <p style={{ color: 'red' }}>Hubo un problema cargando los sorteos.</p>
                                <small>{error}</small>
                        </div>
                );
        }

        if (sorteos.length === 0) {
                return (
                        <>
                                <header className="galeria-header">
                                        {vista === 'organizador' ? (
                                                <>
                                                        <h1>Mis Sorteos</h1>
                                                        <p>Bienvenido, Organizador. Aquí están tus rifas creadas.</p>
                                                </>
                                        ) : (
                                                <>
                                                        <h1>Sorteos Activos</h1>
                                                        <p>¡Participa y gana grandes premios!</p>
                                                </>
                                        )}
                                </header>

                                <div className="raffle-empty-state">
                                        {vista === 'organizador' ? (
                                                <>
                                                        <h2>No has creado ningún sorteo aún</h2>
                                                        <button
                                                                className="raffle-participar-btn"
                                                                onClick={() => navigate('/RegistroSorteo')}
                                                                style={{ marginTop: '20px' }}
                                                        >
                                                                Crear mi primera Rifa
                                                        </button>
                                                </>
                                        ) : (
                                                <p>No hay sorteos disponibles en este momento. Vuelve pronto.</p>
                                        )}
                                        {vista === 'organizador' && (
                                                <button className="raffle-logout-btn" onClick={handleLogout} style={{ marginTop: '20px', marginLeft: '10px' }}>
                                                        Cerrar Sesión
                                                </button>
                                        )}
                                </div>
                        </>
                );
        }

        return (
                <>
                        <header className="galeria-header">
                                {vista === 'organizador' ? (
                                        <>
                                                <h1>Panel de Organizador</h1>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '15px' }}>
                                                        {/* Botón Crear (Solo visual por ahora) */}
                                                        <button
                                                                className="raffle-participar-btn"
                                                                style={{ fontSize: '0.9rem', padding: '8px 16px' }}
                                                                onClick={() => navigate('/RegistroSorteo')}
                                                        >
                                                                + Nuevo Sorteo
                                                        </button>
                                                        <button
                                                                className="raffle-logout-btn"
                                                                style={{ fontSize: '0.9rem', padding: '8px 16px' }}
                                                                onClick={handleLogout}
                                                        >
                                                                Cerrar Sesión
                                                        </button>
                                                </div>
                                        </>
                                ) : (
                                        <>
                                                <h1>Nuestros Sorteos Activos</h1>
                                                <p>¡Elige tu favorito, apoya a la comunidad y gana!</p>
                                        </>
                                )}
                        </header>

                        <div className="raffle-gallery">
                                {sorteos.map(sorteo => (
                                        <TarjetaSorteo key={sorteo.id} sorteo={sorteo} />
                                ))}
                        </div>
                </>
        );
}
