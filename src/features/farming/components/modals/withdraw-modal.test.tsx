import { render, screen } from "@testing-library/react";
import { WithdrawModal } from "./withdraw-modal";

function setup(amount: string, available = 100) {
  return render(
    <WithdrawModal
      availableUsd={available}
      lockedUsd={0}
      amount={amount}
      onAmountChange={() => {}}
      onSubmit={() => {}}
      isPending={false}
    />
  );
}

describe("WithdrawModal", () => {
  it("shows over-limit error when amount > available", () => {
    setup("999", 100);
    expect(screen.getByText(/exceeds available balance/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /withdraw/i })).toBeDisabled();
  });

  it("hides error when amount within available", () => {
    setup("50", 100);
    expect(screen.queryByText(/exceeds available balance/i)).toBeNull();
    expect(screen.getByRole("button", { name: /withdraw/i })).not.toBeDisabled();
  });

  it("hides error on empty input", () => {
    setup("", 100);
    expect(screen.queryByText(/exceeds available balance/i)).toBeNull();
  });
});
