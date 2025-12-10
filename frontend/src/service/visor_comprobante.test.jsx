//pruebas TDD para el comprobante 
// src/service/visor_comprobante.test.jsx
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import DetalleComprobante from '../JSX/DetalleComprobante.jsx'

// Mocks básicos
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useLocation: vi.fn(),
    useNavigate: vi.fn(),
  }
})

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: { getItem: vi.fn() }
})

global.fetch = vi.fn()
global.alert = vi.fn()

// Datos de prueba
const mockEvidencia = {
  payment_id: '123',
  purchase_id: 'PUR-456',
  customer_name: 'Juan Pérez',
  raffle_name: 'Rifa Navideña',
  payment_date: '2024-12-01',
  total_amount: 1500.00,
  tickets: [1, 2, 3],
  receipt_url: 'https://example.com/receipt.jpg',
  status: 'pending',
}

describe('HU-17: Visor de Comprobante - Botones Aprobar/Rechazar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useLocation.mockReturnValue({ state: { evidencia: { ...mockEvidencia } } })
    useNavigate.mockReturnValue(vi.fn())
    window.localStorage.getItem.mockReturnValue('token-123')
  })

  // ========== PRUEBA 1: IMAGEN DEL COMPROBANTE ==========
  describe('1. Muestra imagen del comprobante', () => {
    it('muestra la imagen con atributos correctos', () => {
      render(
        <MemoryRouter>
          <DetalleComprobante />
        </MemoryRouter>
      )
      
      const img = screen.getByAltText(`Comprobante de ${mockEvidencia.customer_name}`)
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', mockEvidencia.receipt_url)
      expect(img).toHaveClass('detail-image')
    })
  })

  // ========== PRUEBA 2: BOTONES CUANDO ESTÁ PENDIENTE ==========
  describe('2. Botones cuando estado es pendiente', () => {
    it('muestra botones Aprobar y Rechazar', () => {
      useLocation.mockReturnValue({
        state: { evidencia: { ...mockEvidencia, status: 'pending' } }
      })
      
      render(
        <MemoryRouter>
          <DetalleComprobante />
        </MemoryRouter>
      )
      
      expect(screen.getByText('Aprobar Pago')).toBeInTheDocument()
      expect(screen.getByText('Rechazar Pago')).toBeInTheDocument()
    })

    it('los botones tienen estilos correctos', () => {
      useLocation.mockReturnValue({
        state: { evidencia: { ...mockEvidencia, status: 'pending' } }
      })
      
      render(
        <MemoryRouter>
          <DetalleComprobante />
        </MemoryRouter>
      )
      
      const aprobarBtn = screen.getByText('Aprobar Pago')
      const rechazarBtn = screen.getByText('Rechazar Pago')
      
      expect(aprobarBtn).toHaveClass('apartar-btn')
      expect(rechazarBtn).toHaveClass('apartar-btn')
    })
  })

  // ========== PRUEBA 3: BOTONES CUANDO NO ESTÁ PENDIENTE ==========
  describe('3. Botones cuando NO está pendiente', () => {
    it('NO muestra botones cuando estado es APROBADO', () => {
      useLocation.mockReturnValue({
        state: { evidencia: { ...mockEvidencia, status: 'approved' } }
      })
      
      render(
        <MemoryRouter>
          <DetalleComprobante />
        </MemoryRouter>
      )
      
      expect(screen.queryByText('Aprobar Pago')).not.toBeInTheDocument()
      expect(screen.queryByText('Rechazar Pago')).not.toBeInTheDocument()
    })

    it('NO muestra botones cuando estado es RECHAZADO', () => {
      useLocation.mockReturnValue({
        state: { evidencia: { ...mockEvidencia, status: 'rejected' } }
      })
      
      render(
        <MemoryRouter>
          <DetalleComprobante />
        </MemoryRouter>
      )
      
      expect(screen.queryByText('Aprobar Pago')).not.toBeInTheDocument()
      expect(screen.queryByText('Rechazar Pago')).not.toBeInTheDocument()
    })
  })

  // ========== PRUEBA 4: FUNCIONALIDAD APROBAR ==========
  describe('4. Funcionalidad Aprobar', () => {
    it('llama a la API al hacer click en Aprobar', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ status: 'approved' })
      }
      global.fetch.mockResolvedValue(mockResponse)
      
      render(
        <MemoryRouter>
          <DetalleComprobante />
        </MemoryRouter>
      )
      
      const aprobarButton = screen.getByText('Aprobar Pago')
      fireEvent.click(aprobarButton)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1)
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:8000/api/v1/purchases/verifications/123/verify/',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ action: 'approve' })
          })
        )
      })
    })

   
  })

  // ========== PRUEBA 5: FUNCIONALIDAD RECHAZAR ==========
  describe('5. Funcionalidad Rechazar', () => {
    it('llama a la API al hacer click en Rechazar', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ status: 'rejected' })
      }
      global.fetch.mockResolvedValue(mockResponse)
      
      render(
        <MemoryRouter>
          <DetalleComprobante />
        </MemoryRouter>
      )
      
      const rechazarButton = screen.getByText('Rechazar Pago')
      fireEvent.click(rechazarButton)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1)
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:8000/api/v1/purchases/verifications/123/verify/',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ action: 'reject' })
          })
        )
      })
    })
  })

  // ========== PRUEBA 6: MANEJO DE ERRORES ==========
  describe('6. Manejo de errores', () => {
    it('muestra error cuando no hay token', async () => {
      window.localStorage.getItem.mockReturnValue(null)
      
      render(
        <MemoryRouter>
          <DetalleComprobante />
        </MemoryRouter>
      )
      
      const aprobarButton = screen.getByText('Aprobar Pago')
      fireEvent.click(aprobarButton)
      
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Error de Autenticación. Por favor, inicie sesión.')
      })
    })
  })
})
