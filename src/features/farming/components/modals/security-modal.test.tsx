import { render, screen } from "@testing-library/react";
import { SecurityModal } from "./security-modal";

describe("SecurityModal", () => {
  it("distinguishes session-key revocation from the vault kill switch", () => {
    render(<SecurityModal onRefresh={jest.fn()} onRevoke={jest.fn()} isPending={false} />);

    expect(screen.getByText(/permanently disables this key/i)).toBeInTheDocument();
    expect(screen.getByText(/not the vault kill switch/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Revoke Session Key" })).toBeInTheDocument();
  });
});
