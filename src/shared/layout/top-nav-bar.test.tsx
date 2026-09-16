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

jest.mock("@/shared/layout/nav-link", () => ({
  NavLink: ({ item }: { item: { title: string; url: string } }) => (
    <a data-testid="nav-link" href={item.url}>
      {item.title}
    </a>
  ),
}));

// QuestHeaderBadges and SponsorIndicator each call react-query hooks; mock them
// so this suite can render TopNavBar's own layout without a QueryClientProvider.
jest.mock("@/features/quest/components/QuestHeaderBadges", () => ({
  QuestHeaderBadges: () => <div data-testid="quest-header-badges" />,
}));

jest.mock("@/features/sponsorship/components/sponsor-indicator", () => ({
  SponsorIndicator: () => null,
}));

const fakeData = {
  user: { name: "u", email: "e", avatar: "/a.svg" },
  header: { logo_url: "/logo.png", brand_name: "Tasmil Finance", tagline: "" },
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

  it("renders the brand from sidebarData and links it home", () => {
    render(<TopNavBar sidebarData={fakeData} />);
    // Brand rendering moved into <BrandLogo/>; its gradient is now an inline
    // style rather than tailwind shimmer classes, so assert the behaviour that
    // actually matters: the brand text and logo come from sidebarData.header and
    // the whole lockup is a link back into the app.
    const brand = screen.getByText(fakeData.header.brand_name);
    expect(brand).toBeInTheDocument();
    const link = brand.closest("a");
    expect(link).toHaveAttribute("href", "/chat/new");
    expect(link?.querySelector("img")).toBeInTheDocument();
  });

  it("renders nav links from sidebarData", () => {
    render(<TopNavBar sidebarData={fakeData} />);
    const links = screen.getAllByTestId("nav-link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/chat");
    expect(links[1]).toHaveAttribute("href", "/farming");
  });

  it("renders ConnectWalletButton with variant='topbar'", () => {
    render(<TopNavBar sidebarData={fakeData} />);
    expect(screen.getByTestId("connect-wallet-button")).toHaveAttribute("data-variant", "topbar");
  });

  it("does NOT render CreditsPill in the top bar", () => {
    render(<TopNavBar sidebarData={fakeData} />);
    expect(screen.queryByTestId("credits-pill")).toBeNull();
  });

  it("does NOT render the Clock chat-history trigger on any route", () => {
    pathnameMock.mockReturnValue("/chat/new");
    const { container } = render(<TopNavBar sidebarData={fakeData} showRightSidebar={true} />);
    expect(container.querySelector("svg.lucide-clock")).toBeNull();
  });
});
