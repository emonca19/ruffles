// prueba tdd para liberar numero de sorteo de parte del admin
//prueba

// ForceReleaseButton.test.jsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ForceReleaseButton from "../service/ForceReleaseButton.jsx";

describe("ForceReleaseButton", () => {
  it("debe renderizar el botón correctamente con el texto 'Forzar Liberación'", () => {
    render(<ForceReleaseButton onForceRelease={() => {}} loading={false} />);
    expect(screen.getByText("Forzar Liberación")).toBeInTheDocument();
  });

  it("debe ejecutar la función onForceRelease al hacer clic", () => {
    const mockFn = vi.fn();
    render(<ForceReleaseButton onForceRelease={mockFn} loading={false} />);

    fireEvent.click(screen.getByText("Forzar Liberación"));

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("debe deshabilitar el botón y mostrar 'Liberando...' cuando loading es true", () => {
    render(<ForceReleaseButton onForceRelease={() => {}} loading={true} />);

    const button = screen.getByRole("button");
    
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Liberando...");
  });

  it("debe estar habilitado cuando loading es false", () => {
    render(<ForceReleaseButton onForceRelease={() => {}} loading={false} />);

    const button = screen.getByRole("button");
    
    expect(button).toBeEnabled();
    expect(button).toHaveTextContent("Forzar Liberación");
  });

  
});