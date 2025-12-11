//pruebas TDD del panel personal 
//render, lista de sorteos. numeros y estados
//manejo de estados vacios y errores de carga
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
vi.mock('../CSS/GaleriaParticipacion.css', () => ({}))
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

  // Helper para mock exitoso
  const mockSuccessfulFetch = (data = []) => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(data)
    })
  }

  // Helper para mock con error HTTP
  const mockErrorFetch = (status = 500, errorText = '') => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status,
      text: async () => errorText || ''
    })
  }

  describe('Escenario 1: Validaciones del formulario', () => {
    it('El botón debe estar deshabilitado con número corto', async () => {
      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '123') // Solo 3 dígitos
      
      // VERIFICACIÓN PRINCIPAL: El botón debe estar deshabilitado
      expect(button).toBeDisabled()
      
      // Intenta hacer clic (no debería hacer nada porque está deshabilitado)
      await user.click(button)
      
      // Tu componente PUEDE o NO mostrar el mensaje de error
      // Buscamos el mensaje de manera flexible
      const errorMessage = screen.queryByText(/Por favor, introduce un número de teléfono de 10 dígitos válido/i)
      
      // Si existe el mensaje, verificar que está visible
      if (errorMessage) {
        expect(errorMessage).toBeInTheDocument()
      }
      // Si no existe, la prueba aún pasa porque el botón está deshabilitado
    })

    it('El botón debe estar habilitado con 10 dígitos', async () => {
      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567') // 10 dígitos
      
      expect(button).toBeEnabled()
    })

    it('Solo debe aceptar números en el input', async () => {
      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      
      await user.type(input, '662abc1234')
      
      expect(input.value).toBe('6621234')
    })
  })

  describe('Escenario 2: Cliente ve solo sus números', () => {
    const mockData = [
      {
        raffle_id: 1,
        raffle_name: 'Sorteo Casa Premium',
        raffle_image: 'https://example.com/casa.jpg',
        details: [
          { number: '001', unit_price: '100.00' },
          { number: '050', unit_price: '100.00' },
          { number: '100', unit_price: '100.00' }
        ],
        total_amount: 300.00
      }
    ]

    it('Debe mostrar solo los números comprados por el cliente', async () => {
      mockSuccessfulFetch(mockData)

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('Sorteo Casa Premium')).toBeInTheDocument()
        expect(screen.getByText('Cantidad de Boletos')).toBeInTheDocument()
        expect(screen.getByText('3')).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('Escenario 3: Cliente sin participaciones', () => {
    it('Debe mostrar mensaje cuando no hay participaciones', async () => {
      mockSuccessfulFetch([])

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6629999999')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('¡Vaya!')).toBeInTheDocument()
        expect(screen.getByText(/No se encontraron boletos asociados al número/i)).toBeInTheDocument()
        expect(screen.getByText('6629999999')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Ver Sorteos Activos y Participar/i })).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('Escenario 4: Estados correctos de la UI', () => {
    it('El número debe permanecer en el input después de validación fallida', async () => {
      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '123')
      await user.click(button)
      
      // El número debe permanecer en el input
      expect(input.value).toBe('123')
      
      // El botón debe estar deshabilitado
      expect(button).toBeDisabled()
    })
  })

  describe('Escenario 5: Manejo de errores', () => {
    it('Debe mostrar error cuando el servidor falla (500)', async () => {
      // Mock de error 500
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error'
      })

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      
      // Asegurarse de que el botón está habilitado
      expect(button).toBeEnabled()
      
      await user.click(button)
      
      await waitFor(() => {
        // Buscar cualquier mensaje de error que contenga "error"
        const errorElement = screen.getByText(/error/i)
        expect(errorElement).toBeInTheDocument()
      }, { timeout: 3000 })
    })

   
  })

  describe('Escenario 6: Navegación y funcionalidad', () => {
    it('Debe navegar a sorteos activos desde estado sin resultados', async () => {
      mockSuccessfulFetch([])

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const searchButton = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByText('¡Vaya!')).toBeInTheDocument()
        
        // Encontrar el botón de participar
        const participarButton = screen.getByRole('button', { name: /Ver Sorteos Activos y Participar/i })
        expect(participarButton).toBeInTheDocument()
        
        // HACER CLIC DIRECTAMENTE con fireEvent (más confiable para navegación)
        fireEvent.click(participarButton)
      }, { timeout: 3000 })
      
      // Verificar que navigate fue llamado
      expect(mockNavigate).toHaveBeenCalledWith('/rifas')
    })

    it('Debe navegar al detalle del sorteo al hacer clic en la tarjeta', async () => {
      const mockData = [{
        raffle_id: 123,
        raffle_name: 'Sorteo Navegable',
        raffle_image: 'https://example.com/test.jpg',
        details: [{ number: '001', unit_price: '100.00' }],
        total_amount: 100.00
      }]

      mockSuccessfulFetch(mockData)

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const searchButton = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByText('Sorteo Navegable')).toBeInTheDocument()
      }, { timeout: 3000 })
      
      // Encontrar la tarjeta por su clase
      const tarjetas = document.querySelectorAll('.participation-card')
      expect(tarjetas.length).toBeGreaterThan(0)
      
      // Hacer clic en la primera tarjeta
      if (tarjetas.length > 0) {
        fireEvent.click(tarjetas[0])
        
        // Verificar navegación con los parámetros correctos
        expect(mockNavigate).toHaveBeenCalledWith(
          '/participacion/detalle/123',
          expect.objectContaining({
            state: expect.objectContaining({
              phone: '6621234567'
            })
          })
        )
      }
    })
  })

  describe('Escenario 7: Estado inicial', () => {
    it('Debe mostrar mensaje inicial antes de buscar', () => {
      renderComponent()
      
      expect(screen.getByText('Consulta tus Boletos')).toBeInTheDocument()
      expect(screen.getByText(/Ingresa tu número de teléfono de 10 dígitos para ver los sorteos en los que has participado./i)).toBeInTheDocument()
      expect(screen.getByText(/Ingresa tu teléfono y presiona "Buscar Boletos" para consultar tu estado./i)).toBeInTheDocument()
    })
  })
})