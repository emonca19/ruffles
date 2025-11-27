import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../CSS/ParticipacionSorteos.css';

const API_BASE_URL = 'http://localhost:8000';

// Componente Tarjeta de Participación simple para mostrar los resultados
const TarjetaParticipacion = ({ sorteo }) => {
    const navigate = useNavigate();

    const formatoPrecio = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
    });

    return (
        <div className="raffle-card participation-card" onClick={() => navigate(`/detalle/${sorteo.id}`)}>
            <img 
                src={sorteo.image_url} 
                alt={sorteo.name} 
                className="raffle-image" 
                // Fallback en caso de error de imagen
                onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/300x200?text=Sin+Imagen" }}
            />
            <div className="raffle-info">
                <h3 className="raffle-name">{sorteo.name}</h3>
                <p><strong>Número(s) comprado(s):</strong> {sorteo.numbers.join(', ')}</p>
                <p className="raffle-price">Precio por boleto: {formatoPrecio.format(sorteo.price_per_number)}</p>
            </div>
        </div>
    );
};


export default function ParticipacionSorteos() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [participaciones, setParticipaciones] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasSearched, setHasSearched] = useState(false); // Para mostrar el estado inicial antes de la búsqueda

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setParticipaciones([]);
        setHasSearched(true);

        if (!phoneNumber) {
            setError("Por favor, introduce un número de teléfono.");
            return;
        }

        setIsLoading(true);

        try {
            // URL de ejemplo para la API: asume que Django puede filtrar por número de teléfono en una query param
            const url = `${API_BASE_URL}/api/v1/raffles/participations/?phone_number=${phoneNumber}`;
            
            console.log(`Buscando participaciones con URL: ${url}`);

            const response = await fetch(url);
            
            if (!response.ok) {
                // Manejar errores como 404 si el endpoint no existe o el servidor falla
                throw new Error(`Error al buscar participaciones: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            // Adaptar los datos del backend a la estructura del frontend
            // Asumimos que el backend devuelve una lista de sorteos con un campo 'numbers' que indica qué números compró el usuario.
            const participacionesAdaptadas = (Array.isArray(data) ? data : data.results || []).map(item => ({
                id: item.id,
                name: item.name,
                image_url: item.image ? (item.image.startsWith('http') ? item.image : `${API_BASE_URL}${item.image}`) : 'https://via.placeholder.com/300x200?text=Sin+Imagen',
                price_per_number: item.price_per_number || 0,
                // **IMPORTANTE:** Necesitas que el backend te devuelva los números comprados, 
                // aquí se simula un campo `user_numbers` o similar
                numbers: item.user_numbers || [ 'N/A' ]
            }));

            setParticipaciones(participacionesAdaptadas);

        } catch (err) {
            console.error("Error al buscar:", err);
            setError(`Ocurrió un error al conectar con el servicio: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="participation-page-container">
            <header className="galeria-header">
                <h1>Consulta tus Participaciones</h1>
                <p>Ingresa tu número de teléfono para ver los sorteos en los que has comprado boletos.</p>
            </header>

            <form onSubmit={handleSubmit} className="phone-search-form">
                <label htmlFor="phoneNumberInput">Número de Teléfono:</label>
                <input
                    id="phoneNumberInput"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))} // Permite solo números
                    placeholder="Ej. 6621234567"
                    className="phone-input"
                    maxLength="10"
                    required
                />
                <button 
                    type="submit" 
                    className="raffle-participar-btn"
                    disabled={isLoading}
                >
                    {isLoading ? 'Buscando...' : 'Buscar Sorteos'}
                </button>
            </form>

            {error && <div className="error-message-box">{error}</div>}

            <div className="participation-results">
                {isLoading && (
                    <div className="raffle-loading">
                        <div className="spinner"></div>
                        <p>Realizando búsqueda...</p>
                    </div>
                )}

                {!isLoading && hasSearched && participaciones.length > 0 && (
                    <>
                        <h2>Resultados para {phoneNumber}</h2>
                        <div className="raffle-gallery participation-grid">
                            {participaciones.map(sorteo => (
                                <TarjetaParticipacion key={sorteo.id} sorteo={sorteo} />
                            ))}
                        </div>
                    </>
                )}

                {!isLoading && hasSearched && participaciones.length === 0 && !error && (
                    <div className="empty-state-message">
                        <h2>¡Vaya!</h2>
                        <p>No se encontraron participaciones asociadas al número {phoneNumber}.</p>
                        <button 
                            className="raffle-participar-btn"
                            style={{ marginTop: '15px' }}
                            onClick={() => navigate('/rifas')}
                        >
                            Ver Sorteos Activos
                        </button>
                    </div>
                )}
                
                {!hasSearched && !isLoading && (
                    <div className="initial-message">
                        <p>Ingresa tu teléfono y presiona "Buscar" para consultar tu estado.</p>
                    </div>
                )}
            </div>
        </div>
    );
}