// src/service/prueba_visual_seleccion.test.jsx
import { describe, test, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import RuffleDetail from '../JSX/RuffleDetail.jsx'

// Mock mínimo
global.fetch = vi.fn()
const mockUseParams = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => mockUseParams(),
  }
})

describe('PRUEBAS VISUALES: Cambios de estado al seleccionar números', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseParams.mockReturnValue({ id: '1' })
    
    // Mock simple de API
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 1,
          name: 'Rifa Test',
          price_per_number: 100,
          number_end: 100, // Solo 100 números (1 centena)
          ticket_price: 100
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ taken_numbers: [5, 10] }) // 2 números ocupados
      })
  })

  test('al abrir una centena se muestran números individuales', async () => {
    render(
      <MemoryRouter>
        <RuffleDetail />
      </MemoryRouter>
    )

    // Esperar a que cargue
    await waitFor(() => {
      expect(screen.getByText('Rifa Test')).toBeInTheDocument()
    })

    // Verificar que existe la tarjeta de centena
    expect(screen.getByText('0 - 99')).toBeInTheDocument()

    // Hacer clic en la tarjeta para abrir modal
    const tarjetaCentena = screen.getByText('0 - 99').closest('.centena-card')
    fireEvent.click(tarjetaCentena)

    // Verificar que se abre el modal con números
    await waitFor(() => {
      expect(screen.getByText('000')).toBeInTheDocument() // Primer número
      expect(screen.getByText('099')).toBeInTheDocument() // Último número
    })
  })

  test('los números cambian visualmente al ser seleccionados', async () => {
    render(
      <MemoryRouter>
        <RuffleDetail />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Rifa Test')).toBeInTheDocument()
    })

    // Abrir modal de números
    const tarjetaCentena = screen.getByText('0 - 99').closest('.centena-card')
    fireEvent.click(tarjetaCentena)

    // Esperar a que carguen los números
    await waitFor(() => {
      expect(screen.getByText('001')).toBeInTheDocument()
    })

    // Encontrar un número libre (no el 005 ni 010 que están ocupados)
    const numeroLibre = screen.getByText('001')
    const botonNumero = numeroLibre.closest('button')

    // VERIFICAR CAMBIO VISUAL 1: Antes de seleccionar
    expect(botonNumero).not.toHaveClass('seleccionado')

    // Seleccionar el número
    fireEvent.click(numeroLibre)

    // VERIFICAR CAMBIO VISUAL 2: Después de seleccionar
    expect(botonNumero).toHaveClass('seleccionado')

    // Deseleccionar
    fireEvent.click(numeroLibre)

    // VERIFICAR CAMBIO VISUAL 3: Después de deseleccionar
    expect(botonNumero).not.toHaveClass('seleccionado')
  })

  test('los números ocupados tienen apariencia diferente', async () => {
    render(
      <MemoryRouter>
        <RuffleDetail />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Rifa Test')).toBeInTheDocument()
    })

    // Abrir modal
    const tarjetaCentena = screen.getByText('0 - 99').closest('.centena-card')
    fireEvent.click(tarjetaCentena)

    // Esperar números
    await waitFor(() => {
      expect(screen.getByText('005')).toBeInTheDocument()
    })

    // VERIFICAR APARIENCIA DE NÚMERO OCUPADO
    const numeroOcupado = screen.getByText('005')
    const botonOcupado = numeroOcupado.closest('button')

    // Debería tener clase 'ocupado'
    expect(botonOcupado).toHaveClass('ocupado')
    
    // Debería estar deshabilitado
    expect(botonOcupado).toBeDisabled()

    // VERIFICAR APARIENCIA DE NÚMERO LIBRE
    const numeroLibre = screen.getByText('001')
    const botonLibre = numeroLibre.closest('button')

    // NO debería tener clase 'ocupado'
    expect(botonLibre).not.toHaveClass('ocupado')
    
    // NO debería estar deshabilitado
    expect(botonLibre).not.toBeDisabled()
  })

  test('la tarjeta de centena refleja visualmente números seleccionados', async () => {
    render(
      <MemoryRouter>
        <RuffleDetail />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Rifa Test')).toBeInTheDocument()
    })

    // Abrir modal
    const tarjetaCentena = screen.getByText('0 - 99').closest('.centena-card')
    fireEvent.click(tarjetaCentena)

    // Seleccionar 2 números
    await waitFor(() => {
      expect(screen.getByText('001')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('001'))
    fireEvent.click(screen.getByText('002'))

    // Cerrar modal
    fireEvent.click(screen.getByText('Listo'))

    // VERIFICAR CAMBIO VISUAL EN TARJETA DE CENTENA
    await waitFor(() => {
      const tarjeta = screen.getByText('0 - 99').closest('.centena-card')
      
      // 1. Debería tener la clase 'has-selection'
      expect(tarjeta).toHaveClass('has-selection')
      
      // 2. Debería mostrar "2 tuyos"
      expect(screen.getByText('2 tuyos')).toBeInTheDocument()
    })
  })

  test('se muestra barra de checkout con selecciones', async () => {
    render(
      <MemoryRouter>
        <RuffleDetail />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Rifa Test')).toBeInTheDocument()
    })

    // Abrir modal y seleccionar
    const tarjetaCentena = screen.getByText('0 - 99').closest('.centena-card')
    fireEvent.click(tarjetaCentena)

    await waitFor(() => {
      expect(screen.getByText('001')).toBeInTheDocument()
    })

    // Seleccionar 3 números
    fireEvent.click(screen.getByText('001'))
    fireEvent.click(screen.getByText('002'))
    fireEvent.click(screen.getByText('003'))

    // Cerrar modal
    fireEvent.click(screen.getByText('Listo'))

    // VERIFICAR BARRA DE CHECKOUT VISUAL
    await waitFor(() => {
      // 1. Debería aparecer la barra
      expect(screen.getByText('Apartar')).toBeInTheDocument()
      
      // 2. Debería mostrar contador
      expect(screen.getByText('3')).toBeInTheDocument()
      
      // 3. Debería mostrar total calculado
      expect(screen.getByText('$300')).toBeInTheDocument() // 3 * 100
    })
  })

  test('no se puede seleccionar visualmente números ocupados', async () => {
    render(
      <MemoryRouter>
        <RuffleDetail />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Rifa Test')).toBeInTheDocument()
    })

    // Abrir modal
    const tarjetaCentena = screen.getByText('0 - 99').closest('.centena-card')
    fireEvent.click(tarjetaCentena)

    await waitFor(() => {
      expect(screen.getByText('005')).toBeInTheDocument() // Número ocupado
    })

    const numeroOcupado = screen.getByText('005')
    const botonOcupado = numeroOcupado.closest('button')

    // Intentar seleccionar (no debería cambiar)
    fireEvent.click(botonOcupado)

    // VERIFICAR QUE SIGUE SIN CLASE 'seleccionado'
    expect(botonOcupado).not.toHaveClass('seleccionado')
    expect(botonOcupado).toHaveClass('ocupado') // Mantiene clase ocupado
  })
})

