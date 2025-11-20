// src/service/tablaNumeros.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import RuffleDetail from '../JSX/RuffleDetail';
import '@testing-library/jest-dom';

// Mock del CSS
vi.mock('../CSS/RuffleDetail.css', () => ({}));

describe('PRUEBAS TABLA DE NÚMEROS - 5 Puntos Clave', () => {
  
  // Mocks globales
  const mockFetch = vi.fn();
  const mockLocalStorage = {
    getItem: vi.fn(() => 'fake-token-123'),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  // Datos mock para las pruebas
  const mockNumerosData = {
    numbers: [
      { id: 1, number: '001', status: 'available', price: 50 },
      { id: 2, number: '002', status: 'available', price: 50 },
      { id: 3, number: '003', status: 'taken', price: 50 },
      { id: 4, number: '004', status: 'reserved', price: 50 },
      { id: 5, number: '005', status: 'available', price: 50 },
    ],
    total: 15,
    page: 1,
    total_pages: 3,
    page_size: 5
  };

  const mockEmptyData = {
    numbers: [],
    total: 0,
    page: 1,
    total_pages: 0,
    page_size: 5
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    vi.stubGlobal('localStorage', mockLocalStorage);
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // 1. RENDERING CORRECTO DE LA GRILLA
  describe('1. Rendering de la grilla en todos los estados', () => {

    test('renderiza tabla con datos correctamente', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNumerosData
      });

      render(<TablaNumeros sorteoId="1" />);

      // Verificar loading inicial
      expect(screen.getByText(/cargando números/i)).toBeInTheDocument();

      await waitFor(() => {
        // Verificar que se renderizan los números
        expect(screen.getByText('001')).toBeInTheDocument();
        expect(screen.getByText('002')).toBeInTheDocument();
        expect(screen.getByText('003')).toBeInTheDocument();
        
        // Verificar estados visuales
        expect(screen.getByText('001')).toHaveClass('available');
        expect(screen.getByText('003')).toHaveClass('taken');
        expect(screen.getByText('004')).toHaveClass('reserved');
      });
    });

    test('renderiza estado de loading correctamente', () => {
      // Mock que nunca resuelve para mantener loading
      mockFetch.mockImplementation(() => new Promise(() => {}));

      render(<TablaNumeros sorteoId="1" />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText(/cargando números/i)).toBeInTheDocument();
    });

    test('renderiza estado de error correctamente', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Error de servidor'));

      render(<TablaNumeros sorteoId="1" />);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByText(/error al cargar los números/i)).toBeInTheDocument();
        expect(screen.getByText(/reintentar/i)).toBeInTheDocument();
      });
    });

    test('renderiza diferentes estados de números correctamente', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNumerosData
      });

      render(<TablaNumeros sorteoId="1" />);

      await waitFor(() => {
        // Número disponible - debe ser clickeable
        const disponible = screen.getByText('001');
        expect(disponible).toBeEnabled();
        expect(disponible).toHaveClass('available');

        // Número ocupado - debe estar deshabilitado
        const ocupado = screen.getByText('003');
        expect(ocupado).toBeDisabled();
        expect(ocupado).toHaveClass('taken');

        // Número reservado - debe estar deshabilitado
        const reservado = screen.getByText('004');
        expect(reservado).toBeDisabled();
        expect(reservado).toHaveClass('reserved');
      });
    });
  });

  // 2. PAGINACIÓN Y ESTADOS VISUALES
  describe('2. Paginación y estados visuales', () => {

    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNumerosData
      });

      render(<TablaNumeros sorteoId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('001')).toBeInTheDocument();
      });
    });

    test('muestra controles de paginación correctamente', () => {
      expect(screen.getByTestId('pagination-info')).toHaveTextContent('Página 1 de 3');
      expect(screen.getByText(/anterior/i)).toBeInTheDocument();
      expect(screen.getByText(/siguiente/i)).toBeInTheDocument();
    });

    test('cambia de página correctamente', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockNumerosData,
          page: 2,
          numbers: [
            { id: 6, number: '006', status: 'available', price: 50 },
            { id: 7, number: '007', status: 'available', price: 50 },
          ]
        })
      });

      fireEvent.click(screen.getByText(/siguiente/i));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('page=2'),
          expect.any(Object)
        );
        expect(screen.getByTestId('pagination-info')).toHaveTextContent('Página 2 de 3');
      });
    });

    test('deshabilita botones de paginación en límites', () => {
      // En primera página, "Anterior" debe estar deshabilitado
      expect(screen.getByText(/anterior/i)).toBeDisabled();
      expect(screen.getByText(/siguiente/i)).not.toBeDisabled();
    });

    test('muestra loading durante cambio de página', async () => {
      mockFetch.mockImplementationOnce(() => new Promise(() => {}));

      fireEvent.click(screen.getByText(/siguiente/i));

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    test('maneja errores durante paginación', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Error de paginación'));

      fireEvent.click(screen.getByText(/siguiente/i));

      await waitFor(() => {
        expect(screen.getByText(/error al cargar la página/i)).toBeInTheDocument();
      });
    });
  });

  // 3. MENSAJE CLARO SI HAY 0 NÚMEROS
  describe('3. Mensaje claro cuando hay 0 números', () => {

    test('muestra mensaje descriptivo para estado vacío', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmptyData
      });

      render(<TablaNumeros sorteoId="1" />);

      await waitFor(() => {
        const emptyState = screen.getByTestId('empty-state');
        expect(emptyState).toBeInTheDocument();
        
        expect(screen.getByText(/no hay números disponibles/i)).toBeInTheDocument();
        expect(screen.getByText(/todos los números han sido ocupados/i)).toBeInTheDocument();
        expect(screen.getByText(/vuelve más tarde/i)).toBeInTheDocument();
      });
    });

    test('muestra estado vacío diferente para búsquedas sin resultados', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmptyData
      });

      render(<TablaNumeros sorteoId="1" busqueda="999" />);

      await waitFor(() => {
        expect(screen.getByText(/no se encontraron números/i)).toBeInTheDocument();
        expect(screen.getByText(/no hay números que coincidan con "999"/i)).toBeInTheDocument();
      });
    });

    test('incluye icono ilustrativo en estado vacío', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmptyData
      });

      render(<TablaNumeros sorteoId="1" />);

      await waitFor(() => {
        expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
      });
    });
  });

  // 4. INTERACCIÓN Y SELECCIÓN
  describe('4. Interacción y selección de números', () => {

    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNumerosData
      });

      render(<TablaNumeros sorteoId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('001')).toBeInTheDocument();
      });
    });

    test('permite seleccionar números disponibles', () => {
      const numeroDisponible = screen.getByText('001');
      
      fireEvent.click(numeroDisponible);

      expect(numeroDisponible).toHaveClass('selected');
      expect(screen.getByTestId('selected-count')).toHaveTextContent('1 seleccionado');
    });

    test('no permite seleccionar números ocupados', () => {
      const numeroOcupado = screen.getByText('003');
      
      fireEvent.click(numeroOcupado);

      expect(numeroOcupado).not.toHaveClass('selected');
    });

    test('permite deseleccionar números', () => {
      const numero = screen.getByText('001');
      
      // Seleccionar
      fireEvent.click(numero);
      expect(numero).toHaveClass('selected');
      
      // Deseleccionar
      fireEvent.click(numero);
      expect(numero).not.toHaveClass('selected');
    });

    test('calcula y muestra total correctamente', () => {
      // Seleccionar dos números de $50 cada uno
      fireEvent.click(screen.getByText('001'));
      fireEvent.click(screen.getByText('002'));

      expect(screen.getByTestId('total-amount')).toHaveTextContent('$100');
    });

    test('muestra loading durante reserva', async () => {
      mockFetch.mockImplementationOnce(() => new Promise(() => {}));

      fireEvent.click(screen.getByText('001'));
      fireEvent.click(screen.getByText(/reservar números/i));

      expect(screen.getByTestId('reserve-loading')).toBeInTheDocument();
      expect(screen.getByText(/procesando reserva/i)).toBeInTheDocument();
    });
  });

  // 5. MANEJO DE ERRORES Y LOGS
  describe('5. Manejo de errores y logs para Jira', () => {

    const mockConsoleLog = vi.spyOn(console, 'log');

    afterEach(() => {
      mockConsoleLog.mockClear();
    });

    test('loguea error crítico para Jira', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API_TIMEOUT'));

      render(<TablaNumeros sorteoId="1" />);

      await waitFor(() => {
        expect(mockConsoleLog).toHaveBeenCalledWith(
          'JIRA_LOG: ERROR_CRITICO - TablaNumeros',
          expect.objectContaining({
            error: 'API_TIMEOUT',
            component: 'TablaNumeros',
            sorteoId: '1'
          })
        );
      });
    });

    test('loguea estado vacío para análisis', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmptyData
      });

      render(<TablaNumeros sorteoId="1" />);

      await waitFor(() => {
        expect(mockConsoleLog).toHaveBeenCalledWith(
          'JIRA_LOG: EMPTY_STATE_DETECTED',
          expect.objectContaining({
            sorteoId: '1',
            totalNumbers: 0,
            component: 'TablaNumeros'
          })
        );
      });
    });

    test('loguea problemas de paginación', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNumerosData
      });

      render(<TablaNumeros sorteoId="1" />);

      await waitFor(() => {
        expect(screen.getByText('001')).toBeInTheDocument();
      });

      mockFetch.mockRejectedValueOnce(new Error('PAGINATION_ERROR'));
      
      fireEvent.click(screen.getByText(/siguiente/i));

      await waitFor(() => {
        expect(mockConsoleLog).toHaveBeenCalledWith(
          'JIRA_LOG: PAGINATION_FAILURE',
          expect.objectContaining({
            error: 'PAGINATION_ERROR',
            page: 2,
            sorteoId: '1'
          })
        );
      });
    });

    test('maneja error de reserva y loguea para Jira', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNumerosData
      });

      render(<TablaNumeros sorteoId="1" />);

      await waitFor(() => {
        expect(screen.getByText('001')).toBeInTheDocument();
      });

      mockFetch.mockRejectedValueOnce(new Error('RESERVE_FAILED'));

      fireEvent.click(screen.getByText('001'));
      fireEvent.click(screen.getByText(/reservar números/i));

      await waitFor(() => {
        expect(mockConsoleLog).toHaveBeenCalledWith(
          'JIRA_LOG: RESERVATION_ERROR',
          expect.objectContaining({
            error: 'RESERVE_FAILED',
            selectedNumbers: ['001'],
            sorteoId: '1'
          })
        );
      });
    });
  });
});