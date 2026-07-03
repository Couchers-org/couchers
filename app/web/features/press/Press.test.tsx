import { render, screen } from "@testing-library/react";
import { useListVolunteers } from "features/communities/hooks";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

import Press from "./Press";

const { t } = i18n;

jest.mock("../dashboard/Hero/HeroImageAttribution", () => () => null);
jest.mock("features/communities/hooks");

const mockUseListVolunteers = useListVolunteers as jest.MockedFunction<
  typeof useListVolunteers
>;

describe("Press", () => {
  beforeEach(() => {
    mockUseListVolunteers.mockReturnValue({
      data: { currentVolunteersList: [], pastVolunteersList: [] },
      isLoading: false,
    } as unknown as ReturnType<typeof useListVolunteers>);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          userCount: "80000",
          lastSignup: "2024-01-01T00:00:00Z",
          lastLocation: "Berlin",
        }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders all sections", async () => {
    render(<Press />, { wrapper });
    expect(
      screen.getByRole("heading", { level: 1, name: t("press:hero_title") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: t("press:facts_subheading"),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: t("press:about_subheading"),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: t("press:download_subheading"),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: t("press:team_subheading"),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: t("press:social_media_subheading"),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: t("press:press_coverage_subheading"),
      }),
    ).toBeInTheDocument();
  });
});
