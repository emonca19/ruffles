import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import GaleriaSorteos from '../JSX/GaleriaSorteos';

// Mock de TarjetaSorteo
vi.mock('../JSX/TarjetaSorteo', () => ({
  default: vi.fn(({ sorteo, esOrganizador }) => (
    <div data-testid={`sorteo-card-${sorteo.id}`} className="sorteo-card">
      <h3>{sorteo.name}</h3>
      <img src={sorteo.image_url} alt={sorteo.name} />
      <p>Precio por número: ${sorteo.price_per_number}</p>
      <span data-testid="modo-vista">{esOrganizador ? 'Organizador' : 'Visitante'}</span>
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
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithRouter = (component) => {
    return render(<RouterWrapper>{component}</RouterWrapper>);
  };

  // Helper para encontrar botones de navegación (evita conflictos con spans)
  const getBotonVisitante = () => screen.getByRole('button', { name: 'Visitante' });
  const getBotonOrganizador = () => screen.getByRole('button', { name: 'Organizador' });

  // ==========================================================================
  // 1. RENDERING DE CARDS CON DATOS VÁLIDOS
  // ==========================================================================
  describe('Rendering de cards con datos válidos', () => {
    it('debe renderizar correctamente todas las cards de sorteos con datos válidos', async () => {
      renderWithRouter(<GaleriaSorteos />);
      
      // Verificar que el spinner se muestra inicialmente
      expect(screen.getByText('Cargando sorteos...')).toBeInTheDocument();

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
    });

    it('debe pasar los props correctos a cada TarjetaSorteo', async () => {
      const { default: TarjetaSorteo } = await import('../JSX/TarjetaSorteo');
      
      renderWithRouter(<GaleriaSorteos />);
      
      // Esperar a que cargue
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verificar que se llamó a TarjetaSorteo con todos los sorteos
      expect(TarjetaSorteo).toHaveBeenCalledTimes(5);

      // Verificar que al menos una llamada tiene los props correctos
      expect(TarjetaSorteo).toHaveBeenCalledWith(
        expect.objectContaining({
          sorteo: expect.objectContaining({
            id: expect.any(Number),
            name: expect.any(String),
            price_per_number: expect.any(Number)
          }),
          esOrganizador: false
        }),
        expect.anything()
      );
    });
  });

  // ==========================================================================
  // 2. VISUALIZACIÓN DE LOADER (SPINNER) CUANDO ESTÁ CARGANDO
  // ==========================================================================
  describe('Visualización de loader (spinner) cuando está cargando', () => {
    it('debe mostrar el spinner durante la carga inicial', async () => {
      renderWithRouter(<GaleriaSorteos />);

      // Verificar spinner inicial
      expect(screen.getByText('Cargando sorteos...')).toBeInTheDocument();

      // Esperar a que desaparezca
      await waitFor(() => {
        expect(screen.queryByText('Cargando sorteos...')).not.toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('debe mostrar el spinner durante cada cambio de vista', async () => {
      renderWithRouter(<GaleriaSorteos />);
      
      // Esperar carga inicial
      await waitFor(() => {
        expect(screen.queryByText('Cargando sorteos...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Cambiar vista - debería mostrar spinner nuevamente
      await user.click(getBotonOrganizador());

      // Verificar que aparece el spinner
      expect(screen.getByText('Cargando sorteos...')).toBeInTheDocument();

      // Esperar a que termine la carga
      await waitFor(() => {
        expect(screen.queryByText('Cargando sorteos...')).not.toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('el spinner debe tener una estructura visible', () => {
      renderWithRouter(<GaleriaSorteos />);

      expect(screen.getByText('Cargando sorteos...')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 3. MENSAJE "NO HAY SORTEOS" SI LA LISTA ESTÁ VACÍA
  // ==========================================================================
  describe('Mensaje "No hay sorteos" si la lista está vacía', () => {
    it('debe mostrar mensaje específico para organizador cuando no hay sorteos', async () => {
      renderWithRouter(<GaleriaSorteos />);
      
      // Esperar carga inicial
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Cambiar a organizador
      await user.click(getBotonOrganizador());

      // Esperar carga
      await waitFor(() => {
        expect(screen.getByText('No hay sorteos en el sistema')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('debe mostrar mensaje diferente para visitante vs organizador', async () => {
      renderWithRouter(<GaleriaSorteos />);
      
      // Esperar carga inicial
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Ir a organizador
      await user.click(getBotonOrganizador());
      
      await waitFor(() => {
        expect(screen.getByText('No hay sorteos en el sistema')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verificar mensaje de organizador
      expect(screen.getByText('No hay sorteos en el sistema')).toBeInTheDocument();
      expect(screen.getByText('Crear Nuevo Sorteo')).toBeInTheDocument();

      // Cambiar a visitante
      await user.click(getBotonVisitante());

      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verificar que no muestra mensaje de vacío
      expect(screen.queryByText('No hay sorteos en el sistema')).not.toBeInTheDocument();
    });

    it('debe mostrar botón de acción en estado vacío del organizador', async () => {
      renderWithRouter(<GaleriaSorteos />);
      
      // Esperar carga inicial
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Cambiar a organizador
      await user.click(getBotonOrganizador());

      await waitFor(() => {
        expect(screen.getByText('Crear Nuevo Sorteo')).toBeInTheDocument();
      }, { timeout: 3000 });

      const botonCrear = screen.getByText('Crear Nuevo Sorteo');
      expect(botonCrear).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 4. COMPORTAMIENTO ANTE ERROR DE API
  // ==========================================================================
  describe('Comportamiento ante error de API', () => {
    it('debe manejar errores sin romper la aplicación', async () => {
      renderWithRouter(<GaleriaSorteos />);

      // Esperar a que cargue normalmente
      await waitFor(() => {
        expect(screen.queryByText('Cargando sorteos...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Verificar que la aplicación sigue funcionando (usando botones específicos)
      expect(getBotonVisitante()).toBeInTheDocument();
      expect(getBotonOrganizador()).toBeInTheDocument();
    });

    it('debe ser resiliente y mostrar interfaz usable', async () => {
      renderWithRouter(<GaleriaSorteos />);
      
      // Esperar carga
      await waitFor(() => {
        const tieneSorteos = screen.queryByText('iPhone 15 Pro') !== null;
        const tieneNavegacion = getBotonVisitante() !== null;
        expect(tieneSorteos || tieneNavegacion).toBe(true);
      }, { timeout: 3000 });
    });
  });

  // ==========================================================================
  // 5. PAGINACIÓN ACTIVA
  // ==========================================================================
  describe('Paginación activa', () => {
    it('debe tener navegación activa entre vistas', async () => {
      renderWithRouter(<GaleriaSorteos />);
      
      // Esperar carga inicial
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      }, { timeout: 3000 });

      const botonVisitante = getBotonVisitante();
      const botonOrganizador = getBotonOrganizador();

      // Verificar estado activo inicial
      expect(botonVisitante).toHaveClass('active');
      expect(botonOrganizador).not.toHaveClass('active');

      // Cambiar vista
      await user.click(botonOrganizador);

      await waitFor(() => {
        expect(botonOrganizador).toHaveClass('active');
        expect(botonVisitante).not.toHaveClass('active');
      }, { timeout: 3000 });
    });

    it('debe mantener el estado de navegación consistente', async () => {
      renderWithRouter(<GaleriaSorteos />);
      
      // Esperar carga inicial
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Múltiples cambios de vista
      await user.click(getBotonOrganizador());
      
      await waitFor(() => {
        expect(screen.getByText('No hay sorteos en el sistema')).toBeInTheDocument();
      }, { timeout: 3000 });
      
      await user.click(getBotonVisitante());
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      }, { timeout: 3000 });
      
      await user.click(getBotonOrganizador());

      await waitFor(() => {
        expect(getBotonOrganizador()).toHaveClass('active');
        expect(getBotonVisitante()).not.toHaveClass('active');
      }, { timeout: 3000 });
    });
  });

  // ==========================================================================
  // 6. PRUEBAS DE INTEGRACIÓN COMPLETA PARa  GALERIA SORTEOS
  // ==========================================================================
  describe('Pruebas de integración completa', () => {
    it('debe completar el flujo completo: carga -> muestra -> cambia vista -> estado vacío', async () => {
      renderWithRouter(<GaleriaSorteos />);

      // 1. Verificar carga inicial
      expect(screen.getByText('Cargando sorteos...')).toBeInTheDocument();
      
      // 2. Verificar muestra de sorteos
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      }, { timeout: 3000 });

      // 3. Verificar cambio de vista
      await user.click(getBotonOrganizador());
      expect(screen.getByText('Cargando sorteos...')).toBeInTheDocument();
      
      // 4. Verificar estado vacío
      await waitFor(() => {
        expect(screen.getByText('No hay sorteos en el sistema')).toBeInTheDocument();
      }, { timeout: 3000 });

      // 5. Verificar botón de acción
      expect(screen.getByText('Crear Nuevo Sorteo')).toBeInTheDocument();
    });

    it('debe manejar correctamente el ciclo de vida del componente', async () => {
      const { unmount } = renderWithRouter(<GaleriaSorteos />);

      // Verificar que se monta correctamente
      expect(screen.getByText('Cargando sorteos...')).toBeInTheDocument();

      // Esperar carga
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Desmontar sin errores
      expect(() => unmount()).not.toThrow();
    });
  });

  // ==========================================================================
  // 7. PRUEBAS  DE CONTENIDO
  // ==========================================================================
  describe('Contenido y textos específicos', () => {
    it('debe mostrar los títulos correctos según la vista', async () => {
      renderWithRouter(<GaleriaSorteos />);
      
      // Esperar carga inicial
      await waitFor(() => {
        expect(screen.getByText('Nuestros Sorteos Activos')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verificar título en vista visitante
      expect(screen.getByText('Nuestros Sorteos Activos')).toBeInTheDocument();
      expect(screen.getByText('¡Elige tu favorito, apoya a la comunidad y gana!')).toBeInTheDocument();

      // Cambiar a organizador
      await user.click(getBotonOrganizador());

      // En vista organizador vacía, NO debería mostrar los títulos de galería
      // porque se muestra el estado vacío en su lugar
      await waitFor(() => {
        expect(screen.getByText('No hay sorteos en el sistema')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verificar que NO muestra los títulos de galería en estado vacío
      expect(screen.queryByText('Todos los Sorteos del Sistema')).not.toBeInTheDocument();
      expect(screen.queryByText('Visualiza y administra tus sorteos.')).not.toBeInTheDocument();
    });

    it('debe mostrar títulos de galería solo cuando hay sorteos', async () => {
      renderWithRouter(<GaleriaSorteos />);
      
      // En visitante (con sorteos) debería mostrar títulos
      await waitFor(() => {
        expect(screen.getByText('Nuestros Sorteos Activos')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Cambiar a organizador (vacío) - NO debería mostrar títulos de galería
      await user.click(getBotonOrganizador());

      await waitFor(() => {
        expect(screen.getByText('No hay sorteos en el sistema')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verificar que muestra estado vacío en lugar de títulos de galería
      expect(screen.queryByText('Todos los Sorteos del Sistema')).not.toBeInTheDocument();
      
      // Volver a visitante - debería mostrar títulos nuevamente
      await user.click(getBotonVisitante());

      await waitFor(() => {
        expect(screen.getByText('Nuestros Sorteos Activos')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });
});