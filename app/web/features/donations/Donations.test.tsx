import { useFeatureValue } from "@growthbook/growthbook-react";
import { render, screen } from "@testing-library/react";
import Donations from "features/donations/Donations";
import useDonationStats from "features/donations/useDonationStats";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

const { t } = i18n;

jest.mock("@growthbook/growthbook-react", () => ({
  ...jest.requireActual("@growthbook/growthbook-react"),
  useFeatureValue: jest.fn(),
}));
jest.mock("features/donations/useDonationStats");

const mockUseFeatureValue = useFeatureValue as jest.MockedFunction<typeof useFeatureValue>;
const mockUseDonationStats = useDonationStats as jest.MockedFunction<typeof useDonationStats>;

const DRIVE_START = Date.UTC(2026, 11, 1); // Dec 1, 2026
const DRIVE_END = Date.UTC(2026, 11, 31); // Dec 31, 2026

function renderWithDrive(nowMs: number, { start = DRIVE_START / 1000, end = 0 } = {}) {
  jest.spyOn(Date, "now").mockReturnValue(nowMs);
  const flags: Record<string, number> = { donation_drive_start: start, donation_drive_end: end };
  mockUseFeatureValue.mockImplementation((key, fallback) => (key in flags ? flags[key] : fallback));
  render(<Donations />, { wrapper });
}

const progressBar = () => screen.queryByRole("progressbar", { name: t("global:donation_banner.progress_label") });

describe("Donations", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    mockUseDonationStats.mockReturnValue({
      data: { totalDonatedYtd: 9000, goal: 15000 },
      isLoading: false,
    } as ReturnType<typeof useDonationStats>);
  });

  it("doesn't show the donation drive before its start time", () => {
    renderWithDrive(DRIVE_START - 1000);

    expect(progressBar()).not.toBeInTheDocument();
  });

  it("shows the donation drive once its start time has passed", () => {
    renderWithDrive(DRIVE_START + 1000);

    expect(progressBar()).toBeVisible();
  });

  it("doesn't show the donation drive when there's no drive", () => {
    renderWithDrive(DRIVE_START + 1000, { start: 0 });

    expect(progressBar()).not.toBeInTheDocument();
  });

  it("shows the donation drive before its end time", () => {
    renderWithDrive(DRIVE_END - 1000, { end: DRIVE_END / 1000 });

    expect(progressBar()).toBeVisible();
  });

  it("doesn't show the donation drive after its end time", () => {
    renderWithDrive(DRIVE_END + 1000, { end: DRIVE_END / 1000 });

    expect(progressBar()).not.toBeInTheDocument();
  });

  it("says until when the drive runs", () => {
    renderWithDrive(DRIVE_START + 1000, { end: Date.UTC(2027, 0, 2) / 1000 });

    expect(screen.getByText(/Until 2 January, we are raising \$15,000/)).toBeVisible();
  });

  it("leaves out the end date when the drive has no end", () => {
    renderWithDrive(DRIVE_START + 1000);

    expect(screen.getByText(/We are raising \$15,000 to cover/)).toBeVisible();
  });
});
