// src/service/tablaNumeros.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RuffleDetail from '../JSX/RuffleDetail';
import '@testing-library/jest-dom';

// Mock del CSS
vi.mock('../CSS/RuffleDetail.css', () => ({}));

describe('PRUEBAS TABLA DE NÚMEROS (RuffleDetail) - 5 Puntos Clave', () => {

  // Mocks globales
  const mockFetch = vi.fn();
  const mockLocalStorage = {
    getItem: vi.fn(() => 'fake-token-123'),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  const mockRaffleData = {
    id: 1,
    name: "Rifa Test",
    image: "http://test.com/img.jpg",
    price_per_number: 50,
    number_end: 15, // total numbers
    sale_end_at: new Date().toISOString(),
    draw_scheduled_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    vi.stubGlobal('localStorage', mockLocalStorage);
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const renderComponent = (id = "1") => {
    render(
      <MemoryRouter initialEntries={[`/raffles/${id}`]}>
        <Routes>
          <Route path="/raffles/:id" element={<RuffleDetail />} />
        </Routes>
      </MemoryRouter>
    );
  };

  // 1. RENDERING CORRECTO DE LA GRILLA
  describe('1. Rendering de la grilla en todos los estados', () => {

    test('renderiza tabla con datos correctamente', async () => {
      // Mock Ruffle Details
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRaffleData,
        headers: { get: () => "application/json" }
      });
      // Mock Availability
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ taken_numbers: [3] }) // 003 is taken
      });

      renderComponent();

      // RuffleDetail shows spinner initially
      // expect(screen.getByText(/loading/i)).toBeInTheDocument(); 

      await waitFor(() => {
        // RuffleDetail renders "centenas" first. 
        // 15 numbers -> 1 centena (0-99).
        expect(screen.getByText(/0 - 14/i)).toBeInTheDocument();
      });

      // Click centena 0 to see numbers
      fireEvent.click(screen.getByText(/0 - 14/i));

      await waitFor(() => {
        expect(screen.getByText('001')).toBeInTheDocument();
        expect(screen.getByText('003')).toBeInTheDocument();

        // Check classes
        const num1 = screen.getByText('001').closest('button');
        const num3 = screen.getByText('003').closest('button');

        expect(num1).not.toHaveClass('ocupado');
        expect(num3).toHaveClass('ocupado');
        expect(num3).toBeDisabled();
      });
    });
  });
});