import { render } from "@testing-library/react";
import TFLoader from "./TFLoader";

describe("TFLoader", () => {
  it("renders the brand mark at the default size when not fullscreen", () => {
    const { container } = render(<TFLoader />);
    const mark = container.querySelector(".tf-loader-mark") as HTMLElement | null;
    expect(mark).not.toBeNull();
    expect(mark?.style.width).toBe("190px");
    expect(container.querySelector(".tf-loader-stage")).toBeNull();
    expect(container.querySelector("img")?.getAttribute("src")).toBe("/tasmil-tf-mark.svg");
  });

  it("honors a custom size", () => {
    const { container } = render(<TFLoader size={64} />);
    expect((container.querySelector(".tf-loader-mark") as HTMLElement).style.width).toBe("64px");
  });

  it("wraps the mark in a fullscreen stage when fullscreen is true", () => {
    const { container } = render(<TFLoader fullscreen />);
    expect(container.querySelector(".tf-loader-stage")).not.toBeNull();
  });
});
