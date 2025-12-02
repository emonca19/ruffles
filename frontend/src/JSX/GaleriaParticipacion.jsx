import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../CSS/ParticipacionSorteos.css'; // Mantenemos la importación para estilos de página generales

const API_BASE_URL = 'http://localhost:8000';

// Componente de indicador de carga (Spinner)
const Spinner = () => (
    <div className="flex justify-center items-center">
        {/* Usamos color de acento para el spinner */}
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
);

// Componente Tarjeta de Participación
const TarjetaParticipacion = ({ sorteo }) => {
    const navigate = useNavigate();

    // Calculamos el total de boletos comprados
    const totalBoletos = sorteo.numbers.length;

    // Función para formatear la lista de números (máx. 5 visibles)
    const formatNumbers = () => {
        if (totalBoletos === 0) return 'Ninguno';
        
        const visibleNumbers = sorteo.numbers.slice(0, 5).join(', ');
        if (totalBoletos > 5) {
            return `${visibleNumbers}, y ${totalBoletos - 5} más...`;
        }
        return visibleNumbers;
    };

    return (
        // Usamos solo clases de Tailwind para el estilo de la tarjeta, lo que garantiza que se vean.
        <div 
            className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden border border-gray-100 group" 
            onClick={() => navigate(`/detalle/${sorteo.id}`)}
        >
            <img 
                // Usamos la clave image_url si está disponible, o el fallback.
                src={sorteo.image_url || sorteo.image} 
                alt={sorteo.name} 
                className="w-full h-48 object-cover transition duration-500 group-hover:scale-105" 
                onError={(e) => { 
                    e.target.onerror = null; 
                    e.target.src = "https://placehold.co/300x200/4f46e5/ffffff?text=Tu+Participación"; 
                }}
            />
            <div className="p-5 space-y-3 flex flex-col h-full">
                <h3 className="text-xl font-bold text-gray-900 line-clamp-2">{sorteo.name}</h3>
                
                {/* SECCIÓN CLAVE: TOTAL DE NÚMEROS APARTADOS (Estilo Prominente) */}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                    <div className="text-base font-semibold text-gray-600 flex items-center">
                        {/* Icono de Boleto (Lucide icon) */}
                        <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
                        Total Apartados:
                    </div>
                    {/* Cantidad resaltada con Tailwind para máxima visibilidad */}
                    <span className="text-3xl font-extrabold text-green-700">
                        {totalBoletos}
                    </span>
                </div>
                {/* FIN SECCIÓN CLAVE */}

                {/* Lista de Números (informativo) */}
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-200">
                    <p className="font-medium text-gray-700 mb-1">Números:</p>
                    <p className="font-mono break-all text-xs">
                        {formatNumbers()}
                    </p>
                </div>
                
                {/* Botón de ver detalles/participaciones */}
                <button 
                    className="w-full mt-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-150 shadow-md"
                    // Nota: Ya no necesitamos el onClick aquí ya que el div padre maneja la navegación, 
                    // pero lo dejamos para consistencia si se desea un comportamiento solo en el botón.
                    onClick={(e) => { e.stopPropagation(); navigate(`/detalle/${sorteo.id}`); }} 
                >
                    Ver Detalles del Sorteo
                </button>
            </div>
        </div>
    );
};


export default function GaleriaParticipacion() {
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

        // APLICANDO VALIDACIÓN DE 10 DÍGITOS
        if (!phoneNumber || phoneNumber.length !== 10) {
            setError("Por favor, introduce un número de teléfono de 10 dígitos válido.");
            return;
        }

        setIsLoading(true);

        try {
            const url = `${API_BASE_URL}/api/v1/purchases/?phone=${phoneNumber}`;
            
            // Usando fetch con reintentos (Exponential Backoff)
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
                throw new Error(`Error al buscar participaciones: ${response.status} ${response.statusText}`);
            }

            const responseText = await response.text();
            let data = [];

            try {
                data = JSON.parse(responseText);
            } catch (jsonError) {
                if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
                    throw new Error("El servidor devolvió una página HTML (probablemente error 500). Por favor, verifica los logs de tu servidor Django para encontrar la excepción de Python.");
                }
                throw jsonError;
            }
            
            // Adaptar los datos del backend a la estructura del frontend
            const participacionesAdaptadas = (Array.isArray(data) ? data : data.results || []).map(item => {
                
                const purchasedDetails = item.details || [];
                const purchasedNumbers = purchasedDetails.map(detail => detail.number);
                
                const unitPrice = purchasedDetails.length > 0 
                    ? parseFloat(purchasedDetails[0].unit_price) 
                    : item.total_amount / purchasedNumbers.length || 0; 

                return {
                    id: item.raffle_id,
                    name: item.raffle_name,
                    image_url: item.raffle_image_url || 'https://placehold.co/300x200/4f46e5/ffffff?text=Tu+Participación', 
                    price_per_number: unitPrice, 
                    numbers: purchasedNumbers 
                };
            }).filter(item => item.numbers.length > 0 && item.id); 

            setParticipaciones(participacionesAdaptadas);

        } catch (err) {
            console.error("Error al buscar:", err);
            setError(`Ocurrió un error al conectar con el servicio: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8 lg:p-12">
            <header className="galeria-header text-center mb-10 p-6 bg-white rounded-xl shadow-lg border border-indigo-200">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-indigo-800 mb-2">
                    Consulta tus Boletos
                </h1>
                <p className="text-lg text-gray-600">
                    Ingresa tu número de teléfono de 10 dígitos para ver los sorteos en los que has participado.
                </p>
            </header>

            {/* Formulario de Búsqueda */}
            <form onSubmit={handleSubmit} className="max-w-xl mx-auto flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 p-6 bg-white rounded-xl shadow-2xl mb-10">
                <input
                    id="phoneNumberInput"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))} 
                    placeholder="Ej. 6621234567"
                    className="w-full sm:flex-1 p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 shadow-inner"
                    maxLength="10"
                    required
                />
                <button 
                    type="submit" 
                    className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-150 disabled:opacity-50 shadow-lg"
                    disabled={isLoading || phoneNumber.length !== 10}
                >
                    {isLoading ? 'Buscando...' : 'Buscar Boletos'}
                </button>
            </form>

            {/* Mensaje de Error */}
            {error && (
                <div className="max-w-xl mx-auto mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center font-medium shadow-md">
                    <p>{error}</p>
                </div>
            )}

            {/* Resultados */}
            <div className="participation-results">
                
                {/* Estado de Carga */}
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {participaciones.map(sorteo => (
                                <TarjetaParticipacion key={sorteo.id} sorteo={sorteo} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Sin Resultados */}
                {!isLoading && hasSearched && participaciones.length === 0 && !error && (
                    <div className="text-center mt-12 p-8 bg-white rounded-xl shadow-lg space-y-4 max-w-lg mx-auto border-t-4 border-indigo-400">
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
                    <div className="text-center mt-12 p-8 bg-indigo-50 text-indigo-800 rounded-xl shadow-inner max-w-lg mx-auto border-t-4 border-indigo-200">
                        <p className="text-lg font-medium">
                            Ingresa tu teléfono y presiona "Buscar Boletos" para consultar tu estado.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}