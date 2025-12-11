import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../CSS/GaleriaParticipacion.css';
import '../CSS/ParticipacionSorteos.css';

const API_BASE_URL = 'http://localhost:8000';

const Spinner = () => (
    <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
    );

const TarjetaParticipacion = ({ sorteo, phoneNumber }) => {
    const navigate = useNavigate();

    const formatoPrecio = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
    });

    return (
        <div
            className="participation-card"
            onClick={() => navigate(`/participacion/detalle/${sorteo.id}`, {
                state: { phone: phoneNumber }
            })}


        >
            <img
                src={sorteo.image_url}
                alt={sorteo.name}
                className="card-image"
                onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://placehold.co/300x200/a5b4fc/ffffff?text=Sin+Imagen";
                }}
            />
            <div className="card-content">
                <h3 className="text-xl font-bold text-gray-900">{sorteo.name}</h3>

                <p className="text-sm text-gray-700 font-semibold">
                    Boletos:
                    <span className="text-indigo-600 ml-2 font-normal">
                        {sorteo.numbers.length > 5
                            ? `${sorteo.numbers.slice(0, 5).join(', ')}, y ${sorteo.numbers.length - 5} más...`
                            : sorteo.numbers.join(', ')
                        }
                    </span>
                </p>

                <p className="text-sm text-gray-500">
                    Precio por boleto:
                    <span className="text-indigo-700 font-semibold ml-1">
                        {formatoPrecio.format(sorteo.price_per_number)}
                    </span>
                </p>
                <div className="participation-details">
                    <div className="detail-row reserved-tickets-row">
                        <span>Cantidad de Boletos</span>
                        <span>{sorteo.numbers.length}</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default function ParticipacionSorteos() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [participaciones, setParticipaciones] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setParticipaciones([]);
        setHasSearched(true);
    
        if (!phoneNumber || phoneNumber.length !== 10) {
            setError("Por favor, introduce un número de teléfono de 10 dígitos válido.");
            return;
        }

        setIsLoading(true);

        try {
            const url = `${API_BASE_URL}/api/v1/purchases/?phone=${phoneNumber}`;

            let response;
            let maxRetries = 3;
            let delay = 1000;

            for (let i = 0; i < maxRetries; i++) {
                response = await fetch(url);
                if (response.ok || response.status === 404) {
                    break;
                }
                if (i < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2;
                }
            }

            if (!response.ok && response.status !== 404) {
                let errorDetails = await response.text();
                try { errorDetails = JSON.parse(errorDetails); } catch (e) { /* ignore */ }

                throw new Error(`Error ${response.status}: ${typeof errorDetails === 'object' ? JSON.stringify(errorDetails, null, 2) : errorDetails}`);
            }

            const responseText = await response.text();
            let data = [];

            try {
                data = JSON.parse(responseText);
            } catch (jsonError) {
                if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
                    throw new Error("El servidor devolvió una página HTML (probablemente error 500). Verifica los logs de Django.");
                }
                throw jsonError;
            }

            const participacionesAdaptadas = (Array.isArray(data) ? data : data.results || []).map(item => {

                const purchasedDetails = item.details || [];
                const purchasedNumbers = purchasedDetails
                    .map(detail => detail.number)
                    .filter(n => n !== undefined && n !== null);

                const unitPrice = purchasedDetails.length > 0
                    ? parseFloat(purchasedDetails[0].unit_price)
                    : item.total_amount / purchasedNumbers.length || 0;

                if (purchasedNumbers.length === 0 || !item.raffle_id) {
                    return null;
                }

                return {
                    id: item.raffle_id,
                    name: item.raffle_name || 'Sorteo Desconocido',
                    image_url: item.raffle_image || 'https://placehold.co/300x200/a5b4fc/ffffff?text=Sin+Imagen',
                    price_per_number: unitPrice,
                    numbers: purchasedNumbers
                };
            }).filter(item => item !== null);

            setParticipaciones(participacionesAdaptadas);

        } catch (err) {
            console.error("Error al buscar:", err);
            setError(`Ocurrió un error al conectar con el servicio: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="main-container">
            {/* Uso de la clase del header */}
            <header className="galeria-header">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-indigo-800 mb-2">
                    Consulta tus Boletos
                </h1>
                <p className="text-lg text-gray-600">
                    Ingresa tu número de teléfono de 10 dígitos para ver los sorteos en los que has participado.
                </p>
            </header>

            {/* Uso de la clase del formulario */}
            <form onSubmit={handleSubmit} className="phone-search-form">
                <div className="phone-search-container">
                    {/* Se añade el label que el CSS espera */}
                    <label htmlFor="phoneNumberInput">Número de Teléfono (10 dígitos)</label>
                    <input
                        id="phoneNumberInput"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => {
                            const numericValue = e.target.value.replace(/[^0-9]/g, '');
                            setPhoneNumber(numericValue.slice(0, 10));
                        }}
                        placeholder="Ej. 6621234567"
                        className="phone-input"
                        maxLength="10"
                        required
                    />
                </div>
                {/* Uso de la clase del botón */}
                <button
                    type="submit"
                    className="search-button"
                    disabled={isLoading || phoneNumber.length !== 10}
                >
                    {isLoading ? 'Buscando...' : 'Buscar Boletos'}
                </button>
            </form>

            {/* Mensaje de Error (se mantiene Tailwind para el error específico) */}
            {error && (
                <div className="max-w-xl mx-auto mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center font-medium shadow-md">
                    <p>{error}</p>
                </div>
            )}

            {/* Resultados */}
            <div className="participation-results">

                {/* Estado de Carga (se mantiene Tailwind para el spinner) */}
                {isLoading && (
                    <div className="text-center mt-10 text-gray-600 space-y-3">
                        <Spinner />
                        <p className="text-lg">Realizando búsqueda de participaciones...</p>
                    </div>
                )}

                {/* Resultados Encontrados */}
                {!isLoading && hasSearched && participaciones.length > 0 && (
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                            Sorteos con tu participación ({participaciones.length})
                        </h2>
                        {/* Uso de la clase de la cuadrícula */}
                        <div className="participation-grid">
                            {participaciones.map(sorteo => (
                                <TarjetaParticipacion
                                    key={sorteo.id}
                                    sorteo={sorteo}
                                    phoneNumber={phoneNumber}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Sin Resultados */}
                {!isLoading && hasSearched && participaciones.length === 0 && !error && (
                    <div className="raffle-empty-state">
                        <h2 className="text-3xl font-extrabold text-gray-900">¡Vaya!</h2>
                        <p className="text-gray-600 text-lg">
                            No se encontraron boletos asociados al número
                            <span className="font-semibold text-indigo-600 ml-1">{phoneNumber}</span>.
                        </p>
                        <button
                            className="w-full sm:w-auto px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition duration-150 shadow-md mt-4"
                            onClick={() => navigate('/rifas')}
                        >
                            Ver Sorteos Activos y Participar
                        </button>
                    </div>
                )}

                {/* Estado Inicial (Antes de la búsqueda) */}
                {!hasSearched && !isLoading && (
                    <div className="raffle-empty-state">
                        <p className="text-lg font-medium">
                            Ingresa tu teléfono y presiona "Buscar Boletos" para consultar tu estado.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}