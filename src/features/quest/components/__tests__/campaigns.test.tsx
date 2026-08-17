import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Campaigns from "../Campaigns";

// Shape note: the quest axios client strips the backend's `{ success, data }`
// envelope in a response interceptor, and the generated client returns
// `res.data`, so the hook's `data` is the bare `{ items, meta }` payload. The
// previous mock nested an extra `data` key with no `success` flag, which
// mapApiCampaignsResponse rejected on both branches - it always mapped to an
// empty list, so nothing in this suite ever exercised a campaign card.
jest.mock("@/gen-quest/hooks", () => ({
  useCampaignsControllerFindAll: () => ({
    data: {
      items: [
        {
          id: "c1",
          title: "Index Builder",
          isActive: true,
          endAt: "2030-01-01T00:00:00Z",
          rewardPoints: 450,
        },
      ],
      meta: { total: 1, page: 1, limit: 20 },
    },
    isLoading: false,
  }),
}));

describe("Campaigns", () => {
  // Campaigns holds a 650ms skeleton after mount before it renders cards, so the
  // list assertions below need the timer flushed.
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("filters the campaign list from the All/Ongoing/Closed toggle", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<Campaigns />);
    act(() => {
      jest.advanceTimersByTime(700);
    });

    // The filter toggle is a row of plain <button>s, not Radix role="tab".
    for (const name of [/^all$/i, /^ongoing$/i, /^closed$/i]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }

    // The single fixture campaign is active and ends in 2030, so it shows under
    // "All" and "Ongoing" but must disappear under "Closed".
    expect(screen.getByText("Index Builder")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^ongoing$/i }));
    expect(screen.getByText("Index Builder")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^closed$/i }));
    expect(screen.queryByText("Index Builder")).not.toBeInTheDocument();
  });
});
