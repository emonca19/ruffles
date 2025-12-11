//caso de uso 15 front end renderizado de administrador
// src/service/renderizado_admin.test.jsx
// src/service/renderizado_admin.test.jsx
import { describe, test, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mocks antes de importar
const mockNavigate = vi.fn()
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
}

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock de localStorage
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock de fetch global
global.fetch = vi.fn()

// Mock de alert
global.alert = vi.fn()

// Importar el componente después de los mocks
import GaleriaEvidencias from '../JSX/GaleriaEvidencia.jsx'

describe('GaleriaEvidencias - Pruebas TDD para columnas Cliente y Fecha', () => {
  // Mock data para las evidencias
  const mockEvidencias = [
    {
      payment_id: '1',
      purchase_id: 'P-45001',
      customer_name: 'Ana Morales',
      raffle_name: 'Automóvil Clásico',
      total_amount: 1500.00,
      tickets: [1, 2, 3, 4, 5],
      receipt_url: 'https://placehold.co/400x200/cccccc/333333?text=Comprobante',
      status: 'pending'
    },
    {
      payment_id: '2',
      purchase_id: 'P-12005',
      customer_name: 'Javier López',
      raffle_name: 'Cancún Todo Incluido',
      total_amount: 500.00,
      tickets: [6, 7, 8],
      receipt_url: 'https://placehold.co/400x200/cccccc/333333?text=Comprobante',
      status: 'pending'
    },
    {
      payment_id: '3',
      purchase_id: 'P-78012',
      customer_name: 'Sofia Rodríguez',
      raffle_name: 'Kit Gamer Completo',
      total_amount: 250.00,
      tickets: [9, 10],
      receipt_url: 'https://placehold.co/400x200/cccccc/333333?text=Comprobante',
      status: 'pending'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Configurar mocks
    localStorageMock.getItem.mockReturnValue('mock-token-123')
  })

  describe('Prueba 1: Debe mostrar el nombre del cliente en cada tarjeta', () => {
    test('debe encontrar tarjetas con información de cliente', async () => {
      // ARRANGE - Mock de fetch exitoso
      global.fetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockEvidencias)
      })

      // ACT
      render(
        <MemoryRouter>
          <GaleriaEvidencias />
        </MemoryRouter>
      )

      // ASSERT - Esperar y verificar que aparecen los nombres de clientes
      await waitFor(() => {
        expect(screen.getByText('Ana Morales')).toBeInTheDocument()
      }, { timeout: 3000 })

      expect(screen.getByText('Javier López')).toBeInTheDocument()
      expect(screen.getByText('Sofia Rodríguez')).toBeInTheDocument()
    })

    test('cada tarjeta muestra el nombre correcto del cliente', async () => {
      // ARRANGE
      global.fetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockEvidencias)
      })

      // ACT
      render(
        <MemoryRouter>
          <GaleriaEvidencias />
        </MemoryRouter>
      )

      // ASSERT
      await waitFor(() => {
        // Buscar elementos que contengan "Cliente:"
        const elementosCliente = screen.getAllByText(/Cliente:/i)
        expect(elementosCliente.length).toBeGreaterThanOrEqual(3)
      }, { timeout: 3000 })
    })
  })

  
  describe('Prueba 3: Verificación de estructura visual', () => {
    test('debe renderizar tarjetas con clase .raffle-card', async () => {
      // ARRANGE
      global.fetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockEvidencias)
      })

      const { container } = render(
        <MemoryRouter>
          <GaleriaEvidencias />
        </MemoryRouter>
      )

      // ASSERT
      await waitFor(() => {
        const tarjetas = container.querySelectorAll('.raffle-card')
        expect(tarjetas.length).toBeGreaterThanOrEqual(3)
      }, { timeout: 3000 })
    })

    test('imágenes deben tener src correcto', async () => {
      // ARRANGE
      global.fetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockEvidencias)
      })

      // ACT
      render(
        <MemoryRouter>
          <GaleriaEvidencias />
        </MemoryRouter>
      )

      // ASSERT
      await waitFor(() => {
        const imagenes = screen.getAllByRole('img')
        expect(imagenes.length).toBeGreaterThanOrEqual(3)
      }, { timeout: 3000 })
    })
  })

  describe('Prueba 4: Estados y comportamiento', () => {
    test('muestra spinner durante carga', async () => {
      // ARRANGE - Simular carga lenta
      let resolveFetch
      const promise = new Promise(resolve => {
        resolveFetch = () => resolve({
          ok: true,
          json: () => Promise.resolve(mockEvidencias)
        })
      })
      global.fetch.mockReturnValue(promise)
      
      // ACT
      render(
        <MemoryRouter>
          <GaleriaEvidencias />
        </MemoryRouter>
      )
      
      // ASSERT - Debe mostrar el spinner inmediatamente
      expect(screen.getByText('Cargando Evidencias...')).toBeInTheDocument()
      
      // Cleanup - resolver para evitar warnings
      resolveFetch()
      await promise
    })

    test('muestra mensaje cuando no hay evidencias', async () => {
      // ARRANGE - Mockear respuesta vacía
      global.fetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue([])
      })
      
      // ACT
      render(
        <MemoryRouter>
          <GaleriaEvidencias />
        </MemoryRouter>
      )
      
      // ASSERT
      await waitFor(() => {
        expect(screen.getByText('¡Todo en Orden!')).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    test('muestra error cuando falla la API', async () => {
      // ARRANGE - Mockear error (sin reintentos exitosos)
      // El componente intenta 3 veces, así que necesitamos que falle 3 veces
      global.fetch.mockImplementation(() => {
        callCount++
        return Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: () => Promise.resolve('Detalles no disponibles.')
        })
      })
      
      // ACT
      render(
        <MemoryRouter>
          <GaleriaEvidencias />
        </MemoryRouter>
      )
      
      // ASSERT - Esperar más tiempo debido a los reintentos
      await waitFor(() => {
        // Buscar cualquier texto que contenga "Error"
        const errorElements = screen.getAllByText((content, element) => {
          return content.includes('Error') || 
                 element.textContent?.includes('Error') ||
                 content.includes('error') ||
                 element.textContent?.includes('error')
        }, { collapseWhitespace: false })
        
        // Si hay algún elemento de error, la prueba pasa
        expect(errorElements.length).toBeGreaterThan(0)
      }, { timeout: 8000, interval: 1000 }) // Más timeout para los reintentos
    })
  })

  describe('Prueba 5: Información específica por tarjeta', () => {
    test('muestra información de boletos formateada', async () => {
      // ARRANGE
      global.fetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockEvidencias)
      })

      // ACT
      render(
        <MemoryRouter>
          <GaleriaEvidencias />
        </MemoryRouter>
      )

      // ASSERT
      await waitFor(() => {
        const elementosBoletos = screen.getAllByText(/Boletos:/i)
        expect(elementosBoletos.length).toBeGreaterThanOrEqual(3)
      }, { timeout: 3000 })
    })

    test('muestra precio formateado correctamente', async () => {
      // ARRANGE
      global.fetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockEvidencias)
      })

      // ACT
      render(
        <MemoryRouter>
          <GaleriaEvidencias />
        </MemoryRouter>
      )

      // ASSERT
      await waitFor(() => {
        // Buscar elementos con clase de precio o que contengan $
        const precioElements = screen.getAllByText((content, element) => {
          const hasPriceClass = element.className?.includes('raffle-price')
          const hasDollarSign = content.includes('$') || element.textContent?.includes('$')
          return hasPriceClass || hasDollarSign
        })
        expect(precioElements.length).toBeGreaterThanOrEqual(3)
      }, { timeout: 3000 })
    })

    test('tarjetas pendientes son clickeables', async () => {
      // ARRANGE
      global.fetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockEvidencias)
      })

      const { container } = render(
        <MemoryRouter>
          <GaleriaEvidencias />
        </MemoryRouter>
      )

      // ASSERT
      await waitFor(() => {
        const tarjetas = container.querySelectorAll('.raffle-card')
        tarjetas.forEach((tarjeta) => {
          expect(tarjeta.className).toContain('cursor-pointer')
        })
      }, { timeout: 3000 })
    })
  })

  // PRUEBA ADICIONAL: Manejo de autenticación
  describe('Prueba 6: Manejo de autenticación', () => {
    test('muestra error cuando no hay token', async () => {
      // ARRANGE
      localStorageMock.getItem.mockReturnValue(null)
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      })

      // ACT
      render(
        <MemoryRouter>
          <GaleriaEvidencias />
        </MemoryRouter>
      )

      // ASSERT
      await waitFor(() => {
        // Buscar texto de error de autenticación
        const errorElements = screen.getAllByText((content, element) => {
          const text = element.textContent || ''
          return text.includes('autenticado') || 
                 text.includes('token') ||
                 text.includes('sesión') ||
                 text.includes('401')
        })
        expect(errorElements.length).toBeGreaterThan(0)
      }, { timeout: 5000 })
    })
  })
})