import { render, screen } from "@testing-library/react";
import { DropdownMenu, DropdownMenuContent } from "@/shared/ui/dropdown-menu";
import { ReplayMenuItem } from "./replay-menu-item";

jest.mock("@/features/onboarding/config/feature-flag", () => ({
  ONBOARDING_ENABLED: false,
}));

describe("ReplayMenuItem with ONBOARDING_ENABLED=false", () => {
  it("renders nothing", () => {
    render(
      <DropdownMenu open>
        <DropdownMenuContent>
          <ReplayMenuItem />
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.queryByTestId("replay-onboarding")).toBeNull();
  });
});
