import { render } from "@testing-library/react";
import { Icon, PtsCoin, TFLoader } from "@/features/quest";
import { TasmilAvatar } from "@/shared/components/tasmil-avatar";

describe("quest scoped render", () => {
  it("renders ported foundation pieces inside .quest-scope without affecting siblings", () => {
    const { container } = render(
      <>
        <div className="quest-scope" data-testid="scope">
          <PtsCoin />
          <TFLoader size={48} />
          <TasmilAvatar seed="nathan" size={28} data-testid="avatar" />
          {Icon.trophy({ width: 16 })}
        </div>
        <div data-testid="outside">main app</div>
      </>
    );

    const scope = container.querySelector('[data-testid="scope"]');
    expect(scope).not.toBeNull();
    // brand glyph + loader mark + trophy line icon all rendered inside the scope
    expect(scope?.querySelectorAll("svg").length).toBeGreaterThanOrEqual(2);
    expect(scope?.querySelector(".tf-loader-mark")).not.toBeNull();

    // avatar renders as a rounded span wrapping an SVG
    expect(scope?.querySelector(".rounded-full")).not.toBeNull();

    // the sibling outside the scope carries no quest class and no quest svg
    const outside = container.querySelector('[data-testid="outside"]') as HTMLElement;
    expect(outside.className).toBe("");
    expect(outside.querySelector("svg")).toBeNull();
  });
});
