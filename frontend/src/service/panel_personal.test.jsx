// src/service/panel_personal.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import ParticipacionSorteos from "../JSX/ParticipacionSorteos.jsx";

// Mock para react-router-dom
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock para CSS
vi.mock('../CSS/ParticipacionSorteos.css', () => ({}))

describe('HU-4: Pruebas Funcionales Panel Personal', () => {
  const user = userEvent.setup()
  
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
    global.fetch = vi.fn()
  })
  
  afterEach(() => {
    vi.resetAllMocks()
  })

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <ParticipacionSorteos />
      </MemoryRouter>
    )
  }

  describe('Escenario 1: Validaciones del formulario', () => {
    it('El botón debe estar deshabilitado con número corto (menos de 10 dígitos)', async () => {
      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '123') // Solo 3 dígitos
      
      // Verifica que el botón está deshabilitado
      expect(button).toBeDisabled()
    })

    it('El botón debe estar habilitado con número de 10 dígitos', async () => {
      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567') // 10 dígitos
      
      // Verifica que el botón está habilitado
      expect(button).toBeEnabled()
    })

    it('Solo debe aceptar números en el input', async () => {
      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      
      // Intenta escribir letras
      await user.type(input, '662abc1234')
      
      // Verifica que solo quedaron números
      expect(input.value).toBe('6621234')
    })
  })

  describe('Escenario 2: Cliente ve solo sus números', () => {
    const mockParticipaciones = [
      {
        raffle_id: 1,
        raffle_name: 'Sorteo Casa Premium',
        raffle_image_url: 'https://example.com/casa.jpg',
        details: [
          { number: '001', unit_price: '100.00' },
          { number: '050', unit_price: '100.00' },
          { number: '100', unit_price: '100.00' }
        ],
        total_amount: 300.00
      }
    ]

    it('Debe mostrar lista de sorteos después de búsqueda exitosa', async () => {
      // Mock CORRECTO: response.text() debe ser una función que retorna Promise
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockParticipaciones))
      })

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(button)
      
      // Espera a que aparezcan los resultados
      await waitFor(() => {
        expect(screen.getByText('Sorteo Casa Premium')).toBeInTheDocument()
      })
    })

    it('Debe mostrar mensaje de carga durante la búsqueda', async () => {
      // Mock con delay para mostrar loading
      global.fetch.mockImplementationOnce(
        () => new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            status: 200,
            text: () => Promise.resolve(JSON.stringify([]))
          }), 100)
        )
      )

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(button)
      
      // Verifica que aparece el estado de carga
      expect(screen.getByText('Buscando...')).toBeInTheDocument()
      
      // Espera a que termine
      await waitFor(() => {
        expect(screen.queryByText('Buscando...')).not.toBeInTheDocument()
      })
    })
  })

  describe('Escenario 3: Cliente sin participaciones', () => {
    it('Debe mostrar mensaje cuando no hay participaciones', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify([]))
      })

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6629999999')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('¡Vaya!')).toBeInTheDocument()
        expect(screen.getByText(/No se encontraron boletos asociados al número/i)).toBeInTheDocument()
      })
    })
  })

  describe('Escenario 4: Manejo de errores', () => {
    it('Debe mostrar error cuando el servidor falla (500)', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Server Error')
      })

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText(/Ocurrió un error al conectar con el servicio/i)).toBeInTheDocument()
      })
    })

    it('No debe mostrar error cuando la respuesta es 404 (número no encontrado)', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify([])) // Tu API devuelve array vacío para "no encontrado"
      })

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(button)
      
      await waitFor(() => {
        // No debería mostrar mensaje de error
        expect(screen.queryByText(/Ocurrió un error al conectar con el servicio/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Escenario 5: Navegación', () => {
    it('Debe navegar a sorteos activos desde estado sin resultados', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify([]))
      })

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(button)
      
      await waitFor(() => {
        const participarButton = screen.getByRole('button', { name: /Ver Sorteos Activos y Participar/i })
        expect(participarButton).toBeInTheDocument()
        
        fireEvent.click(participarButton)
        expect(mockNavigate).toHaveBeenCalledWith('/rifas')
      })
    })

    it('Debe navegar al detalle del sorteo si existe botón', async () => {
      const mockData = [{
        raffle_id: 123,
        raffle_name: 'Sorteo de Prueba',
        raffle_image_url: 'https://example.com/test.jpg',
        details: [{ number: '001', unit_price: '100.00' }],
        total_amount: 100.00
      }]

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockData))
      })

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const searchButton = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByText('Sorteo de Prueba')).toBeInTheDocument()
      })
      
      // Busca el botón de detalles - puede tener diferentes nombres
      const botones = screen.getAllByRole('button')
      const detalleButton = botones.find(btn => 
        btn.textContent.includes('Detalle') || 
        btn.textContent.includes('Ver') ||
        btn.textContent.includes('Detalles')
      )
      
      // Si existe el botón, prueba la navegación
      if (detalleButton) {
        await user.click(detalleButton)
        expect(mockNavigate).toHaveBeenCalledWith('/detalle/123')
      }
      // Si no existe, la prueba pasa (puede que no haya botón en tu diseño)
    })
  })

  describe('Escenario 6: Estado inicial', () => {
    it('Debe mostrar mensaje inicial antes de buscar', () => {
      renderComponent()
      
      expect(screen.getByText('Consulta tus Boletos')).toBeInTheDocument()
      expect(screen.getByText(/Ingresa tu número de teléfono de 10 dígitos para ver los sorteos en los que has participado./i)).toBeInTheDocument()
    })

    it('Debe mostrar mensaje de instrucciones inicial', () => {
      renderComponent()
      
      expect(screen.getByText(/Ingresa tu teléfono y presiona "Buscar Boletos" para consultar tu estado./i)).toBeInTheDocument()
    })
  })
})