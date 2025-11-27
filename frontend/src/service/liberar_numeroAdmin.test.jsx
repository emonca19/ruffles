// prueba tdd para liberar numero de sorteo de parte del admin
//prueba

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
//clase sin el nombre todavia
import ForceReleaseButton from "./ForceReleaseButton";

describe("ForceReleaseButton", () => {

  it("debe renderizar el botón correctamente", () => {
    render(<ForceReleaseButton onForceRelease={() => {}} loading={false} />);
    expect(screen.getByText("Forzar Liberación")).toBeInTheDocument();
  });

  it("debe ejecutar la acción al hacer clic", () => {
    const mockFn = vi.fn();
    render(<ForceReleaseButton onForceRelease={mockFn} loading={false} />);

    fireEvent.click(screen.getByText("Forzar Liberación"));

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("debe deshabilitar botón y mostrar texto al cargar", () => {
    render(<ForceReleaseButton onForceRelease={() => {}} loading={true} />);

    const btn = screen.getByRole("button");

    expect(btn).toBeDisabled();
    expect(btn.textContent).toBe("Liberando...");
  });
});
