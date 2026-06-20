import { render } from "@testing-library/react";
import { Flame, Icon, type IconKey, PtsCoin, Usdc } from "./icons";

describe("quest icons", () => {
  it("renders brand glyphs as svg", () => {
    const { container } = render(
      <>
        <PtsCoin />
        <Flame />
        <Usdc />
      </>,
    );
    expect(container.querySelectorAll("svg")).toHaveLength(3);
  });

  it("exposes the expected line-icon keys", () => {
    const keys: IconKey[] = ["arrow", "trophy", "share", "users", "x", "discord", "telegram"];
    for (const k of keys) {
      expect(typeof Icon[k]).toBe("function");
    }
  });

  it("renders a line icon as svg with passed props", () => {
    const { container } = render(Icon.trophy({ width: 18 }));
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("width")).toBe("18");
  });
});
