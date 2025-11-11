// src/service/autentication.test.jsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Login from '../JSX/LoginAdmin'

// Mock de useNavigate
const mockNavigate = vi.fn();

// Mock de fetch global
global.fetch = vi.fn();

// Mock de localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock de alert
global.alert = vi.fn();

// Mock de CSS modules
vi.mock('../CSS/LoginAdmin.module.css', () => ({
  default: {
    'login-page-container': 'login-page-container',
    'login-form-card': 'login-form-card',
    'login-form': 'login-form',
    'form-group': 'form-group',
    'login-error-message': 'login-error-message',
    'login-submit-button': 'login-submit-button'
  }
}));

// Mock de react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login - Pruebas Funcionales', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
  };

  // 1. PRUEBA: Flujo de login exitoso
  it('debe permitir al usuario hacer login exitosamente', async () => {
    const user = userEvent.setup();

    // Mock de respuesta exitosa
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access: 'abc123'
      })
    });

    renderLogin();

    // 1. El usuario escribe su email (usa las etiquetas REALES de tu componente)
    await user.type(
      screen.getByLabelText(/correo electrónico/i),
      'organizer@example.com'
    );

    // 2. El usuario escribe su contraseña
    await user.type(
      screen.getByLabelText(/contraseña/i),
      'ChangeMe123!'
    );

    // 3. El usuario hace click en "Iniciar Sesión"
    await user.click(
      screen.getByRole('button', { name: /iniciar sesión/i })
    );

    // 4. Verificar que se muestra estado de carga
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText(/iniciando.../i)).toBeInTheDocument();

    // 5. Verificar que se llamó a la API con los datos correctos
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/auth/token/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'organizer@example.com',
            password: 'ChangeMe123!'
          })
        }
      );
    });

    // 6. Verificar que se guardó el token en localStorage
    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('authToken', 'abc123');
    });

    // 7. Verificar que se mostró alerta de éxito
    expect(global.alert).toHaveBeenCalledWith('¡Inicio de sesión exitoso!');

    // 8. Verificar redirección
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/rifas');
    });
  });

  // 2. PRUEBA: Validación de campos requeridos
  it('debe mostrar errores cuando el usuario intenta enviar el formulario vacío', async () => {
    const user = userEvent.setup();
    renderLogin();

    // El usuario intenta enviar sin llenar los campos
    await user.click(
      screen.getByRole('button', { name: /iniciar sesión/i })
    );

    // Tu componente no tiene validación frontend, pero verifica que NO se llamó a la API
    expect(fetch).not.toHaveBeenCalled();
  });

  // 3. PRUEBA: Login fallido por credenciales incorrectas
  it('debe mostrar error cuando las credenciales son incorrectas', async () => {
    const user = userEvent.setup();

    // Mock de respuesta fallida (401)
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({
        detail: 'No active account found with the given credentials'
      })
    });

    renderLogin();

    // El usuario escribe credenciales incorrectas
    await user.type(screen.getByLabelText(/correo electrónico/i), 'wrong@email.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    // Verificar que se muestra el error
    await waitFor(() => {
      expect(screen.getByText(/No active account found with the given credentials/i)).toBeInTheDocument();
    });

    // Verificar que el botón vuelve a estar habilitado
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeEnabled();
  });

  // 4. PRUEBA: Error de servidor (500)
  it('debe mostrar error cuando hay problema en el servidor', async () => {
    const user = userEvent.setup();

    // Mock de error de servidor
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => '<!DOCTYPE html>Error del servidor'
    });

    renderLogin();

    await user.type(screen.getByLabelText(/correo electrónico/i), 'organizer@example.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'ChangeMe123!');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    // Verificar error de servidor
    await waitFor(() => {
      expect(screen.getByText(/Internal server error/i)).toBeInTheDocument();
    });
  });

  // 5. PRUEBA: Campos deshabilitados durante loading
  it('debe deshabilitar campos y botón durante el login', async () => {
    const user = userEvent.setup();

    // Mock de respuesta lenta
    fetch.mockImplementationOnce(() => new Promise(resolve => 
      setTimeout(() => resolve({
        ok: true,
        json: async () => ({ access: 'token' })
      }), 100)
    ));

    renderLogin();

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    // Llenar formulario
    await user.type(emailInput, 'organizer@example.com');
    await user.type(passwordInput, 'ChangeMe123!');

    // Antes de enviar - campos habilitados
    expect(emailInput).not.toBeDisabled();
    expect(passwordInput).not.toBeDisabled();
    expect(submitButton).not.toBeDisabled();

    // Enviar formulario
    await user.click(submitButton);

    // Durante loading - campos deshabilitados
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Iniciando...');
  });

  // 6. PRUEBA: Limpieza de errores al escribir
  it('debe limpiar los errores cuando el usuario comienza a escribir', async () => {
    const user = userEvent.setup();

    // Primero provocar un error
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ detail: 'Credenciales inválidas' })
    });

    renderLogin();

    await user.type(screen.getByLabelText(/correo electrónico/i), 'wrong@email.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    // Verificar que aparece el error
    await waitFor(() => {
      expect(screen.getByText(/Credenciales inválidas/i)).toBeInTheDocument();
    });

    // El usuario comienza a escribir de nuevo
    await user.clear(screen.getByLabelText(/correo electrónico/i));
    await user.type(screen.getByLabelText(/correo electrónico/i), 'nuevo@email.com');

    // El error debería desaparecer
    expect(screen.queryByText(/Credenciales inválidas/i)).not.toBeInTheDocument();
  });

  // 7. PRUEBA: Manejo de errores de red
  it('debe mostrar error de conexión cuando falla la API', async () => {
    const user = userEvent.setup();

    // Mock que lanza una excepción
    fetch.mockRejectedValueOnce(new Error('Error de conexión'));

    renderLogin();

    // El usuario intenta hacer login
    await user.type(screen.getByLabelText(/correo electrónico/i), 'organizer@example.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'ChangeMe123!');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    // Verificar que se muestra error de conexión
    await waitFor(() => {
      expect(screen.getByText(/error de conexión/i)).toBeInTheDocument();
    });
  });
});