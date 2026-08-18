// This suite replaces the former option-card.test.tsx: the `OptionCard`
// component was removed and its option-row rendering (labels, tag pills,
// descriptions, aria-labels, selection, empty state) now lives in `ClarifyCard`
// (a single/multi-question stepper). These tests cover that current component.

import { fireEvent, render, screen } from "@testing-library/react";
import type { ClarifyQuestion } from "@/features/chat/types/flow-messages";
import { ClarifyCard } from "../clarify-card";

const poolQuestion: ClarifyQuestion = {
  field_name: "pool",
  question: "Which pool do you want to deposit into?",
  input_type: "select",
  suggestions: [
    {
      label: "Blend USDC Pool",
      value: { protocol: "blend", asset: "USDC" },
      tags: ["recommended"],
      description: "8.2% APY, low risk",
    },
    {
      label: "Soroswap XLM/USDC",
      value: { protocol: "soroswap", pair: "XLM/USDC" },
      tags: ["il_risk"],
      description: "14.5% APY, impermanent loss risk",
    },
    {
      label: "Phoenix XLM/USDC",
      value: { protocol: "phoenix", pair: "XLM/USDC" },
      tags: ["high_tvl"],
    },
  ],
};

describe("ClarifyCard (single select question)", () => {
  it("renders the question text as a header", () => {
    render(<ClarifyCard questions={[poolQuestion]} onSubmit={jest.fn()} />);
    expect(screen.getByText("Which pool do you want to deposit into?")).toBeInTheDocument();
  });

  it("renders one option row per suggestion with its label", () => {
    render(<ClarifyCard questions={[poolQuestion]} onSubmit={jest.fn()} />);
    const rows = screen.getAllByRole("button", { name: /^Select / });
    expect(rows).toHaveLength(3);
    expect(screen.getByText("Blend USDC Pool")).toBeInTheDocument();
    expect(screen.getByText("Soroswap XLM/USDC")).toBeInTheDocument();
    expect(screen.getByText("Phoenix XLM/USDC")).toBeInTheDocument();
  });

  it("renders tag pills with the mapped label + colour classes", () => {
    render(<ClarifyCard questions={[poolQuestion]} onSubmit={jest.fn()} />);
    const recommended = screen.getByText("recommended");
    expect(recommended.className).toContain("text-emerald-400");
    expect(recommended.className).toContain("bg-emerald-400/10");

    const ilRisk = screen.getByText("IL risk");
    expect(ilRisk.className).toContain("text-amber-400");

    const highTvl = screen.getByText("high TVL");
    expect(highTvl.className).toContain("text-blue-400");
  });

  it("renders descriptions as sub-text", () => {
    render(<ClarifyCard questions={[poolQuestion]} onSubmit={jest.fn()} />);
    expect(screen.getByText("8.2% APY, low risk")).toBeInTheDocument();
    expect(screen.getByText("14.5% APY, impermanent loss risk")).toBeInTheDocument();
  });

  it("exposes each row as a button with an aria-label", () => {
    render(<ClarifyCard questions={[poolQuestion]} onSubmit={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Select Blend USDC Pool" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Select Soroswap XLM/USDC" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Select Phoenix XLM/USDC" })).toBeInTheDocument();
  });

  it("submits the selected value keyed by field_name after Continue", () => {
    const onSubmit = jest.fn();
    render(<ClarifyCard questions={[poolQuestion]} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByText("Soroswap XLM/USDC"));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({ pool: { protocol: "soroswap", pair: "XLM/USDC" } });
  });

  it("highlights the pre-selected row from initialAnswers", () => {
    render(
      <ClarifyCard
        questions={[poolQuestion]}
        onSubmit={jest.fn()}
        initialAnswers={{ pool: { protocol: "blend", asset: "USDC" } }}
      />
    );
    const selected = screen.getByRole("button", { name: "Select Blend USDC Pool" });
    expect(selected.className).toContain("bg-primary/5");
  });

  it("disables every option row when disabled", () => {
    render(<ClarifyCard questions={[poolQuestion]} onSubmit={jest.fn()} disabled />);
    for (const row of screen.getAllByRole("button", { name: /^Select / })) {
      expect(row).toBeDisabled();
    }
  });

  it("shows an empty-state message when a select question has no suggestions", () => {
    render(
      <ClarifyCard
        questions={[
          { field_name: "asset", question: "What asset?", input_type: "select", suggestions: [] },
        ]}
        onSubmit={jest.fn()}
      />
    );
    expect(screen.getByText("What asset?")).toBeInTheDocument();
    expect(screen.getByText(/No options available/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Select / })).toBeNull();
  });

  it("renders up to 6 option rows", () => {
    const many: ClarifyQuestion = {
      field_name: "opt",
      question: "Pick one",
      input_type: "select",
      suggestions: Array.from({ length: 6 }, (_, i) => ({
        label: `Option ${i + 1}`,
        value: { index: i },
      })),
    };
    render(<ClarifyCard questions={[many]} onSubmit={jest.fn()} />);
    expect(screen.getAllByRole("button", { name: /^Select / })).toHaveLength(6);
  });
});
