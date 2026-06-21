import { render, screen } from "@testing-library/react";
import { QuestHeaderBadges } from "../QuestHeaderBadges";

const mockGetMe = jest.fn();
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));
jest.mock("@/gen-quest/hooks", () => ({
  useUsersControllerGetMe: () => mockGetMe(),
  useUsersControllerGetCheckInStatus: () => ({ data: { data: { canCheckIn: true } } }),
  useUsersControllerDailyLogin: () => ({ mutate: jest.fn(), isPending: false }),
  usersControllerGetMeQueryKey: () => ["users", "me"],
}));

describe("QuestHeaderBadges", () => {
  it("renders points and streak when a quest profile exists", () => {
    mockGetMe.mockReturnValue({ data: { data: { totalPoints: 10, loginStreak: 1 } } });
    render(<QuestHeaderBadges />);
    expect(screen.getByTestId("quest-points-badge")).toHaveTextContent("10");
    expect(screen.getByTestId("quest-streak-badge")).toHaveTextContent("1");
  });

  it("renders nothing when there is no quest profile", () => {
    mockGetMe.mockReturnValue({ data: undefined });
    const { container } = render(<QuestHeaderBadges />);
    expect(container).toBeEmptyDOMElement();
  });
});
