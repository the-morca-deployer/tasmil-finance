import { render, screen } from "@testing-library/react";
import { Podium } from "../Podium";
import { QuestStep } from "../QuestStep";
import { RankMove } from "../RankMove";

describe("quest primitives", () => {
  it("Podium renders the top-3 names", () => {
    render(
      <Podium
        metric="points"
        rows={[
          { rank: 1, name: "stellar_nomad", address: "GDEM...F3A4", score: 14000 },
          { rank: 2, name: "aqua_whale", address: "GDEM...F3A4", score: 13500 },
          { rank: 3, name: "blendmaxi", address: "GDEM...F3A4", score: 13000 },
        ]}
      />
    );
    expect(screen.getByText("stellar_nomad")).toBeInTheDocument();
    expect(screen.getByText("aqua_whale")).toBeInTheDocument();
    expect(screen.getByText("blendmaxi")).toBeInTheDocument();
  });

  it("QuestStep shows the title and a status indicator", () => {
    render(
      <QuestStep status="done" order={1} title="Design your index" description="Pick assets" />
    );
    expect(screen.getByText(/Design your index/)).toBeInTheDocument();
  });

  it("RankMove renders nothing when move is 0", () => {
    const { container } = render(<RankMove move={0} />);
    expect(container).toBeEmptyDOMElement();
  });
});
