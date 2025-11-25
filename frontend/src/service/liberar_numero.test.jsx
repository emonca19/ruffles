//Archivo de pruebas para boton de seleccionar y eliminar seleccion 
//liberar_numero.test.jsx
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BotonAccionCliente from './BotonAccionCliente';

describe('Botón Eliminar/Liberar en el panel del cliente', () => {

  test('muestra "Eliminar" y ejecuta onAccion("eliminar") cuando el cliente NO está ocupado', () => {
    const mockFn = vi.fn();

    render(<BotonAccionCliente ocupado={false} onAccion={mockFn} />);

    const btn = screen.getByTestId('btn-accion');

    expect(btn).toHaveTextContent('Eliminar');

    fireEvent.click(btn);

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('eliminar');
  });

  test('muestra "Liberar" y ejecuta onAccion("liberar") cuando el cliente está ocupado', () => {
    const mockFn = vi.fn();

    render(<BotonAccionCliente ocupado={true} onAccion={mockFn} />);

    const btn = screen.getByTestId('btn-accion');

    expect(btn).toHaveTextContent('Liberar');

    fireEvent.click(btn);

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('liberar');
  });

});
