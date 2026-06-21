import { render } from "@testing-library/react";
import { TFLoader } from "./TFLoader";

describe("TFLoader", () => {
  it("renders the brand mark at the default size", () => {
    const { container } = render(<TFLoader />);
    const mark = container.querySelector(".tf-loader-mark") as HTMLElement | null;
    expect(mark).not.toBeNull();
    expect(mark?.style.width).toBe("190px");
  });

  it("honors a custom size", () => {
    const { container } = render(<TFLoader size={64} />);
    expect((container.querySelector(".tf-loader-mark") as HTMLElement).style.width).toBe("64px");
  });

  it("renders with aria loading role", () => {
    const { container } = render(<TFLoader />);
    const mark = container.querySelector('[role="status"]');
    expect(mark).not.toBeNull();
  });
});
