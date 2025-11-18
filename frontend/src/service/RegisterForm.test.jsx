// tests/RegistroUsuario.completo.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import RegistroUsuario from '../JSX/RegistroAdmin';
import '@testing-library/jest-dom';

// MOCKS GLOBALES 
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock para CSS modules
vi.mock('../CSS/RegistroAdmin.module.css', () => ({
  registroContainer: 'registroContainer',
  registroCard: 'registroCard',
  registroForm: 'registroForm',
  formGroup: 'formGroup',
  errorMessage: 'errorMessage',
  successMessage: 'successMessage',
  registroButton: 'registroButton'
}));

// Mock para API_URL
vi.mock('../config/apiRegistroAdmin.js', () => ({
  API_URL: 'http://localhost:8000/api'
}));

// Mock de fetch global usando vi
const mockFetch = vi.fn();
global.fetch = mockFetch;

//aqui son las preubas par los puntos clave a probar que son 5

describe('PRUEBAS FORMULARIO REGISTRO - 5 Puntos Clave', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockNavigate.mockClear();
    vi.clearAllMocks();
  });

  // ==================== PUNTO 1: RENDERING DE FORMULARIO COMPLETO ====================
  describe('1. Rendering de formulario completo', () => {
    test('debe renderizar todos los campos del formulario correctamente', () => {
      render(
        <BrowserRouter>
          <RegistroUsuario />
        </BrowserRouter>
      );

      // Verificar que todos los campos están presentes
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/apellido paterno/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/apellido materno/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tipo de usuario/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument();
      
      // Verificar botón de envío
      expect(screen.getByRole('button', { name: /crear cuenta/i })).toBeInTheDocument();
      
      // Verificar textos informativos
      expect(screen.getByText('Registro de Usuario')).toBeInTheDocument();
      expect(screen.getByText('Completa el formulario para crear una cuenta.')).toBeInTheDocument();
    });

    test('debe mostrar valores iniciales correctos en todos los campos', () => {
      render(
        <BrowserRouter>
          <RegistroUsuario />
        </BrowserRouter>
      );

      // Todos los campos deben empezar vacíos
      expect(screen.getByLabelText(/nombre/i)).toHaveValue('');
      expect(screen.getByLabelText(/apellido paterno/i)).toHaveValue('');
      expect(screen.getByLabelText(/apellido materno/i)).toHaveValue('');
      expect(screen.getByLabelText(/correo electrónico/i)).toHaveValue('');
      expect(screen.getByLabelText(/teléfono/i)).toHaveValue('');
      expect(screen.getByLabelText(/tipo de usuario/i)).toHaveValue('organizador');
      expect(screen.getByLabelText(/contraseña/i)).toHaveValue('');
      expect(screen.getByLabelText(/confirmar contraseña/i)).toHaveValue('');
    });
  });

  // ==================== PUNTO 2: ENVÍO EXITOSO DE DATOS VÁLIDOS ====================
  describe('2. Envío exitoso de datos válidos', () => {
    test('debe mostrar mensaje de éxito cuando el registro es exitoso', async () => {
      // Mock de respuesta exitosa del servidor
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      render(
        <BrowserRouter>
          <RegistroUsuario />
        </BrowserRouter>
      );

      // Llenar formulario con datos válidos
      fireEvent.change(screen.getByLabelText(/nombre/i), {
        target: { value: 'Ana', name: 'nombre' }
      });

      fireEvent.change(screen.getByLabelText(/apellido paterno/i), {
        target: { value: 'García', name: 'apellido_paterno' }
      });

      fireEvent.change(screen.getByLabelText(/apellido materno/i), {
        target: { value: 'López', name: 'apellido_materno' }
      });

      fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
        target: { value: 'ana.garcia@ejemplo.com', name: 'email' }
      });

      fireEvent.change(screen.getByLabelText(/teléfono/i), {
        target: { value: '5512345678', name: 'phone' }
      });

      fireEvent.change(screen.getByLabelText(/contraseña/i), {
        target: { value: 'SecurePassword123!', name: 'password1' }
      });

      fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), {
        target: { value: 'SecurePassword123!', name: 'password2' }
      });

      // Enviar formulario
      fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

      // Verificar que se muestra el mensaje de éxito
      await waitFor(() => {
        expect(screen.getByText('¡Registro exitoso! Redirigiendo al inicio de sesión...')).toBeInTheDocument();
      });

      // Verificar que se llamó a la API con los datos correctos
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/auth/register/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('ana.garcia@ejemplo.com')
        }
      );
    });
  });

  // ==================== PUNTO 3: VALIDACIONES EN CAMPO ====================
  describe('3. Validaciones en campo', () => {
    test('debe validar que las contraseñas coincidan antes del envío', async () => {
      render(
        <BrowserRouter>
          <RegistroUsuario />
        </BrowserRouter>
      );

      // Llenar formulario con contraseñas que no coinciden
      fireEvent.change(screen.getByLabelText(/nombre/i), {
        target: { value: 'Carlos', name: 'nombre' }
      });

      fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
        target: { value: 'carlos@ejemplo.com', name: 'email' }
      });

      fireEvent.change(screen.getByLabelText(/contraseña/i), {
        target: { value: 'Password123', name: 'password1' }
      });

      fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), {
        target: { value: 'DiferentePassword456', name: 'password2' }
      });

      // Enviar formulario
      fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

      // Verificar que se muestra error de contraseñas no coincidentes
      await waitFor(() => {
        expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
      });

      // Verificar que NO se llamó a la API
      expect(mockFetch).not.toHaveBeenCalled();
    });

    test('debe permitir envío cuando las contraseñas coinciden', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      render(
        <BrowserRouter>
          <RegistroUsuario />
        </BrowserRouter>
      );

      // Llenar formulario con contraseñas que SÍ coinciden
      fireEvent.change(screen.getByLabelText(/nombre/i), {
        target: { value: 'Laura', name: 'nombre' }
      });

      fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
        target: { value: 'laura@ejemplo.com', name: 'email' }
      });

      fireEvent.change(screen.getByLabelText(/contraseña/i), {
        target: { value: 'MiContraseñaSegura123', name: 'password1' }
      });

      fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), {
        target: { value: 'MiContraseñaSegura123', name: 'password2' }
      });

      // Enviar formulario
      fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

      // Verificar que SÍ se llamó a la API
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ==================== PUNTO 4: MENSAJE DE ERROR SI EMAIL YA EXISTE ====================
  describe('4. Mensaje de error si email ya existe', () => {
    test('debe mostrar mensaje específico cuando el email ya está registrado', async () => {
      // Mock de error de email existente
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ 
          detail: 'El email ya está en uso' 
        })
      });

      render(
        <BrowserRouter>
          <RegistroUsuario />
        </BrowserRouter>
      );

      // Llenar formulario con email que probablemente ya existe
      fireEvent.change(screen.getByLabelText(/nombre/i), {
        target: { value: 'Usuario', name: 'nombre' }
      });

      fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
        target: { value: 'existente@ejemplo.com', name: 'email' }
      });

      fireEvent.change(screen.getByLabelText(/contraseña/i), {
        target: { value: 'password123', name: 'password1' }
      });

      fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), {
        target: { value: 'password123', name: 'password2' }
      });

      // Enviar formulario
      fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

      // Verificar que se muestra el mensaje de error específico
      await waitFor(() => {
        expect(screen.getByText('El email ya está en uso')).toBeInTheDocument();
      });
    });

    test('debe mantener los datos del formulario después de un error de email', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'El email ya está en uso' })
      });

      render(
        <BrowserRouter>
          <RegistroUsuario />
        </BrowserRouter>
      );

      const testEmail = 'usuario@ejemplo.com';
      const testNombre = 'Roberto';

      fireEvent.change(screen.getByLabelText(/nombre/i), {
        target: { value: testNombre, name: 'nombre' }
      });

      fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
        target: { value: testEmail, name: 'email' }
      });

      fireEvent.change(screen.getByLabelText(/contraseña/i), {
        target: { value: 'password123', name: 'password1' }
      });

      fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), {
        target: { value: 'password123', name: 'password2' }
      });

      fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

      await waitFor(() => {
        expect(screen.getByText('El email ya está en uso')).toBeInTheDocument();
      });

      // Verificar que los datos se mantienen en el formulario
      expect(screen.getByLabelText(/nombre/i)).toHaveValue(testNombre);
      expect(screen.getByLabelText(/correo electrónico/i)).toHaveValue(testEmail);
    });
  });

  // ==================== PUNTO 5: CAMPOS VACÍOS DISPARAN ERRORES VISUALES ====================
  describe('5. Campos vacíos disparan errores visuales', () => {
    test('debe mostrar que los campos requeridos son obligatorios', () => {
      render(
        <BrowserRouter>
          <RegistroUsuario />
        </BrowserRouter>
      );

      // Verificar que los campos required están marcados como tales
      expect(screen.getByLabelText(/nombre/i)).toBeRequired();
      expect(screen.getByLabelText(/apellido paterno/i)).toBeRequired();
      expect(screen.getByLabelText(/correo electrónico/i)).toBeRequired();
      expect(screen.getByLabelText(/teléfono/i)).toBeRequired();
      expect(screen.getByLabelText(/contraseña/i)).toBeRequired();
      expect(screen.getByLabelText(/confirmar contraseña/i)).toBeRequired();
    });

    test('debe permitir apellido materno vacío (campo opcional)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      render(
        <BrowserRouter>
          <RegistroUsuario />
        </BrowserRouter>
      );

      // Llenar todos los campos excepto apellido materno (dejarlo vacío)
      fireEvent.change(screen.getByLabelText(/nombre/i), {
        target: { value: 'Pedro', name: 'nombre' }
      });

      fireEvent.change(screen.getByLabelText(/apellido paterno/i), {
        target: { value: 'Martínez', name: 'apellido_paterno' }
      });

      // Apellido materno se deja vacío intencionalmente

      fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
        target: { value: 'pedro@ejemplo.com', name: 'email' }
      });

      fireEvent.change(screen.getByLabelText(/teléfono/i), {
        target: { value: '5512345678', name: 'phone' }
      });

      fireEvent.change(screen.getByLabelText(/contraseña/i), {
        target: { value: 'password123', name: 'password1' }
      });

      fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), {
        target: { value: 'password123', name: 'password2' }
      });

      fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

      // Verificar que el formulario se envía exitosamente
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });

    test('debe limpiar mensajes previos al intentar nuevo envío', async () => {
      // Primero crear un error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'El email ya está en uso' })
      });

      render(
        <BrowserRouter>
          <RegistroUsuario />
        </BrowserRouter>
      );

      // Llenar formulario básico
      fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Test', name: 'nombre' } });
      fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'test@test.com', name: 'email' } });
      fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password', name: 'password1' } });
      fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), { target: { value: 'password', name: 'password2' } });

      fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

      // Verificar que aparece el error
      await waitFor(() => {
        expect(screen.getByText('El email ya está en uso')).toBeInTheDocument();
      });

      // Al enviar nuevamente, debería limpiar el mensaje de error
      fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

      // El mensaje de error debería desaparecer inmediatamente
      await waitFor(() => {
        expect(screen.queryByText('El email ya está en uso')).not.toBeInTheDocument();
      });
    });
  });
});