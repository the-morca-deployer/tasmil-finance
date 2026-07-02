import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { ExportCsvButton } from "@/shared/components/export-csv-button";
import { adminDownload } from "@/shared/lib/admin-download";

jest.mock("@/shared/lib/admin-download", () => ({ adminDownload: jest.fn() }));
jest.mock("sonner", () => ({ toast: { error: jest.fn() } }));

const mockDownload = adminDownload as jest.Mock;

describe("ExportCsvButton", () => {
  beforeEach(() => {
    mockDownload.mockReset();
    (toast.error as jest.Mock).mockReset();
  });

  it("downloads from the endpoint with params as a query string", async () => {
    mockDownload.mockResolvedValue(undefined);
    render(
      <ExportCsvButton endpoint="/api/admin/waitlist/entries/export" params={{ search: "gab" }} />
    );
    fireEvent.click(screen.getByRole("button", { name: /export csv/i }));
    await waitFor(() =>
      expect(mockDownload).toHaveBeenCalledWith("/api/admin/waitlist/entries/export?search=gab")
    );
  });

  it("downloads from the bare endpoint when no params given", async () => {
    mockDownload.mockResolvedValue(undefined);
    render(<ExportCsvButton endpoint="/api/admin/codes/export" />);
    fireEvent.click(screen.getByRole("button", { name: /export csv/i }));
    await waitFor(() => expect(mockDownload).toHaveBeenCalledWith("/api/admin/codes/export"));
  });

  it("disables while the download is in flight", async () => {
    let release: () => void = () => {};
    mockDownload.mockImplementation(() => new Promise<void>((r) => (release = r)));
    render(<ExportCsvButton endpoint="/api/admin/codes/export" />);
    const btn = screen.getByRole("button", { name: /export csv/i });
    fireEvent.click(btn);
    await waitFor(() => expect(btn).toBeDisabled());
    release();
    await waitFor(() => expect(btn).not.toBeDisabled());
  });

  it("shows an error toast when the download fails", async () => {
    mockDownload.mockRejectedValue(new Error("Service unavailable"));
    render(<ExportCsvButton endpoint="/api/admin/codes/export" />);
    fireEvent.click(screen.getByRole("button", { name: /export csv/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Service unavailable"));
  });
});
