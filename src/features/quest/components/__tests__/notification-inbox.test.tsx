import { render, screen } from "@testing-library/react";
import { NotificationInbox } from "../NotificationInbox";

const listState: { data: unknown; isLoading: boolean } = { data: undefined, isLoading: false };

jest.mock("../../lib/kubb-config", () => ({ $: { query: {} } }));
jest.mock("@/gen-quest", () => ({
  useNotificationsControllerList: () => listState,
}));
jest.mock("../../store/use-quest-auth", () => ({
  useQuestAuthStore: () => ({ isAuthenticated: true }),
}));

describe("NotificationInbox", () => {
  it("renders the bell trigger when authenticated", () => {
    listState.data = { data: { items: [], total: 0 } };
    render(<NotificationInbox />);
    expect(screen.getByRole("button", { name: /notifications/i })).toBeInTheDocument();
  });
});