describe('Pruebas visuales de múltiples selecciones', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseParams.mockReturnValue({ id: '1' })
    
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 1,
          name: 'Rifa Grande',
          price_per_number: 50,
          number_end: 300, // 3 centenas
          ticket_price: 50
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ taken_numbers: [] }) // Todos libres
      })
  })

  test('selección en múltiples centenas refleja visualmente', async () => {
    render(
      <MemoryRouter>
        <RuffleDetail />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Rifa Grande')).toBeInTheDocument()
    })

    // VERIFICAR QUE HAY 3 TARJETAS DE CENTENA
    expect(screen.getByText('0 - 99')).toBeInTheDocument()
    expect(screen.getByText('100 - 199')).toBeInTheDocument()
    expect(screen.getByText('200 - 299')).toBeInTheDocument()

    // Seleccionar en primera centena
    const tarjeta1 = screen.getByText('0 - 99').closest('.centena-card')
    fireEvent.click(tarjeta1)

    await waitFor(() => {
      expect(screen.getByText('020')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('020'))
    fireEvent.click(screen.getByText('021'))
    fireEvent.click(screen.getByText('Listo'))

    // Seleccionar en segunda centena
    const tarjeta2 = screen.getByText('100 - 199').closest('.centena-card')
    fireEvent.click(tarjeta2)

    await waitFor(() => {
      expect(screen.getByText('120')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('120'))
    fireEvent.click(screen.getByText('Listo'))

    // VERIFICAR VISUALMENTE:
    // 1. Ambas tarjetas deberían tener 'has-selection'
    await waitFor(() => {
      const tarjeta1Actual = screen.getByText('0 - 99').closest('.centena-card')
      const tarjeta2Actual = screen.getByText('100 - 199').closest('.centena-card')
      
      expect(tarjeta1Actual).toHaveClass('has-selection')
      expect(tarjeta2Actual).toHaveClass('has-selection')
      
      // 2. Deberían mostrar sus contadores
      expect(screen.getByText('2 tuyos')).toBeInTheDocument() // Primera centena
      expect(screen.getByText('1 tuyos')).toBeInTheDocument() // Segunda centena
      
      // 3. Barra de checkout debería mostrar total
      expect(screen.getByText('3')).toBeInTheDocument() // Total selecciones
      expect(screen.getByText('$150')).toBeInTheDocument() // 3 * 50
    })
  })
})