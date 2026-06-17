import { fireEvent, render, screen } from "@testing-library/react";
import { SuggestedPrompts } from "../suggested-prompts";

test("beta phase shows pool exploration prompts", () => {
  render(<SuggestedPrompts onSelect={jest.fn()} phase="beta" />);
  expect(screen.getByText("Top 5 highest-yield XLM pools")).toBeInTheDocument();
  expect(screen.queryByText("Show my referral earnings")).not.toBeInTheDocument();
});

test("mainnet + hasPositions shows Phase 3 prompts", () => {
  render(<SuggestedPrompts onSelect={jest.fn()} phase="mainnet" hasPositions />);
  expect(screen.getByText("What did my portfolio earn this week?")).toBeInTheDocument();
  expect(screen.getByText("Show my referral earnings")).toBeInTheDocument();
});

test("no phase falls back to existing hasPositions logic", () => {
  render(<SuggestedPrompts onSelect={jest.fn()} hasPositions />);
  expect(screen.getByText("Add to my position")).toBeInTheDocument();
});

test("onSelect called with prompt text", () => {
  const onSelect = jest.fn();
  render(<SuggestedPrompts onSelect={onSelect} phase="mainnet" hasPositions />);
  fireEvent.click(screen.getByText("What did my portfolio earn this week?"));
  expect(onSelect).toHaveBeenCalledWith("What did my portfolio earn this week?");
});
