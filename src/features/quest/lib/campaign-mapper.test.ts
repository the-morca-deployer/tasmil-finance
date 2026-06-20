import { mapTaskState } from "./campaign-mapper";

describe("mapTaskState", () => {
  it("idle for PENDING or no record", () => {
    expect(mapTaskState({ status: "PENDING" })).toBe("idle");
    expect(mapTaskState({})).toBe("idle");
    expect(mapTaskState({ status: null })).toBe("idle");
  });
  it("verifying for IN_PROGRESS", () => {
    expect(mapTaskState({ status: "IN_PROGRESS" })).toBe("verifying");
  });
  it("claimable for COMPLETED / APPROVED", () => {
    expect(mapTaskState({ status: "COMPLETED" })).toBe("claimable");
    expect(mapTaskState({ status: "APPROVED" })).toBe("claimable");
  });
  it("claimed when claimed flag or CLAIMED status", () => {
    expect(mapTaskState({ status: "CLAIMED" })).toBe("claimed");
    expect(mapTaskState({ status: "COMPLETED", claimed: true })).toBe("claimed");
  });
  it("error when verify failed and not yet completed", () => {
    expect(mapTaskState({ status: "PENDING", verifyFailed: true })).toBe("error");
  });
  it("claimed wins over verifyFailed", () => {
    expect(mapTaskState({ status: "CLAIMED", verifyFailed: true })).toBe("claimed");
  });
  it("is case-insensitive on status", () => {
    expect(mapTaskState({ status: "completed" })).toBe("claimable");
  });
});
