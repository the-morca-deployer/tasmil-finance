import { render, screen } from "@testing-library/react";
import { Hairline } from "./hairline";
import { SectionHeader } from "./section-header";

describe("Hairline", () => {
  it("renders a 1px divider", () => {
    const { container } = render(<Hairline />);
    expect(container.firstChild).toHaveClass("h-px");
  });
});

describe("SectionHeader", () => {
  it("renders the label uppercased + tracked", () => {
    render(<SectionHeader>Allocation</SectionHeader>);
    const el = screen.getByText("Allocation");
    expect(el.className).toMatch(/uppercase/);
    expect(el.className).toMatch(/tracking-/);
  });

  it("renders a right-side action when provided", () => {
    render(
      <SectionHeader action={<button type="button">Show all</button>}>
        Activity
      </SectionHeader>
    );
    expect(screen.getByRole("button", { name: "Show all" })).toBeInTheDocument();
  });
});
