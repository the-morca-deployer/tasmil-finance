import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StepStrategy } from "./step-strategy";

const defaultProps = {
  preset: "Balanced" as const,
  onSelect: jest.fn(),
};

beforeEach(() => {
  defaultProps.onSelect.mockClear();
});

describe("StepStrategy", () => {
  it("renders Agent Strategy title and Safe/Balanced/Aggressive spheres", () => {
    render(<StepStrategy {...defaultProps} />);
    expect(screen.getByRole("heading", { name: /agent strategy/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /safe/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /balanced/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /aggressive/i })).toBeInTheDocument();
  });

  it("Balanced sphere reflects selected state when preset=Balanced", () => {
    render(<StepStrategy {...defaultProps} preset="Balanced" />);
    expect(screen.getByRole("radio", { name: /balanced/i })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByRole("radio", { name: /safe/i })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("radio", { name: /aggressive/i })).toHaveAttribute(
      "aria-checked",
      "false"
    );
  });

  it("clicking Safe calls onSelect with Safe", async () => {
    const onSelect = jest.fn();
    render(<StepStrategy {...defaultProps} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("radio", { name: /safe/i }));
    expect(onSelect).toHaveBeenCalledWith("Safe");
  });

  it("clicking Aggressive calls onSelect with Aggressive", async () => {
    const onSelect = jest.fn();
    render(<StepStrategy {...defaultProps} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("radio", { name: /aggressive/i }));
    expect(onSelect).toHaveBeenCalledWith("Aggressive");
  });

  it("hovering a sphere shows its description", async () => {
    render(<StepStrategy {...defaultProps} preset="Balanced" />);
    await userEvent.hover(screen.getByRole("radio", { name: /safe/i }));
    expect(screen.getByText(/capital preservation/i)).toBeInTheDocument();
  });

  it("back button renders only when onBack provided", async () => {
    const { rerender } = render(<StepStrategy {...defaultProps} />);
    expect(screen.queryByRole("button", { name: /back/i })).toBeNull();

    const onBack = jest.fn();
    rerender(<StepStrategy {...defaultProps} onBack={onBack} />);
    const backBtn = screen.getByRole("button", { name: /back/i });
    await userEvent.click(backBtn);
    expect(onBack).toHaveBeenCalled();
  });
});
