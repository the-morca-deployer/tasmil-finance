import { render, screen } from "@testing-library/react";
import { PayoutStatusBadge } from "../PayoutStatusBadge";

describe("PayoutStatusBadge", () => {
  it("shows Pending for PENDING", () => {
    render(<PayoutStatusBadge status="PENDING" />);
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  it("shows Paid for PAID with the tx hash", () => {
    render(<PayoutStatusBadge status="PAID" paidTxHash="abc123def456" />);
    expect(screen.getByText(/paid/i)).toBeInTheDocument();
    // truncated hash is rendered
    expect(screen.getByText(/abc1/i)).toBeInTheDocument();
  });
});
