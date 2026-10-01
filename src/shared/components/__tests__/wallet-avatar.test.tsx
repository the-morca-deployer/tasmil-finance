import { render } from "@testing-library/react";
import { WalletAvatar, walletAvatarUri } from "../wallet-avatar";

const ADDRESS = "GA2GJHIDS4PMVE5IXC4V2THR2KF2KZHSMN43M5KXBIABFNPRLN5GNEJQ";

describe("WalletAvatar", () => {
  it("is deterministic per address and distinct across addresses", () => {
    expect(walletAvatarUri(ADDRESS)).toBe(walletAvatarUri(ADDRESS));
    expect(walletAvatarUri(ADDRESS)).not.toBe(walletAvatarUri("CVAULT"));
    expect(walletAvatarUri(ADDRESS)).toMatch(/^data:image\/svg\+xml/);
  });

  it("falls back to a default seed for empty input", () => {
    expect(walletAvatarUri(undefined)).toBe(walletAvatarUri("  "));
  });

  it("renders a decorative image at the requested size", () => {
    const { container } = render(<WalletAvatar address={ADDRESS} size={24} />);
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", walletAvatarUri(ADDRESS));
    expect(img).toHaveAttribute("aria-hidden", "true");
    expect(img).toHaveAttribute("width", "24");
  });
});
