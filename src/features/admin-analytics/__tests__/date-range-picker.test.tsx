import { fireEvent, render, screen } from "@testing-library/react";
import { DateRangePicker } from "../components/date-range-picker";

describe("DateRangePicker", () => {
  it("calls onChange with a 7-day range when the 7d preset is clicked", () => {
    const onChange = jest.fn();
    render(
      <DateRangePicker value={{ from: "2026-06-01", to: "2026-06-30" }} onChange={onChange} />
    );

    fireEvent.click(screen.getByRole("button", { name: "7d" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const [{ from, to }] = onChange.mock.calls[0];
    expect(new Date(to).getTime() - new Date(from).getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("calls onChange with the typed custom range", () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <DateRangePicker value={{ from: "2026-06-01", to: "2026-06-30" }} onChange={onChange} />
    );

    fireEvent.change(screen.getByLabelText("From"), { target: { value: "2026-05-01" } });
    expect(onChange).toHaveBeenLastCalledWith({ from: "2026-05-01", to: "2026-06-30" });

    rerender(<DateRangePicker value={{ from: "2026-05-01", to: "2026-06-30" }} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("To"), { target: { value: "2026-05-15" } });

    expect(onChange).toHaveBeenLastCalledWith({ from: "2026-05-01", to: "2026-05-15" });
  });
});
