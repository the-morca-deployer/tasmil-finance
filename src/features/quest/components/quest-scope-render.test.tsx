import { render } from "@testing-library/react";
import { Icon, PtsCoin, qAvatar, TFLoader } from "@/features/quest";

describe("quest scoped render", () => {
  it("renders ported foundation pieces inside .quest-scope without affecting siblings", () => {
    const { container } = render(
      <>
        <div className="quest-scope" data-testid="scope">
          <PtsCoin />
          <TFLoader size={48} />
          <span style={{ backgroundImage: qAvatar("nathan") }} data-testid="avatar" />
          {Icon.trophy({ width: 16 })}
        </div>
        <div data-testid="outside">main app</div>
      </>,
    );

    const scope = container.querySelector('[data-testid="scope"]');
    expect(scope).not.toBeNull();
    // brand glyph + loader mark + trophy line icon all rendered inside the scope
    expect(scope?.querySelectorAll("svg").length).toBeGreaterThanOrEqual(2);
    expect(scope?.querySelector(".tf-loader-mark")).not.toBeNull();

    const avatar = container.querySelector('[data-testid="avatar"]') as HTMLElement;
    expect(avatar).not.toBeNull();
    // jsdom's CSSOM rejects the modern space-separated hsl() syntax, so assert on
    // the helper's output directly (the load-bearing piece the avatar consumes).
    expect(qAvatar("nathan")).toContain("radial-gradient");

    // the sibling outside the scope carries no quest class and no quest svg
    const outside = container.querySelector('[data-testid="outside"]') as HTMLElement;
    expect(outside.className).toBe("");
    expect(outside.querySelector("svg")).toBeNull();
  });
});
