//pruebas TDD del panel personal 
//render, lista de sorteos. numeros y estados
//manejo de estados vacios y errores de carga
// src/service/panel_personal.test.jsx

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import GaleriaParticipacion from '../JSX/GaleriaParticipacion'

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

describe('HU-4: Pruebas TDD Panel Personal', () => {
  const user = userEvent.setup()
  
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
    // Mockear fetch correctamente
    global.fetch = vi.fn()
  })
  
  afterEach(() => {
    vi.resetAllMocks()
  })

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <GaleriaParticipacion />
      </MemoryRouter>
    )
  }

  // ==================== FASE 1: RENDER BÁSICO ====================
  describe('FASE 1: Render básico del componente', () => {
    it('1.1 - Debe renderizar el título principal', () => {
      renderComponent()
      expect(screen.getByText('Consulta tus Boletos')).toBeInTheDocument()
    })

    it('1.2 - Debe renderizar el input para número de teléfono', () => {
      renderComponent()
      expect(screen.getByPlaceholderText('Ej. 6621234567')).toBeInTheDocument()
    })

    it('1.3 - Debe renderizar el botón de búsqueda', () => {
      renderComponent()
      expect(screen.getByRole('button', { name: /buscar boletos/i })).toBeInTheDocument()
    })

    it('1.4 - Debe mostrar mensaje inicial instructivo', () => {
      renderComponent()
      expect(screen.getByText(/Ingresa tu teléfono y presiona "Buscar Boletos" para consultar tu estado./i)).toBeInTheDocument()
    })
  })

  // ==================== FASE 2: LISTA DE SORTEOS ====================
  describe('FASE 2: Renderizado de lista de sorteos', () => {
    const mockSorteos = [
      {
        raffle_id: 1,
        raffle_name: 'Sorteo Casa de Playa',
        raffle_image_url: 'https://example.com/casa.jpg',
        details: [
          { number: '001', unit_price: '100.00' },
          { number: '050', unit_price: '100.00' }
        ],
        total_amount: 200.00
      },
      {
        raffle_id: 2,
        raffle_name: 'Sorteo Automóvil',
        raffle_image_url: 'https://example.com/auto.jpg',
        details: [
          { number: '777', unit_price: '150.00' },
          { number: '888', unit_price: '150.00' },
          { number: '999', unit_price: '150.00' }
        ],
        total_amount: 450.00
      }
    ]

    it('2.1 - Debe mostrar lista de sorteos después de búsqueda exitosa', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockSorteos)
      })

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('Sorteo Casa de Playa')).toBeInTheDocument()
        expect(screen.getByText('Sorteo Automóvil')).toBeInTheDocument()
      })
    })

    it('2.2 - Debe mostrar el total de sorteos encontrados', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockSorteos)
      })

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText(/Sorteos con tu participación \(2\)/i)).toBeInTheDocument()
      })
    })

    it('2.3 - Cada tarjeta debe mostrar la imagen del sorteo', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify([mockSorteos[0]])
      })

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(button)
      
      await waitFor(() => {
        const img = screen.getByAltText('Sorteo Casa de Playa')
        expect(img).toBeInTheDocument()
        expect(img).toHaveAttribute('src', 'https://example.com/casa.jpg')
      })
    })

    it('2.4 - Debe usar imagen por defecto si no hay image_url', async () => {
      const sorteoSinImagen = [{
        raffle_id: 1,
        raffle_name: 'Sorteo sin imagen',
        raffle_image_url: null,
        details: [{ number: '001', unit_price: '100.00' }],
        total_amount: 100.00
      }]

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(sorteoSinImagen)
      })

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(button)
      
      await waitFor(() => {
        const img = screen.getByAltText('Sorteo sin imagen')
        expect(img).toHaveAttribute('src', 'https://placehold.co/300x200/4f46e5/ffffff?text=Tu+Participación')
      })
    })
  })

  // ==================== FASE 3: NÚMEROS Y ESTADOS ====================
  describe('FASE 3: Renderizado de números y estados', () => {
    const mockSorteoConMuchosNumeros = [{
      raffle_id: 1,
      raffle_name: 'Sorteo Ejemplo',
      raffle_image_url: 'https://example.com/test.jpg',
      details: [
        { number: '001', unit_price: '100.00' },
        { number: '002', unit_price: '100.00' },
        { number: '003', unit_price: '100.00' },
        { number: '004', unit_price: '100.00' },
        { number: '005', unit_price: '100.00' },
        { number: '006', unit_price: '100.00' },
        { number: '007', unit_price: '100.00' }
      ],
      total_amount: 700.00
    }]

    it('3.1 - Debe mostrar el total de números apartados por sorteo', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockSorteoConMuchosNumeros)
      })

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('7')).toBeInTheDocument()
        expect(screen.getByText('Total Apartados:')).toBeInTheDocument()
      })
    })

    it('3.2 - Debe mostrar los números comprados (máximo 5 visibles)', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockSorteoConMuchosNumeros)
      })

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText(/001, 002, 003, 004, 005/)).toBeInTheDocument()
        expect(screen.getByText(/, y 2 más\.\.\./)).toBeInTheDocument()
      })
    })

    it('3.3 - Debe mostrar "Ninguno" cuando no hay números', async () => {
      const sorteoSinNumeros = [{
        raffle_id: 1,
        raffle_name: 'Sorteo sin números',
        raffle_image_url: 'https://example.com/test.jpg',
        details: [],
        total_amount: 0
      }]

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(sorteoSinNumeros)
      })

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.queryByText('Sorteo sin números')).not.toBeInTheDocument()
      })
    })

    it('3.4 - Debe calcular correctamente el precio por número', async () => {
      const sorteoConPrecios = [{
        raffle_id: 1,
        raffle_name: 'Sorteo con precio',
        raffle_image_url: 'https://example.com/test.jpg',
        details: [
          { number: '001', unit_price: '150.00' },
          { number: '002', unit_price: '150.00' }
        ],
        total_amount: 300.00
      }]

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(sorteoConPrecios)
      })

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('Sorteo con precio')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument()
      })
    })

    it('3.5 - Debe mostrar estado de "cargando" durante la búsqueda', async () => {
      global.fetch.mockImplementationOnce(
        () => new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            status: 200,
            text: async () => JSON.stringify([])
          }), 200)
        )
      )

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(button)
      
      expect(screen.getByText('Buscando...')).toBeInTheDocument()
      expect(screen.getByText('Realizando búsqueda de participaciones...')).toBeInTheDocument()
      
      await waitFor(() => {
        expect(screen.queryByText('Realizando búsqueda de participaciones...')).not.toBeInTheDocument()
      })
    })
  })

  // ==================== FASE 4: ESTADOS VACÍOS ====================
  describe('FASE 4: Manejo de estados vacíos', () => {
    it('4.1 - Debe mostrar mensaje cuando no hay participaciones', async () => {
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
        expect(screen.getByText('¡Vaya!')).toBeInTheDocument()
        expect(screen.getByText(/No se encontraron boletos asociados al número/i)).toBeInTheDocument()
        expect(screen.getByText('6629999999')).toBeInTheDocument()
      })
    })

    it('4.2 - Debe mostrar botón para ver sorteos activos cuando no hay resultados', async () => {
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
        const botonParticipar = screen.getByRole('button', { name: 'Ver Sorteos Activos y Participar' })
        expect(botonParticipar).toBeInTheDocument()
        
        fireEvent.click(botonParticipar)
        expect(mockNavigate).toHaveBeenCalledWith('/rifas')
      })
    })

    it('4.3 - Debe mostrar estado inicial antes de cualquier búsqueda', () => {
      renderComponent()
      
      expect(screen.getByText(/Ingresa tu teléfono y presiona "Buscar Boletos"/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Ej. 6621234567')).toHaveValue('')
    })

    it('4.4 - Debe limpiar resultados anteriores al hacer nueva búsqueda', async () => {
      const mockSorteos = [{
        raffle_id: 1,
        raffle_name: 'Sorteo Antiguo',
        raffle_image_url: 'https://example.com/test.jpg',
        details: [{ number: '001', unit_price: '100.00' }],
        total_amount: 100.00
      }]

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => JSON.stringify(mockSorteos)
        })
        .mockResolvedValueOnce({
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
        expect(screen.getByText('Sorteo Antiguo')).toBeInTheDocument()
      })
      
      await user.clear(input)
      await user.type(input, '6622222222')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.queryByText('Sorteo Antiguo')).not.toBeInTheDocument()
        expect(screen.getByText('¡Vaya!')).toBeInTheDocument()
      })
    })
  })

  // ==================== FASE 5: ERRORES DE CARGA (CORREGIDAS) ====================
  describe('FASE 5: Manejo de errores de carga', () => {
    it('5.1 - Debe mostrar error cuando el servidor devuelve error 500', async () => {
      // Mock CORREGIDO - Simula exactamente lo que tu componente espera
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => ''
      })

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(button)
      
      await waitFor(() => {
        // Tu componente muestra ESTE mensaje exacto
        expect(screen.getByText('Ocurrió un error al conectar con el servicio: Error al buscar participaciones: 500 Internal Server Error')).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('5.2 - Debe mostrar error cuando el servidor devuelve HTML (error Django)', async () => {
      // Mock para respuesta HTML
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => '<!DOCTYPE html><html><body>Error 500</body></html>'
      })

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(button)
      
      await waitFor(() => {
        // Texto EXACTO que muestra tu componente
        expect(screen.getByText('Ocurrió un error al conectar con el servicio: El servidor devolvió una página HTML (probablemente error 500). Por favor, verifica los logs de tu servidor Django para encontrar la excepción de Python.')).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('5.3 - Debe manejar errores de red (fetch falla)', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network Error'))

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('Ocurrió un error al conectar con el servicio: Network Error')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('5.4 - Debe implementar reintentos automáticos en errores temporales', async () => {
      let callCount = 0
      
      global.fetch.mockImplementation(() => {
        callCount++
        if (callCount < 3) {
          return Promise.resolve({
            ok: false,
            status: 503,
            statusText: 'Service Unavailable',
            text: async () => ''
          })
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => JSON.stringify([])
        })
      })

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(button)
      
      await waitFor(() => {
        expect(callCount).toBeGreaterThan(1)
        expect(screen.getByText('¡Vaya!')).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('5.5 - Debe manejar JSON inválido en la respuesta', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'INVALID JSON {'
      })

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText(/Ocurrió un error al conectar con el servicio/i)).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('5.6 - Debe limpiar errores anteriores al hacer nueva búsqueda', async () => {
      // Primera búsqueda con error
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => ''
      })

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText(/Ocurrió un error al conectar con el servicio/i)).toBeInTheDocument()
      }, { timeout: 3000 })
      
      // Segunda búsqueda exitosa
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify([])
      })
      
      await user.clear(input)
      await user.type(input, '6629999999')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.queryByText(/Ocurrió un error al conectar con el servicio/i)).not.toBeInTheDocument()
        expect(screen.getByText('¡Vaya!')).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  // ==================== FASE 6: NAVEGACIÓN ====================
  describe('FASE 6: Navegación entre componentes', () => {
    it('6.1 - Debe navegar al detalle del sorteo al hacer clic en la tarjeta', async () => {
      const mockSorteo = [{
        raffle_id: 123,
        raffle_name: 'Sorteo Navegable',
        raffle_image_url: 'https://example.com/test.jpg',
        details: [{ number: '001', unit_price: '100.00' }],
        total_amount: 100.00
      }]

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockSorteo)
      })

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('Sorteo Navegable')).toBeInTheDocument()
      })
      
      const tarjeta = screen.getByText('Sorteo Navegable').closest('[class*="cursor-pointer"]')
      fireEvent.click(tarjeta)
      
      expect(mockNavigate).toHaveBeenCalledWith('/detalle/123')
    })

    it('6.2 - Debe navegar al detalle al hacer clic en el botón específico', async () => {
      const mockSorteo = [{
        raffle_id: 456,
        raffle_name: 'Sorteo con Botón',
        raffle_image_url: 'https://example.com/test.jpg',
        details: [{ number: '001', unit_price: '100.00' }],
        total_amount: 100.00
      }]

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockSorteo)
      })

      renderComponent()
      
      const input = screen.getByPlaceholderText('Ej. 6621234567')
      const button = screen.getByRole('button', { name: /buscar boletos/i })
      
      await user.type(input, '6621234567')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('Sorteo con Botón')).toBeInTheDocument()
      })
      
      const botonDetalle = screen.getByRole('button', { name: 'Ver Detalles del Sorteo' })
      await user.click(botonDetalle)
      
      expect(mockNavigate).toHaveBeenCalledWith('/detalle/456')
    })

    it('6.3 - Debe navegar a sorteos activos desde estado sin resultados', async () => {
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
        const botonParticipar = screen.getByRole('button', { name: 'Ver Sorteos Activos y Participar' })
        expect(botonParticipar).toBeInTheDocument()
        
        fireEvent.click(botonParticipar)
        expect(mockNavigate).toHaveBeenCalledWith('/rifas')
      })
    })
  })
})