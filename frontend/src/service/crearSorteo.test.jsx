// src/service/crearSorteo.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import RegistroSorteo from '../JSX/RegistroSorteo.jsx';
import '@testing-library/jest-dom';

// Mock del CSS 
vi.mock('../CSS/RegistroSorteo.css', () => ({}));

describe('PRUEBAS FORMULARIO REGISTRO SORTEO - 5 Puntos Clave', () => {
  
  // mocks 
  const mockFetch = vi.fn();
  const mockCreateObjectURL = vi.fn(() => 'blob:test-image');
  
  const mockLocalStorage = {
    getItem: vi.fn(() => 'fake-token-123'),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    vi.stubGlobal('localStorage', mockLocalStorage);

    // URL necesita conservar el prototype
    vi.stubGlobal('URL', {
      createObjectURL: mockCreateObjectURL
    });

    mockFetch.mockClear();
    mockCreateObjectURL.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

 
  // 1. render del sorteo
 
  describe('1. Rendering de todos los campos', () => {

    test('renderiza todos los campos obligatorios', () => {
      render(<RegistroSorteo />);

      const labels = [
        /nombre del sorteo/i,
        /descripción/i,
        /total de numeros/i,
        /precio por número/i,
        /inicio de venta/i,
        /fin de venta/i,
        /fecha del sorteo/i,
        /imagen del sorteo/i
      ];

      labels.forEach(label => {
        expect(screen.getByLabelText(label)).toBeInTheDocument();
      });

      expect(
        screen.getByRole('button', { name: /registrar sorteo/i })
      ).toBeInTheDocument();
    });

    test('valores iniciales correctos', () => {
      render(<RegistroSorteo />);

      expect(screen.getByLabelText(/nombre del sorteo/i)).toHaveValue('');
      expect(screen.getByLabelText(/descripción/i)).toHaveValue('');
      expect(screen.getByLabelText(/total de numeros/i)).toHaveValue(0);
      expect(screen.getByLabelText(/precio por número/i)).toHaveValue('');
      expect(screen.getByLabelText(/inicio de venta/i)).toHaveValue('');
      expect(screen.getByLabelText(/fin de venta/i)).toHaveValue('');
      expect(screen.getByLabelText(/fecha del sorteo/i)).toHaveValue('');
    });
  });

 
  // 2. validaciones de campos del sorteo

  describe('2. Validaciones de campos', () => {

    test('campos requeridos marcados como obligatorios', () => {
      render(<RegistroSorteo />);

      const requiredInputs = [
        /nombre del sorteo/i,
        /descripción/i,
        /total de numeros/i,
        /precio por número/i,
        /inicio de venta/i,
        /fin de venta/i,
        /fecha del sorteo/i,
      ];

      requiredInputs.forEach(label => {
        expect(screen.getByLabelText(label)).toBeRequired();
      });
    });

    test('valores mínimos configurados', () => {
      render(<RegistroSorteo />);

      expect(screen.getByLabelText(/total de numeros/i)).toHaveAttribute('min', '1');
      
      const price = screen.getByLabelText(/precio por número/i);
      expect(price).toHaveAttribute('min', '1');
      expect(price).toHaveAttribute('step', '0.01');
    });

    test('actualiza estado al cambiar valores', () => {
      render(<RegistroSorteo />);

      const nombre = screen.getByLabelText(/nombre del sorteo/i);
      fireEvent.change(nombre, { target: { value: 'Sorteo Navideño' } });
      expect(nombre).toHaveValue('Sorteo Navideño');

      const numeros = screen.getByLabelText(/total de numeros/i);
      fireEvent.change(numeros, { target: { value: '100' } });
      expect(numeros).toHaveValue(100);
    });
  });

  
  // 3. mensajes de error exito
  describe('3. Mensajes de error y éxito', () => {

    test('muestra mensaje de éxito cuando API responde ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '{}'
      });

      const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<RegistroSorteo />);

      fireEvent.change(screen.getByLabelText(/nombre del sorteo/i), {
        target: { value: 'Sorteo Test' }
      });

      fireEvent.change(screen.getByLabelText(/total de numeros/i), {
        target: { value: '50' }
      });

      const file = new File(['test'], 'image.png', { type: 'image/png' });
      const imageInput = screen.getByLabelText(/imagen del sorteo/i);

      Object.defineProperty(imageInput, 'files', { value: [file] });
      fireEvent.change(imageInput);

      fireEvent.click(screen.getByRole('button', { name: /registrar sorteo/i }));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Sorteo registrado exitosamente');
      });

      mockAlert.mockRestore();
    });

    test('muestra mensaje de error cuando API responde error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Error del servidor'
      });

      const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<RegistroSorteo />);

      fireEvent.change(screen.getByLabelText(/nombre del sorteo/i), {
        target: { value: 'Test' }
      });

      const file = new File(['x'], 'img.png', { type: 'image/png' });
      const imageInput = screen.getByLabelText(/imagen del sorteo/i);

      Object.defineProperty(imageInput, 'files', { value: [file] });
      fireEvent.change(imageInput);

      fireEvent.click(screen.getByRole('button', { name: /registrar sorteo/i }));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Error al registrar el sorteo');
      });

      mockAlert.mockRestore();
    });
  });

  // ============================================================
  // 4. ERRORES DE API
  // ============================================================
  describe('4. Manejo de errores de API', () => {

    test('maneja error de red', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<RegistroSorteo />);

      fireEvent.change(screen.getByLabelText(/nombre del sorteo/i), {
        target: { value: 'Test' }
      });

      const file = new File(['x'], 'img.png', { type: 'image/png' });
      const imageInput = screen.getByLabelText(/imagen del sorteo/i);

      Object.defineProperty(imageInput, 'files', { value: [file] });
      fireEvent.change(imageInput);

      fireEvent.click(screen.getByRole('button', { name: /registrar sorteo/i }));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('No se pudo registrar el sorteo');
      });

      mockAlert.mockRestore();
    });
  });

  // ============================================================
  // 5. FUNCIONALIDAD DE IMAGEN
  // ============================================================
  describe('5. Funcionalidad de imagen', () => {

    test('usa URL.createObjectURL al subir imagen', () => {
      render(<RegistroSorteo />);

      const file = new File(['img'], 'test.png', { type: 'image/png' });
      const imageInput = screen.getByLabelText(/imagen del sorteo/i);

      Object.defineProperty(imageInput, 'files', { value: [file] });
      fireEvent.change(imageInput);

      expect(mockCreateObjectURL).toHaveBeenCalledWith(file);
    });
  });

});
