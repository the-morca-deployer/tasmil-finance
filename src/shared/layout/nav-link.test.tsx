import { render, screen } from "@testing-library/react";
import { Bot } from "lucide-react";
import { NavLink } from "./nav-link";

const pathnameMock = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
}));

const baseItem = {
  title: "Chat",
  url: "/chat",
  icon: Bot,
};

describe("NavLink", () => {
  it("renders the title", () => {
    pathnameMock.mockReturnValue("/something-else");
    render(<NavLink item={baseItem} />);
    expect(screen.getByRole("link", { name: /chat/i })).toBeInTheDocument();
  });

  it("does not render the item icon (text-only nav)", () => {
    pathnameMock.mockReturnValue("/something-else");
    const { container } = render(<NavLink item={baseItem} />);
    expect(container.querySelector("svg")).toBeNull();
  });

  it("active link has foreground color class", () => {
    pathnameMock.mockReturnValue("/chat");
    render(<NavLink item={baseItem} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("data-active", "true");
    expect(link.className).toMatch(/text-foreground/);
    expect(link.className).not.toMatch(/text-muted-foreground/);
  });

  it("inactive link has muted color class", () => {
    pathnameMock.mockReturnValue("/something-else");
    render(<NavLink item={baseItem} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("data-active", "false");
    expect(link.className).toMatch(/text-muted-foreground/);
  });

  it("is active when pathname starts with item.url + '/'", () => {
    pathnameMock.mockReturnValue("/chat/abc-123");
    render(<NavLink item={baseItem} />);
    expect(screen.getByRole("link")).toHaveAttribute("data-active", "true");
  });

  it("is NOT active when pathname is a sibling prefix", () => {
    pathnameMock.mockReturnValue("/chats");
    render(<NavLink item={baseItem} />);
    expect(screen.getByRole("link")).toHaveAttribute("data-active", "false");
  });
});
