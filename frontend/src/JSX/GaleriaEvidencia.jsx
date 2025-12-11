import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:8000';

// Componente para el indicador de carga (Spinner)
const Spinner = () => (
    <div className="raffle-loading flex flex-col items-center justify-center p-20 min-h-[400px] gap-5 text-gray-800">
        <div className="spinner w-16 h-16 border-6 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-xl font-medium">Cargando Evidencias...</p>
    </div>
);

// Componente Tarjeta de Evidencia
const TarjetaEvidencia = ({ evidencia }) => {
    const navigate = useNavigate();

    const formatoPrecio = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
    });

    const getStatusClasses = (status) => {
        const lowerStatus = status.toLowerCase();
        switch (lowerStatus) {
            case 'pending':
                return "bg-yellow-50 text-yellow-700 border-yellow-200";
            case 'approved':
                return "bg-green-50 text-green-700 border-green-200";
            case 'rejected':
                return "bg-red-50 text-red-700 border-red-200";
            default:
                return "bg-gray-50 text-gray-700 border-gray-200";
        }
    };
    
    const formatTickets = (tickets) => {
        if (!tickets || tickets.length === 0) return 'N/A';
        const displayTickets = tickets.slice(0, 6).join(', ');
        return tickets.length > 6 ? `${displayTickets}, +${tickets.length - 6} más` : displayTickets;
    };

    const isPending = (evidencia.status || 'unknown').toLowerCase() === 'pending';

    return (
        <div 
            className={`raffle-card bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden transition-all duration-350 flex flex-col ${isPending ? 'cursor-pointer hover:translate-y-[-6px] hover:shadow-xl hover:border-indigo-600' : ''}`}
            // ✅ Solución: Pasando el objeto 'evidencia' en el state de navegación al hacer clic en la tarjeta.
            onClick={() => isPending && evidencia.payment_id && navigate(`/verificacion/detalle/${evidencia.payment_id}`, { state: { evidencia } })}
        >
            
            <div className="relative overflow-hidden">
                <img 
                    src={evidencia.receipt_url || "https://placehold.co/400x200/cccccc/333333?text=Comprobante+No+Disponible"} 
                    alt={`Comprobante de ${evidencia.customer_name}`} 
                    className="raffle-image w-full h-52 object-cover transition-transform duration-500 ease-in-out" 
                    onError={(e) => { 
                        e.target.onerror = null; 
                        e.target.src = "https://placehold.co/400x200/cccccc/333333?text=Comprobante+No+Disponible";
                    }}
                />
            </div>
            
            <div className="raffle-info p-5 flex flex-col flex-grow">
                <p className="text-xs text-gray-500 mb-1">Compra ID: {evidencia.purchase_id}</p>
                <h3 className={`raffle-name text-lg font-bold text-gray-800 mb-2 leading-snug`}>
                    {evidencia.raffle_name}
                </h3>
                
                <p className="text-sm text-gray-700 mb-1">
                    <span className="font-semibold">Cliente:</span> {evidencia.customer_name}
                </p>
                
                <p className="text-sm text-gray-700 mb-3">
                    <span className="font-semibold">Boletos:</span> {formatTickets(evidencia.tickets)}
                </p>

                <div className="mt-auto pt-3 border-t border-gray-100">
                    <p className={`raffle-price text-xl font-bold text-indigo-600 mb-2`}>
                        {formatoPrecio.format(evidencia.total_amount)}
                    </p>
                    
                    <p className={`text-center text-sm mt-1 font-semibold border py-2 rounded-lg ${getStatusClasses(evidencia.status || 'unknown')}`}>
                        Estatus: {(evidencia.status || 'UNKNOWN').toUpperCase()}
                    </p>
                    
                    {isPending && (
                        <button
                            className={`raffle-participar-btn w-full mt-3 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-250 shadow-md transform hover:translate-y-[-2px]`}
                            onClick={(e) => {
                                e.stopPropagation(); 
                                //Pasando el objeto 'evidencia' completo al hacer clic en el botón.
                                evidencia.payment_id && navigate(`/verificacion/detalle/${evidencia.payment_id}`, { state: { evidencia } });
                            }}
                        >
                            Verificar Comprobante
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Función para obtener el token (Ajustar según tu lógica)
const getToken = () => localStorage.getItem('authToken'); 

export default function GaleriaEvidencias() {
    const [evidencias, setEvidencias] = useState([]);
    const [isLoading, setIsLoading] = useState(true); 
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    
    // Función genérica de Fetch con Autenticación (Bearer Token) usando localStorage
    const fetchWithAuth = async (url, options = {}) => {
        const authToken = getToken();
        
        if (!authToken) {
            throw new Error("No autenticado: El token de administrador no está disponible. Por favor, inicie sesión.");
        }

        const headers = {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': options.method === 'GET' ? undefined : 'application/json',
            ...options.headers,
        };

        const response = await fetch(url, { ...options, headers });
        return response;
    };
    
    // Función para obtener los datos de la API 
    const fetchEvidencias = async () => {
        setIsLoading(true);
        setError(null);
        
        const apiUrl = `${API_BASE_URL}/api/v1/purchases/verifications/?status=pending`; 
        
        const maxRetries = 3;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const response = await fetchWithAuth(apiUrl);
                
                if (!response.ok) {
                    const rawResponseText = await response.text().catch(() => "Detalles no disponibles.");

                    if (response.status === 403) {
                           throw new Error(`Acceso Prohibido (403): Tu usuario no tiene el rol de 'organizer' para acceder a esta página.`);
                    }
                    if (response.status === 401) {
                           localStorage.removeItem('authToken'); 
                           navigate('/login'); 
                           throw new Error(`Sesión expirada o no autorizada (401). Serás redirigido para iniciar sesión.`);
                    }

                    let errorMsg = `Error de red: ${response.status} ${response.statusText}.`;
                    try {
                        const errorData = JSON.parse(rawResponseText);
                        errorMsg = errorData.detail || errorData.non_field_errors?.[0] || errorMsg;
                    } catch (_) {
                        console.error("Respuesta no JSON:", rawResponseText.substring(0, 100) + '...');
                    }

                    throw new Error(errorMsg);
                }
                
                const data = await response.json();
                setEvidencias(data);
                setIsLoading(false); 
                return; 
            } catch (err) {
                console.error(`Intento ${attempt + 1} fallido:`, err.message);
                
                if (err.message.includes('No autenticado') || err.message.includes('401') || err.message.includes('403')) {
                    setError(err.message);
                    setEvidencias([]);
                    setIsLoading(false); 
                    return; 
                }

                if (attempt < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt))); 
                } else {
                    setError(err.message);
                    setEvidencias([]);
                    setIsLoading(false); 
                    return; 
                }
            } 
        }
    };
    
    // Hook para cargar los datos al montar el componente
    useEffect(() => {
        fetchEvidencias();
    }, [fetchEvidencias]); 

    return (
        // Contenedor principal
        <div className="bg-gray-50 min-h-screen font-sans p-4 md:p-8">
            
            {/* Header del Componente */}
            <header className={`galeria-header text-center p-10 bg-indigo-50 rounded-2xl mx-auto mb-12 max-w-7xl border-2 border-indigo-600 shadow-lg`}>
                <h1 className={`text-indigo-600 font-extrabold text-4xl sm:text-5xl mb-2`}>
                    <span className="text-gray-900">Verificación de</span> Pagos
                </h1>
                <p className={`text-xl text-gray-800 opacity-90 mx-auto max-w-3xl`}>
                    Lista de comprobantes de pago pendientes de revisar y aprobar.
                </p>
            </header>

            {/* Renderizado Condicional */}
            {isLoading ? (
                <Spinner />
            ) : error ? (
                // Mensaje de Error
                <div className="error-message p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg max-w-3xl mx-auto mb-6 text-center shadow-md">
                    <p className="font-semibold text-xl mb-3">Error al Obtener Evidencias</p>
                    <p className="font-semibold">{error}</p>
                    {/* Botón de recarga si no es un error de redirección */}
                    {!error.includes("Serás redirigido") && !error.includes("No autenticado") && (
                        <button 
                            className="text-sm text-red-600 hover:text-red-800 underline mt-3 transition duration-150"
                            onClick={fetchEvidencias}
                        >
                            Intentar recargar
                        </button>
                    )}
                </div>
            ) : evidencias.length === 0 ? (
                // Estado Vacío
                <div className="raffle-empty-state p-16 text-center text-xl text-gray-700 bg-white border-2 border-dashed border-gray-300 rounded-xl max-w-4xl mx-auto shadow-md">
                    <h2 className="text-3xl font-extrabold text-gray-700 mb-4">¡Todo en Orden!</h2>
                    <p className="text-lg text-gray-600">
                        No hay comprobantes de pago pendientes de verificación en este momento.
                    </p>
                    <p className="text-gray-500 mt-2">
                        Puedes tomar un descanso. 
                    </p>
                </div>
            ) : (
                // Galería de Tarjetas
                <div className="raffle-gallery grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 p-4 mx-auto max-w-7xl">
                    {evidencias.map((evidencia) => (
                        <TarjetaEvidencia key={evidencia.payment_id} evidencia={evidencia} />
                    ))}
                </div>
            )}
        </div>
    );
}