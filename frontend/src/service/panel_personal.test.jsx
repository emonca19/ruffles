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
    it('Debe mostrar error cuando el número no tiene 10 dígitos', async () => {
      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      // Test con número corto
      await user.type(input, '123')
      await user.click(button)
      
      await waitFor(() => {
        // Texto EXACTO según tu componente
        expect(screen.getByText('Por favor, introduce un número de teléfono de 10 dígitos válido.')).toBeInTheDocument()
      })
    })

    it('Solo debe aceptar números en el input', async () => {
      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      
      await user.type(input, '662abc1234')
      
      expect(input.value).toBe('6621234')
    })

    it('El botón debe estar deshabilitado con número inválido', async () => {
      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '123')
      
      expect(button).toBeDisabled()
    })

    it('El botón debe estar habilitado con número válido', async () => {
      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      
      expect(button).toBeEnabled()
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
      },
      {
        raffle_id: 2,
        raffle_name: 'Sorteo Auto Deportivo',
        raffle_image_url: 'https://example.com/auto.jpg',
        details: [
          { number: '777', unit_price: '200.00' },
          { number: '888', unit_price: '200.00' }
        ],
        total_amount: 400.00
      }
    ]

    it('Debe mostrar solo los números comprados por el cliente', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockParticipaciones)
      })

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(button)
      
      // Texto EXACTO según tu componente
      expect(screen.getByText('Realizando búsqueda de participaciones...')).toBeInTheDocument()
      
      await waitFor(() => {
        expect(screen.getByText('Sorteo Casa Premium')).toBeInTheDocument()
        expect(screen.getByText('Sorteo Auto Deportivo')).toBeInTheDocument()
        expect(screen.getByText('3')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument()
        expect(screen.getByText(/001, 050, 100/i)).toBeInTheDocument()
        expect(screen.getByText(/777, 888/i)).toBeInTheDocument()
      })
    })

    it('Debe formatear números correctamente cuando hay más de 5', async () => {
      const muchosNumeros = [{
        raffle_id: 1,
        raffle_name: 'Sorteo con muchos números',
        raffle_image_url: 'https://example.com/test.jpg',
        details: Array.from({ length: 8 }, (_, i) => ({
          number: String(i + 1).padStart(3, '0'),
          unit_price: '50.00'
        })),
        total_amount: 400.00
      }]

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(muchosNumeros)
      })

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText(/, y 3 más\.\.\./i)).toBeInTheDocument()
        expect(screen.getByText('8')).toBeInTheDocument()
      })
    })

    it('No debe mostrar sorteos sin números', async () => {
      const dataConSorteoVacio = [
        {
          raffle_id: 1,
          raffle_name: 'Sorteo con números',
          raffle_image_url: 'https://example.com/test.jpg',
          details: [{ number: '001', unit_price: '100.00' }],
          total_amount: 100.00
        },
        {
          raffle_id: 2,
          raffle_name: 'Sorteo vacío',
          raffle_image_url: 'https://example.com/test2.jpg',
          details: [],
          total_amount: 0
        }
      ]

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(dataConSorteoVacio)
      })

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('Sorteo con números')).toBeInTheDocument()
        expect(screen.queryByText('Sorteo vacío')).not.toBeInTheDocument()
        expect(screen.getByText(/Sorteos con tu participación \(1\)/i)).toBeInTheDocument()
      })
    })
  })

  describe('Escenario 3: Cliente sin participaciones', () => {
    it('Debe mostrar mensaje cuando no hay participaciones', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify([])
      })

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6629999999')
      await user.click(button)
      
      await waitFor(() => {
        // Textos EXACTOS según tu componente
        expect(screen.getByText('¡Vaya!')).toBeInTheDocument()
        expect(screen.getByText(/No se encontraron boletos asociados al número/i)).toBeInTheDocument()
        expect(screen.getByText(/6629999999/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Ver Sorteos Activos y Participar/i })).toBeInTheDocument()
      })
    })
  })

  describe('Escenario 4: Estados correctos de la UI', () => {
    it('Debe mostrar spinner durante la carga', async () => {
      global.fetch.mockImplementationOnce(
        () => new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            status: 200,
            text: async () => JSON.stringify([])
          }), 100)
        )
      )

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(button)
      
      // El botón muestra "Buscando..." durante carga
      expect(screen.getByText('Buscando...')).toBeInTheDocument()
      expect(screen.getByText('Realizando búsqueda de participaciones...')).toBeInTheDocument()
      
      await waitFor(() => {
        expect(screen.queryByText('Realizando búsqueda de participaciones...')).not.toBeInTheDocument()
      })
    })

    it('Debe mantener el historial de búsquedas', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify([])
      })

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621111111')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText(/6621111111/i)).toBeInTheDocument()
      })
      
      await user.clear(input)
      await user.type(input, '6622222222')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText(/6622222222/i)).toBeInTheDocument()
      })
    })
  })

  describe('Escenario 5: Manejo de errores', () => {
    it('Debe mostrar error cuando el servidor falla', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText(/Ocurrió un error al conectar con el servicio/i)).toBeInTheDocument()
        expect(screen.getByText(/Error al buscar participaciones: 500 Internal Server Error/i)).toBeInTheDocument()
      })
    })

    it('Debe manejar respuesta HTML de error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => '<!DOCTYPE html><html>Error 500</html>'
      })

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText(/El servidor devolvió una página HTML/i)).toBeInTheDocument()
      })
    })

    it('Debe manejar error 404 correctamente', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(button)
      
      // Tu código maneja 404 como respuesta válida (sin error)
      await waitFor(() => {
        // No debería mostrar mensaje de error
        expect(screen.queryByText(/Ocurrió un error al conectar con el servicio/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Escenario 6: Navegación y funcionalidad', () => {
    it('Debe navegar al detalle al hacer clic en el botón', async () => {
      const mockData = [{
        raffle_id: 123,
        raffle_name: 'Sorteo Test Navegación',
        raffle_image_url: 'https://example.com/test.jpg',
        details: [{ number: '001', unit_price: '100.00' }],
        total_amount: 100.00
      }]

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockData)
      })

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('Sorteo Test Navegación')).toBeInTheDocument()
      })
      
      const detalleButton = screen.getByRole('button', { name: 'Ver Detalles del Sorteo' })
      await user.click(detalleButton)
      
      expect(mockNavigate).toHaveBeenCalledWith('/detalle/123')
    })

    it('Debe navegar a rifas activas desde estado sin resultados', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify([])
      })

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(button)
      
      await waitFor(() => {
        const participarButton = screen.getByRole('button', { name: 'Ver Sorteos Activos y Participar' })
        expect(participarButton).toBeInTheDocument()
        
        fireEvent.click(participarButton)
        expect(mockNavigate).toHaveBeenCalledWith('/rifas')
      })
    })
  })

  describe('Escenario 7: Estado inicial', () => {
    it('Debe mostrar mensaje inicial antes de buscar', () => {
      renderComponent()
      
      expect(screen.getByText('Consulta tus Boletos')).toBeInTheDocument()
      expect(screen.getByText(/Ingresa tu teléfono y presiona "Buscar Boletos" para consultar tu estado./i)).toBeInTheDocument()
    })
  })
})