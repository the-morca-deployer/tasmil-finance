import { render, screen } from "@testing-library/react";
import { InfoBar } from "../info-bar";

test("renders APY comparison text", () => {
  render(<InfoBar currentApy={8.2} marketApy={6.5} />);
  expect(screen.getByText(/8\.2% APY on Tasmil/)).toBeInTheDocument();
  expect(screen.getByText(/market average of 6\.5%/)).toBeInTheDocument();
});
