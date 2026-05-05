import { render, screen } from "@testing-library/react";
import { Bot, Tractor } from "lucide-react";
import { TopNavBar } from "./top-nav-bar";

const pathnameMock = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
}));

jest.mock("@/shared/components/connect-wallet-button", () => ({
  ConnectWalletButton: ({ variant }: { variant?: string }) => (
    <div data-testid="connect-wallet-button" data-variant={variant ?? "default"} />
  ),
}));

jest.mock("@/shared/ui/multi-sidebar", () => ({
  MultiSidebarTrigger: ({ children, side }: { side: string; children?: React.ReactNode }) => (
    <button data-testid="multi-sidebar-trigger" data-side={side}>
      {children}
    </button>
  ),
}));

jest.mock("@/shared/layout/nav-link", () => ({
  NavLink: ({ item }: { item: { title: string; url: string } }) => (
    <a data-testid="nav-link" href={item.url}>
      {item.title}
    </a>
  ),
}));

const fakeData = {
  user: { name: "u", email: "e", avatar: "/a.svg" },
  header: { logo_url: "/logo.png", brand_name: "Tasmil", tagline: "" },
  navGroups: [
    {
      items: [
        { title: "Chat", url: "/chat", icon: Bot },
        { title: "Farming", url: "/farming", icon: Tractor },
      ],
    },
  ],
};

describe("TopNavBar", () => {
  beforeEach(() => {
    pathnameMock.mockReturnValue("/farming");
  });

  it("renders the brand name without gradient class", () => {
    render(<TopNavBar sidebarData={fakeData} showRightSidebar={false} />);
    const brand = screen.getByText("Tasmil");
    expect(brand).toBeInTheDocument();
    expect(brand.className).not.toMatch(/gradient/);
    expect(brand.className).not.toMatch(/bg-clip-text/);
  });

  it("renders nav links from sidebarData", () => {
    render(<TopNavBar sidebarData={fakeData} showRightSidebar={false} />);
    const links = screen.getAllByTestId("nav-link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/chat");
    expect(links[1]).toHaveAttribute("href", "/farming");
  });

  it("renders ConnectWalletButton with variant='topbar'", () => {
    render(<TopNavBar sidebarData={fakeData} showRightSidebar={false} />);
    expect(screen.getByTestId("connect-wallet-button")).toHaveAttribute("data-variant", "topbar");
  });

  it("does NOT render CreditsPill in the top bar", () => {
    render(<TopNavBar sidebarData={fakeData} showRightSidebar={false} />);
    expect(screen.queryByTestId("credits-pill")).toBeNull();
  });

  it("renders Clock trigger on /chat route when showRightSidebar=true", () => {
    pathnameMock.mockReturnValue("/chat/new");
    render(<TopNavBar sidebarData={fakeData} showRightSidebar={true} />);
    expect(screen.getByTestId("multi-sidebar-trigger")).toHaveAttribute("data-side", "right");
  });

  it("hides Clock trigger on non-chat route even when showRightSidebar=true", () => {
    pathnameMock.mockReturnValue("/portfolio");
    render(<TopNavBar sidebarData={fakeData} showRightSidebar={true} />);
    expect(screen.queryByTestId("multi-sidebar-trigger")).toBeNull();
  });

  it("hides Clock trigger when showRightSidebar=false even on /chat", () => {
    pathnameMock.mockReturnValue("/chat/new");
    render(<TopNavBar sidebarData={fakeData} showRightSidebar={false} />);
    expect(screen.queryByTestId("multi-sidebar-trigger")).toBeNull();
  });
});
