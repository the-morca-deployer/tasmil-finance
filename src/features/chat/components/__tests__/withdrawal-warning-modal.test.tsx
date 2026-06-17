import { fireEvent, render, screen } from "@testing-library/react";
import { WithdrawalWarningModal } from "../withdrawal-warning-modal";

const vesting = {
  currentWeek: 2,
  totalWeeks: 4,
  lockedPercent: 50,
  lockedAmount: 12.5,
  unlockDate: "May 4, 2025",
};

test("shows locked amount and unlock date", () => {
  render(
    <WithdrawalWarningModal
      phase="beta"
      vesting={vesting}
      reinvestProjection={null}
      onKeepEarning={jest.fn()}
      onWithdraw={jest.fn()}
    />
  );
  expect(screen.getByText(/50% of your reward/)).toBeInTheDocument();
  expect(screen.getByText(/\$12\.5/)).toBeInTheDocument();
  expect(screen.getByText(/May 4, 2025/)).toBeInTheDocument();
});

test("Phase 3 shows compound projection", () => {
  render(
    <WithdrawalWarningModal
      phase="mainnet"
      vesting={vesting}
      reinvestProjection={{ amount: 8.3, byDate: "Jun 4, 2025" }}
      onKeepEarning={jest.fn()}
      onWithdraw={jest.fn()}
    />
  );
  expect(screen.getByText(/\+\$8\.3 more by Jun 4, 2025/)).toBeInTheDocument();
});

test("Phase 2 hides compound projection", () => {
  render(
    <WithdrawalWarningModal
      phase="beta"
      vesting={vesting}
      reinvestProjection={{ amount: 8.3, byDate: "Jun 4, 2025" }}
      onKeepEarning={jest.fn()}
      onWithdraw={jest.fn()}
    />
  );
  expect(screen.queryByText(/\+\$8\.3/)).not.toBeInTheDocument();
});

test("Keep earning calls onKeepEarning", () => {
  const onKeepEarning = jest.fn();
  render(
    <WithdrawalWarningModal
      phase="beta"
      vesting={vesting}
      reinvestProjection={null}
      onKeepEarning={onKeepEarning}
      onWithdraw={jest.fn()}
    />
  );
  fireEvent.click(screen.getByRole("button", { name: /keep earning/i }));
  expect(onKeepEarning).toHaveBeenCalled();
});

test("Withdraw anyway calls onWithdraw", () => {
  const onWithdraw = jest.fn();
  render(
    <WithdrawalWarningModal
      phase="beta"
      vesting={vesting}
      reinvestProjection={null}
      onKeepEarning={jest.fn()}
      onWithdraw={onWithdraw}
    />
  );
  fireEvent.click(screen.getByRole("button", { name: /withdraw anyway/i }));
  expect(onWithdraw).toHaveBeenCalled();
});
