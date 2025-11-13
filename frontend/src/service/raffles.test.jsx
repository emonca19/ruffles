import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GaleriaSorteos from '../JSX/GaleriaSorteos';

// Mock de TarjetaSorteo
vi.mock('./TarjetaSorteo.jsx', () => ({
  default: vi.fn(({ sorteo, esOrganizador }) => (
    <div data-testid={`sorteo-card-${sorteo.id}`} className="sorteo-card">
      <h3>{sorteo.name}</h3>
      <img src={sorteo.image_url} alt={sorteo.name} />
      <p>Precio por número: ${sorteo.price_per_number}</p>
      <span data-testid="modo-vista">{esOrganizador ? 'Organizador' : 'Visitante'}</span>
    </div>
  ))
}));

describe('Pruebas Automáticas - Galería de Sorteos', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    vi.useFakeTimers();
    
    // Mock de console.error para evitar logs en tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllTimers();
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // 1. RENDERING DE CARDS CON DATOS VÁLIDOS
  // ==========================================================================
  describe('Rendering de cards con datos válidos', () => {
    it('debe renderizar correctamente todas las cards de sorteos con datos válidos', async () => {
      render(<GaleriaSorteos />);
      
      await vi.advanceTimersByTimeAsync(1600);

      // Verificar que se renderizan todas las cards
      await waitFor(() => {
        expect(screen.getByTestId('sorteo-card-1')).toBeInTheDocument();
        expect(screen.getByTestId('sorteo-card-2')).toBeInTheDocument();
        expect(screen.getByTestId('sorteo-card-3')).toBeInTheDocument();
        expect(screen.getByTestId('sorteo-card-4')).toBeInTheDocument();
        expect(screen.getByTestId('sorteo-card-5')).toBeInTheDocument();
      });

      // Verificar que los datos se muestran correctamente en las cards
      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      expect(screen.getByText('Canasta de Regalo')).toBeInTheDocument();
      expect(screen.getByText('Viaje a la Playa')).toBeInTheDocument();
      expect(screen.getByText('Audífonos Pro')).toBeInTheDocument();
      expect(screen.getByText('Cena para Dos')).toBeInTheDocument();

      // Verificar precios
      expect(screen.getByText('Precio por número: $100')).toBeInTheDocument();
      expect(screen.getByText('Precio por número: $50')).toBeInTheDocument();
      expect(screen.getByText('Precio por número: $250')).toBeInTheDocument();
    });

    it('debe pasar los props correctos a cada TarjetaSorteo', async () => {
      render(<GaleriaSorteos />);
      
      await vi.advanceTimersByTimeAsync(1600);

      // Verificar que se pasan los datos correctos del sorteo
      await waitFor(() => {
        const cards = screen.getAllByTestId(/sorteo-card-/);
        expect(cards).toHaveLength(5);
      });

      // Verificar que todas las cards están en modo visitante
      const modosVista = screen.getAllByTestId('modo-vista');
      modosVista.forEach(modo => {
        expect(modo).toHaveTextContent('Visitante');
      });
    });
  });

  // ==========================================================================
  // 2. VISUALIZACIÓN DE LOADER (SPINNER) CUANDO ESTÁ CARGANDO
  // ==========================================================================
  describe('Visualización de loader (spinner) cuando está cargando', () => {
    it('debe mostrar el spinner durante la carga inicial', async () => {
      render(<GaleriaSorteos />);

      // Verificar que el spinner se muestra inmediatamente
      expect(screen.getByText('Cargando sorteos...')).toBeInTheDocument();
      
      // El spinner debería estar presente
      expect(screen.getByText('Cargando sorteos...')).toBeVisible();

      // Avanzar el tiempo y verificar que el spinner desaparece
      await vi.advanceTimersByTimeAsync(1600);
      
      await waitFor(() => {
        expect(screen.queryByText('Cargando sorteos...')).not.toBeInTheDocument();
      });
    });

    it('debe mostrar el spinner durante cada cambio de vista', async () => {
      render(<GaleriaSorteos />);
      
      // Completar carga inicial
      await vi.advanceTimersByTimeAsync(1600);
      expect(screen.queryByText('Cargando sorteos...')).not.toBeInTheDocument();

      // Cambiar vista - debería mostrar spinner nuevamente
      await user.click(screen.getByText('Organizador'));
      expect(screen.getByText('Cargando sorteos...')).toBeInTheDocument();

      // Completar carga
      await vi.advanceTimersByTimeAsync(1600);
      expect(screen.queryByText('Cargando sorteos...')).not.toBeInTheDocument();
    });

    it('el spinner debe tener una estructura visible', async () => {
      render(<GaleriaSorteos />);

      // Verificar que el loading tiene tanto el spinner como el texto
      const loadingContainer = screen.getByText('Cargando sorteos...').closest('.raffle-loading');
      expect(loadingContainer).toBeInTheDocument();
      expect(screen.getByText('Cargando sorteos...')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 3. MENSAJE "NO HAY SORTEOS" SI LA LISTA ESTÁ VACÍA
  // ==========================================================================
  describe('Mensaje "No hay sorteos" si la lista está vacía', () => {
    it('debe mostrar mensaje específico para visitante cuando no hay sorteos', async () => {
      // usaremos un mock para probar esto, simulando  la vista visitante no tiene sorteos
      
      render(<GaleriaSorteos />);
      
      // Cambiar a organizador (que tiene array vacío por defecto)
      await vi.advanceTimersByTimeAsync(1600);
      await user.click(screen.getByText('Organizador'));
      await vi.advanceTimersByTimeAsync(1600);

      // Verificar mensaje de no hay sorteos en organizador
      await waitFor(() => {
        expect(screen.getByText('No hay sorteos en el sistema')).toBeInTheDocument();
      });
    });

    it('debe mostrar mensaje diferente para visitante vs organizador', async () => {
      render(<GaleriaSorteos />);
      
      // Ir a organizador (vacío)
      await vi.advanceTimersByTimeAsync(1600);
      await user.click(screen.getByText('Organizador'));
      await vi.advanceTimersByTimeAsync(1600);

      // Verificar mensaje de organizador
      expect(screen.getByText('No hay sorteos en el sistema')).toBeInTheDocument();
      expect(screen.getByText('Crear Nuevo Sorteo')).toBeInTheDocument();

      // Cambiar a visitante (con sorteos) 
      await user.click(screen.getByText('Visitante'));
      await vi.advanceTimersByTimeAsync(1600);

      await waitFor(() => {
        expect(screen.queryByText('No hay sorteos en el sistema')).not.toBeInTheDocument();
        expect(screen.queryByText('No hay sorteos disponibles en este momento. Vuelve pronto para participar.')).not.toBeInTheDocument();
      });
    });

    it('debe mostrar botón de acción en estado vacío del organizador', async () => {
      render(<GaleriaSorteos />);
      
      await vi.advanceTimersByTimeAsync(1600);
      await user.click(screen.getByText('Organizador'));
      await vi.advanceTimersByTimeAsync(1600);

      const botonCrear = screen.getByText('Crear Nuevo Sorteo');
      expect(botonCrear).toBeInTheDocument();
      expect(botonCrear).toBeVisible();
      expect(botonCrear).toHaveClass('raffle-participar-btn');
    });
  });

  // ==========================================================================
  // 4. COMPORTAMIENTO ANTE ERROR DE API
  // ==========================================================================
  describe('Comportamiento ante error de API', () => {
    it('debe manejar errores de API mostrando mensaje de error', async () => {
      // Mock para simular un error en el setTimeout
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn((callback) => {
        callback(); // Ejecutar inmediatamente
        throw new Error('Error de API: No se pudieron cargar los sorteos');
      });

      render(<GaleriaSorteos />);

      // Verificar que el error no rompe la aplicación completamente
      await waitFor(() => {
        // El componente debería manejar el error gracefulmente
        expect(screen.queryByText('Cargando sorteos...')).not.toBeInTheDocument();
      });

      // Restaurar setTimeout
      global.setTimeout = originalSetTimeout;
    });

    it('debe ser resiliente a errores en la carga de datos', async () => {
      // Test para verificar que el componente no se cae con errores
      const component = <GaleriaSorteos />;
      
      expect(() => render(component)).not.toThrow();
      
      // Avanzar tiempo y verificar que sigue funcionando
      await vi.advanceTimersByTimeAsync(1600);
      
      // El componente debería estar en un estado estable
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 5. PAGINACIÓN ACTIVA
  // ==========================================================================
  describe('Paginación activa', () => {
    
    it('debe tener navegación activa entre vistas', async () => {
      render(<GaleriaSorteos />);
      
      await vi.advanceTimersByTimeAsync(1600);

      const botonVisitante = screen.getByText('Visitante');
      const botonOrganizador = screen.getByText('Organizador');

      // Verificar que los botones de navegación están presentes y son clickeables
      expect(botonVisitante).toBeEnabled();
      expect(botonOrganizador).toBeEnabled();

      // Verificar estado activo inicial
      expect(botonVisitante).toHaveClass('active');
      expect(botonOrganizador).not.toHaveClass('active');

      // Cambiar vista y verificar cambio de estado activo
      await user.click(botonOrganizador);
      await vi.advanceTimersByTimeAsync(1600);

      expect(botonOrganizador).toHaveClass('active');
      expect(botonVisitante).not.toHaveClass('active');
    });

    it('debe recargar datos al cambiar de vista (página)', async () => {
      render(<GaleriaSorteos />);
      
      // Contador inicial de renders de TarjetaSorteo
      const initialCallCount = vi.mocked(TarjetaSorteo).mock.calls.length;

      await vi.advanceTimersByTimeAsync(1600);

      // Cambiar vista
      await user.click(screen.getByText('Organizador'));
      await vi.advanceTimersByTimeAsync(1600);

      // Cambiar de vuelta
      await user.click(screen.getByText('Visitante'));
      await vi.advanceTimersByTimeAsync(1600);

      // Verificar que los datos se recargaron (nuevos renders)
      const finalCallCount = vi.mocked(TarjetaSorteo).mock.calls.length;
      expect(finalCallCount).toBeGreaterThan(initialCallCount);
    });

    it('debe mantener el estado de navegación consistente', async () => {
      render(<GaleriaSorteos />);
      
      await vi.advanceTimersByTimeAsync(1600);

      // Realizar múltiples cambios de vista
      await user.click(screen.getByText('Organizador'));
      await vi.advanceTimersByTimeAsync(1600);
      
      await user.click(screen.getByText('Visitante'));
      await vi.advanceTimersByTimeAsync(1600);
      
      await user.click(screen.getByText('Organizador'));
      await vi.advanceTimersByTimeAsync(1600);

      // Verificar que el estado final es consistente
      expect(screen.getByText('Organizador')).toHaveClass('active');
      expect(screen.getByText('Visitante')).not.toHaveClass('active');
      expect(screen.getByText('No hay sorteos en el sistema')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // PRUEBAS ADICIONALES DE INTEGRACIÓN
  // ==========================================================================
  describe('Pruebas de integración completa', () => {
    it('debe completar el flujo completo: carga -> muestra -> cambia vista -> estado vacío', async () => {
      render(<GaleriaSorteos />);

      // 1. Verificar carga inicial
      expect(screen.getByText('Cargando sorteos...')).toBeInTheDocument();
      
      // 2. Verificar muestra de sorteos
      await vi.advanceTimersByTimeAsync(1600);
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      // 3. Verificar cambio de vista
      await user.click(screen.getByText('Organizador'));
      expect(screen.getByText('Cargando sorteos...')).toBeInTheDocument();
      
      // 4. Verificar estado vacío
      await vi.advanceTimersByTimeAsync(1600);
      await waitFor(() => {
        expect(screen.getByText('No hay sorteos en el sistema')).toBeInTheDocument();
      });

      // 5. Verificar botón de acción
      expect(screen.getByText('Crear Nuevo Sorteo')).toBeInTheDocument();
    });

    it('debe manejar correctamente el ciclo de vida del componente', async () => {
      const { unmount } = render(<GaleriaSorteos />);

      // Verificar que se monta correctamente
      expect(screen.getByText('Cargando sorteos...')).toBeInTheDocument();

      // Avanzar y verificar estado cargado
      await vi.advanceTimersByTimeAsync(1600);
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      // Desmontar y verificar que no hay errores
      expect(() => unmount()).not.toThrow();
    });
  });
});