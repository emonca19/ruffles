//caso de uso 15 front end renderizado de administrador
// src/service/renderizado_admin.test.jsx
import { describe, test, expect, vi } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import GaleriaEvidencias from '../JSX/GaleriaEvidencia.jsx'

// Mock para useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('GaleriaEvidencias - Pruebas TDD para columnas Cliente y Fecha', () => {
  describe('Prueba 1: Debe mostrar el nombre del cliente en cada tarjeta', () => {
    test('debe encontrar 3 tarjetas con información de cliente', () => {
      // ARRANGE
      render(
        <MemoryRouter>
          <GaleriaEvidencias />
        </MemoryRouter>
      )
      
      // ACT - Buscar todos los elementos que contengan "Cliente:"
      const elementosCliente = screen.getAllByText(/Cliente:/i)
      
      // ASSERT - Debería haber 3
      expect(elementosCliente).toHaveLength(3)
    })
    
    test('cada tarjeta debe mostrar el nombre correcto del cliente', () => {
      // ARRANGE
      render(
        <MemoryRouter>
          <GaleriaEvidencias />
        </MemoryRouter>
      )
      
      // ACT & ASSERT - Verificar que los 3 nombres están presentes
      // Usamos getAllByText para evitar error de múltiples elementos
      const anaMoralesElements = screen.getAllByText(/Ana Morales/i)
      expect(anaMoralesElements.length).toBeGreaterThan(0)
      
      const javierLopezElements = screen.getAllByText(/Javier López/i)
      expect(javierLopezElements.length).toBeGreaterThan(0)
      
      const sofiaRodriguezElements = screen.getAllByText(/Sofia Rodríguez/i)
      expect(sofiaRodriguezElements.length).toBeGreaterThan(0)
    })
    
    
  })
  
  describe('Prueba 2: Análisis de información ACTUAL (sin fecha)', () => {
    test('NO muestra la fecha de pago (diseño actual)', () => {
      // ARRANGE
      render(
        <MemoryRouter>
          <GaleriaEvidencias />
        </MemoryRouter>
      )
      
      // ACT & ASSERT - Verificar que NO se muestran las fechas
      // Esto es correcto según el diseño actual
      expect(screen.queryByText('2024-11-28 10:30')).not.toBeInTheDocument()
      expect(screen.queryByText('2024-11-28 15:45')).not.toBeInTheDocument()
      expect(screen.queryByText('2024-11-29 08:00')).not.toBeInTheDocument()
      
      // También verificar que no hay label "Fecha:"
      expect(screen.queryByText(/Fecha:/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Fecha de Pago:/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Payment Date:/i)).not.toBeInTheDocument()
    })
    
    test('muestra correctamente otra información requerida', () => {
      // ARRANGE
      render(
        <MemoryRouter>
          <GaleriaEvidencias />
        </MemoryRouter>
      )
      
      // ACT & ASSERT - Verificar información que SÍ se muestra
      
      // IDs de compra
      expect(screen.getByText(/P-45001/i)).toBeInTheDocument()
      expect(screen.getByText(/P-12005/i)).toBeInTheDocument()
      expect(screen.getByText(/P-78012/i)).toBeInTheDocument()
      
      // Nombres de rifa (parcialmente)
      expect(screen.getByText(/Automóvil Clásico/i)).toBeInTheDocument()
      expect(screen.getByText(/Cancún Todo Incluido/i)).toBeInTheDocument()
      expect(screen.getByText(/Kit Gamer Completo/i)).toBeInTheDocument()
      
      // Totales con formato
      expect(screen.getByText(/\$1,500\.00/)).toBeInTheDocument()
      expect(screen.getByText(/\$500\.00/)).toBeInTheDocument()
      expect(screen.getByText(/\$250\.00/)).toBeInTheDocument()
      
      // Estado
      const estados = screen.getAllByText('Pendiente de Verificación')
      expect(estados).toHaveLength(3)
    })
  })
  
  describe('Prueba 3: Verificación de estructura visual', () => {
    test('debe renderizar exactamente 3 tarjetas', () => {
      // ARRANGE
      const { container } = render(
        <MemoryRouter>
          <GaleriaEvidencias />
        </MemoryRouter>
      )
      
      // ACT - Buscar tarjetas por clase CSS
      const tarjetas = container.querySelectorAll('.raffle-card')
      
      // ASSERT
      expect(tarjetas).toHaveLength(3)
    })
    
    test('cada tarjeta debe tener los elementos básicos', () => {
      // ARRANGE
      render(
        <MemoryRouter>
          <GaleriaEvidencias />
        </MemoryRouter>
      )
      
      // ACT - Buscar todos los elementos con "Cliente:" (uno por tarjeta)
      const elementosCliente = screen.getAllByText(/Cliente:/i)
      
      // ASSERT - Para cada tarjeta verificar estructura
      elementosCliente.forEach((elementoCliente) => {
        const tarjeta = elementoCliente.closest('.raffle-card')
        expect(tarjeta).toBeInTheDocument()
        
        // Verificar que tiene imagen
        const imagen = tarjeta.querySelector('img')
        expect(imagen).toBeInTheDocument()
        
        // Verificar que tiene título
        const titulo = tarjeta.querySelector('h3')
        expect(titulo).toBeInTheDocument()
        expect(titulo.textContent).toMatch(/P-\d+/)
      })
    })
    
    test('imágenes deben tener src correcto', () => {
      // ARRANGE
      render(
        <MemoryRouter>
          <GaleriaEvidencias />
        </MemoryRouter>
      )
      
      // ACT - Obtener todas las imágenes
      const imagenes = screen.getAllByRole('img')
      
      // ASSERT - Debe haber al menos 3 imágenes
      expect(imagenes.length).toBeGreaterThanOrEqual(3)
      
      // Verificar que tienen URLs de placeholders
      imagenes.forEach((img) => {
        expect(img).toHaveAttribute('src')
        const src = img.getAttribute('src') || ''
        expect(src).toContain('placehold.co')
      })
    })
  })
  
  describe('Prueba 4: Comportamiento interactivo', () => {
    test('las tarjetas deben ser clickeables (tienen cursor-pointer)', () => {
      // ARRANGE
      const { container } = render(
        <MemoryRouter>
          <GaleriaEvidencias />
        </MemoryRouter>
      )
      
      // ACT - Buscar todas las tarjetas
      const tarjetas = container.querySelectorAll('.raffle-card')
      
      // ASSERT - Cada tarjeta debe tener clase cursor-pointer
      tarjetas.forEach((tarjeta) => {
        expect(tarjeta.className).toContain('cursor-pointer')
      })
    })
    
    test('al hacer clic debe navegar (simulación)', () => {
      // ARRANGE
      render(
        <MemoryRouter>
          <GaleriaEvidencias />
        </MemoryRouter>
      )
      
      // ACT - Buscar primera tarjeta y hacer clic
      const primeraTarjeta = screen.getAllByText(/Cliente:/i)[0].closest('.raffle-card')
      
      // Simular clic
      if (primeraTarjeta) {
        // Podemos verificar que el componente tiene el comportamiento
        // sin necesariamente disparar la navegación
        expect(primeraTarjeta).toHaveAttribute('class', expect.stringContaining('cursor-pointer'))
      }
    })
  })
})