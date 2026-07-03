import { fireEvent, render, screen } from "@testing-library/react";
import { QuestVolumeList } from "../components/quest-volume-list";
import { useQuestVolume } from "../hooks/use-quest-volume";

jest.mock("../hooks/use-quest-volume", () => ({
  useQuestVolume: jest.fn(),
}));

const mockUse = useQuestVolume as unknown as jest.Mock;

type Item = {
  id: string;
  protocol: string;
  operationKind: string;
  amountUsd: number;
  walletMasked: string;
  createdAt: string;
};

function withPage(items: Item[], nextCursor: string | null = null) {
  return { pages: [{ items, nextCursor }] };
}

const rows: Item[] = [
  {
    id: "1",
    protocol: "soroswap",
    operationKind: "swap",
    amountUsd: 1234.5,
    walletMasked: "GABCD…4F7Q",
    createdAt: "2026-07-02T12:00:00.000Z",
  },
];

const base = {
  isLoading: false,
  isError: false,
  hasNextPage: false,
  isFetchingNextPage: false,
  fetchNextPage: jest.fn(),
};

beforeEach(() => mockUse.mockReset());

describe("QuestVolumeList", () => {
  it("renders a row from the hook data", () => {
    mockUse.mockReturnValue({ ...base, data: withPage(rows) });
    render(<QuestVolumeList />);

    expect(screen.getByText("soroswap")).toBeInTheDocument();
    expect(screen.getByText("GABCD…4F7Q")).toBeInTheDocument();
    expect(screen.getByText("$1,235")).toBeInTheDocument();
  });

  it("shows skeletons while loading", () => {
    mockUse.mockReturnValue({ ...base, isLoading: true, data: undefined });
    render(<QuestVolumeList />);

    expect(screen.getByTestId("qv-loading")).toBeInTheDocument();
  });

  it("shows the empty state when there are no items", () => {
    mockUse.mockReturnValue({ ...base, data: withPage([]) });
    render(<QuestVolumeList />);

    expect(screen.getByText("No quest volume yet.")).toBeInTheDocument();
  });

  it("renders Load more and calls fetchNextPage on click", () => {
    const fetchNextPage = jest.fn();
    mockUse.mockReturnValue({
      ...base,
      data: withPage(rows, "cursor2"),
      hasNextPage: true,
      fetchNextPage,
    });
    render(<QuestVolumeList />);

    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(fetchNextPage).toHaveBeenCalled();
  });
});
