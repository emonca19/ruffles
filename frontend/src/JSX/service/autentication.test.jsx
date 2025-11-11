
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import LoginForm from './LoginForm';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock de la función de login
const mockLoginAPI = vi.fn();

describe('LoginForm - Pruebas Funcionales', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderLoginForm = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <LoginForm onLogin={mockLoginAPI} />
        </AuthProvider>
      </BrowserRouter>
    );
  };
  //Caminos que toma la prueba funcional 
  
  // 1. PRUEBA: Flujo de login exitoso
  it('debe permitir al usuario hacer login exitosamente', async () => {
    const user = userEvent.setup();
    
    // Mock de respuesta exitosa
    mockLoginAPI.mockResolvedValue({
      success: true,
      user: { 
        id: 1, 
        name: 'Juan Pérez', 
        email: 'usuario@ejemplo.com' 
      },
      token: 'abc123'
    });

    renderLoginForm();

    // 1. El usuario escribe su email
    await user.type(
      screen.getByLabelText(/email/i), 
      'usuario@ejemplo.com'
    );

    // 2. El usuario escribe su contraseña
    await user.type(
      screen.getByLabelText(/contraseña/i), 
      'password123'
    );

    // 3. El usuario hace click en "Iniciar Sesión"
    await user.click(
      screen.getByRole('button', { name: /iniciar sesión/i })
    );

    // 4. Verificar que se muestra estado de carga
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText(/iniciando sesión.../i)).toBeInTheDocument();

    // 5. Verificar que se llamó a la API con los datos correctos
    await waitFor(() => {
      expect(mockLoginAPI).toHaveBeenCalledWith({
        email: 'usuario@ejemplo.com',
        password: 'password123'
      });
    });

    // 6. Verificar que el usuario queda logueado (se guarda en localStorage)
    await waitFor(() => {
      const userData = JSON.parse(localStorage.getItem('user'));
      expect(userData).toEqual({
        id: 1,
        name: 'Juan Pérez',
        email: 'usuario@ejemplo.com'
      });
    });
  });

  // 2. PRUEBA: Validación de campos requeridos
  it('debe mostrar errores cuando el usuario intenta enviar el formulario vacío', async () => {
    const user = userEvent.setup();
    renderLoginForm();

    // El usuario intenta enviar sin llenar los campos
    await user.click(
      screen.getByRole('button', { name: /iniciar sesión/i })
    );

    // Verificar que se muestran mensajes de error
    expect(screen.getByText(/el email es requerido/i)).toBeInTheDocument();
    expect(screen.getByText(/la contraseña es requerida/i)).toBeInTheDocument();

    // Verificar que NO se llamó a la API
    expect(mockLoginAPI).not.toHaveBeenCalled();
  });

  // 3. PRUEBA: Login fallido por credenciales incorrectas
  it('debe mostrar error cuando las credenciales son incorrectas', async () => {
    const user = userEvent.setup();
    
    // Mock de respuesta fallida
    mockLoginAPI.mockResolvedValue({
      success: false,
      error: 'Credenciales incorrectas'
    });

    renderLoginForm();

    // El usuario escribe credenciales incorrectas
    await user.type(screen.getByLabelText(/email/i), 'wrong@email.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    // Verificar que se muestra el error
    await waitFor(() => {
      expect(screen.getByText(/credenciales incorrectas/i)).toBeInTheDocument();
    });

    // Verificar que el botón vuelve a estar habilitado
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeEnabled();
  });

  // 4. PRUEBA: Validación de formato de email
  it('debe mostrar error cuando el email tiene formato inválido', async () => {
    const user = userEvent.setup();
    renderLoginForm();

    // El usuario escribe email inválido
    await user.type(screen.getByLabelText(/email/i), 'email-invalido');
    await user.type(screen.getByLabelText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    // Verificar error de formato
    expect(screen.getByText(/email inválido/i)).toBeInTheDocument();
    expect(mockLoginAPI).not.toHaveBeenCalled();
  });

  // 5. PRUEBA: Validación de longitud de contraseña
  it('debe mostrar error cuando la contraseña es muy corta', async () => {
    const user = userEvent.setup();
    renderLoginForm();

    // El usuario escribe contraseña corta
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/contraseña/i), '123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    // Verificar error de longitud
    expect(screen.getByText(/al menos 6 caracteres/i)).toBeInTheDocument();
    expect(mockLoginAPI).not.toHaveBeenCalled();
  });

  // 6. PRUEBA: Limpieza de errores al escribir
  it('debe limpiar los errores cuando el usuario comienza a escribir', async () => {
    const user = userEvent.setup();
    renderLoginForm();

    // Provocar error
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));
    expect(screen.getByText(/el email es requerido/i)).toBeInTheDocument();

    // El usuario comienza a escribir en el campo de email
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');

    // Verificar que el error desaparece
    expect(screen.queryByText(/el email es requerido/i)).not.toBeInTheDocument();
  });

  // 7. PRUEBA: Manejo de errores de red
  it('debe mostrar error de conexión cuando falla la API', async () => {
    const user = userEvent.setup();
    
    // Mock de error de red
    mockLoginAPI.mockRejectedValue(new Error('Error de conexión'));

    renderLoginForm();

    // El usuario intenta hacer login
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    // Verificar que se muestra error de conexión
    await waitFor(() => {
      expect(screen.getByText(/error de conexión/i)).toBeInTheDocument();
    });
  });
});