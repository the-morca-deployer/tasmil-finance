import { render, screen, fireEvent } from "@testing-library/react";
import { MilestoneNudge } from "../milestone-nudge";

test("five-dollar shows top percent", () => {
  render(<MilestoneNudge type="five-dollar" topPercent={15} spotsLeft={0} onReinvest={jest.fn()} />);
  expect(screen.getByText(/\$5/)).toBeInTheDocument();
  expect(screen.getByText(/15%/)).toBeInTheDocument();
});

test("day-30 shows compound CTA and calls onReinvest", () => {
  const onReinvest = jest.fn();
  render(<MilestoneNudge type="day-30" topPercent={0} spotsLeft={0} onReinvest={onReinvest} />);
  expect(screen.getByText(/fully unlocked/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /compound now/i }));
  expect(onReinvest).toHaveBeenCalled();
});

test("pool-full shows spots left", () => {
  render(<MilestoneNudge type="pool-full" topPercent={0} spotsLeft={3} onReinvest={jest.fn()} />);
  expect(screen.getByText(/3 spots left/i)).toBeInTheDocument();
});
