import { render } from "@testing-library/react";
import ReferralLandingPage from "../page";

const replace = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

it("stores the code and redirects to /quest?ref=", async () => {
  render(<ReferralLandingPage params={Promise.resolve({ code: "CODE-A" })} />);
  await new Promise((r) => setTimeout(r, 0));
  expect(localStorage.getItem("tasmil.referral.pendingCode")).toBe("CODE-A");
  expect(replace).toHaveBeenCalledWith("/quest?ref=CODE-A");
});
