import { fireEvent, render, screen } from "@testing-library/react";
import { FarmingTabs, parseFarmingTab } from "./farming-tabs";

describe("parseFarmingTab", () => {
  it.each(["overview", "pools", "strategy", "activity", "rulebook"] as const)(
    "accepts %s",
    (value) => expect(parseFarmingTab(value)).toBe(value)
  );

  it.each([null, "", "unknown"])("falls back to overview for %s", (value) => {
    expect(parseFarmingTab(value)).toBe("overview");
  });
});

describe("FarmingTabs", () => {
  it("marks the current tab as selected", () => {
    render(<FarmingTabs value="pools" onValueChange={() => {}} />);

    expect(screen.getByRole("tab", { name: "Pools" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "false");
  });

  it("emits the selected tab", () => {
    const onValueChange = jest.fn();
    render(<FarmingTabs value="overview" onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole("tab", { name: "My Rulebook" }));

    expect(onValueChange).toHaveBeenCalledWith("rulebook");
  });

  it("supports arrow-key navigation", () => {
    const onValueChange = jest.fn();
    render(<FarmingTabs value="overview" onValueChange={onValueChange} />);

    fireEvent.keyDown(screen.getByRole("tab", { name: "Overview" }), { key: "ArrowRight" });

    expect(onValueChange).toHaveBeenCalledWith("pools");
  });
});
