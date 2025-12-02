import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
// import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import GaleriaSorteos from '../JSX/GaleriaSorteos';

// Mock de TarjetaSorteo
vi.mock('../JSX/TarjetaSorteo', () => ({
  default: vi.fn(({ sorteo }) => (
    <div data-testid={`sorteo-card-${sorteo.id}`} className="sorteo-card">
      <h3>{sorteo.name}</h3>
      <img src={sorteo.image_url} alt={sorteo.name} />
      <p>Precio por número: ${sorteo.price_per_number}</p>
    </div>
  ))
}));

// Wrapper con Router
const RouterWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('Pruebas Automáticas - Galería de Sorteos', () => {
  // let user;
  const mockFetch = vi.fn();

  // Mock localStorage
  const localStorageMock = (function () {
    let store = {};
    return {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, value) => {
        store[key] = value.toString();
      }),
      removeItem: vi.fn((key) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      })
    };
  })();

  beforeEach(() => {
    // user = userEvent.setup();
    vi.spyOn(console, 'error').mockImplementation(() => { });
    vi.spyOn(console, 'log').mockImplementation(() => { });
    global.fetch = mockFetch;

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock
    });

    localStorageMock.clear();

    // Default mock response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 1, name: 'iPhone 15 Pro', image_url: 'img1.jpg', price_per_number: 100 },
        { id: 2, name: 'Canasta de Regalo', image_url: 'img2.jpg', price_per_number: 50 },
        { id: 3, name: 'Viaje a la Playa', image_url: 'img3.jpg', price_per_number: 200 },
        { id: 4, name: 'Sorteo 4', image_url: 'img4.jpg', price_per_number: 10 },
        { id: 5, name: 'Sorteo 5', image_url: 'img5.jpg', price_per_number: 20 },
      ]
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockFetch.mockClear();
  });

  const renderWithRouter = (component) => {
    return render(<RouterWrapper>{component}</RouterWrapper>);
  };

  // ==========================================================================
  // 1. RENDERING DE CARDS CON DATOS VÁLIDOS (VISITANTE)
  // ==========================================================================
  describe('Rendering de cards con datos válidos (Visitante)', () => {
    it('debe renderizar correctamente todas las cards de sorteos', async () => {
      renderWithRouter(<GaleriaSorteos />);

      // Verificar que el spinner se muestra inicialmente
      expect(screen.getByText('Cargando sorteos de la base de datos...')).toBeInTheDocument();

      // Esperar a que termine la carga
      await waitFor(() => {
        expect(screen.getByTestId('sorteo-card-1')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verificar que se renderizan todas las cards
      expect(screen.getByTestId('sorteo-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('sorteo-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('sorteo-card-3')).toBeInTheDocument();
      expect(screen.getByTestId('sorteo-card-4')).toBeInTheDocument();
      expect(screen.getByTestId('sorteo-card-5')).toBeInTheDocument();

      // Verificar datos
      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      expect(screen.getByText('Canasta de Regalo')).toBeInTheDocument();
      expect(screen.getByText('Viaje a la Playa')).toBeInTheDocument();

      // Verificar título de visitante
      expect(screen.getByText('Nuestros Sorteos Activos')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 2. VISTA ORGANIZADOR
  // ==========================================================================
  describe('Vista Organizador', () => {
    it('debe mostrar vista de organizador cuando hay token', async () => {
      localStorageMock.setItem('authToken', 'fake-token');

      renderWithRouter(<GaleriaSorteos />);

      await waitFor(() => {
        expect(screen.getByText('Panel de Organizador')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verificar que se envía el token en el header
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/raffles/'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer fake-token'
          })
        })
      );
    });

    it('debe mostrar estado vacío con botón de crear para organizador', async () => {
      localStorageMock.setItem('authToken', 'fake-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      renderWithRouter(<GaleriaSorteos />);

      await waitFor(() => {
        expect(screen.getByText('No has creado ningún sorteo aún')).toBeInTheDocument();
        expect(screen.getByText('Crear mi primera Rifa')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  // ==========================================================================
  // 3. MANEJO DE ERRORES
  // ==========================================================================
  describe('Manejo de errores', () => {
    it('debe mostrar mensaje de error cuando falla la API', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Error de red'));

      renderWithRouter(<GaleriaSorteos />);

      await waitFor(() => {
        expect(screen.getByText('Hubo un problema cargando los sorteos.')).toBeInTheDocument();
        expect(screen.getByText('Error de red')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('debe hacer logout si recibe 401 como organizador', async () => {
      localStorageMock.setItem('authToken', 'fake-token');

      // Mock window.location.reload
      const reloadMock = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock }
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      renderWithRouter(<GaleriaSorteos />);

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
        expect(reloadMock).toHaveBeenCalled();
      }, { timeout: 3000 });
    });
  });
});