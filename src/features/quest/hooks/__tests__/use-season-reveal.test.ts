import { useSeasonsControllerMyResult, useSeasonsControllerRevealAck } from "@/gen-quest";

describe("seasons reveal hooks", () => {
  it("exposes the generated seasons me + reveal-ack hooks", () => {
    expect(typeof useSeasonsControllerMyResult).toBe("function");
    expect(typeof useSeasonsControllerRevealAck).toBe("function");
  });
});
