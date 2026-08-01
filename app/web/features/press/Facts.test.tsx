import { render, screen } from "@testing-library/react";
import { Volunteer } from "couchers/proto/public_pb";
import { useListVolunteers } from "features/communities/hooks";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import useSignupPageInfo, { SignupInfo } from "utils/useSignupPageInfo";

import Facts from "./Facts";

const { t } = i18n;

jest.mock("utils/useSignupPageInfo");
jest.mock("features/communities/hooks");

const mockUseSignupPageInfo = useSignupPageInfo as jest.MockedFunction<
  typeof useSignupPageInfo
>;
const mockUseListVolunteers = useListVolunteers as jest.MockedFunction<
  typeof useListVolunteers
>;

const mockSignupInfo: SignupInfo = {
  userCount: "80000",
  lastSignup: "2024-01-01T00:00:00Z",
  lastLocation: "Berlin",
};

const mockSignupPageInfo = (
  signupInfo: SignupInfo | null,
  isLoading = false,
) => {
  mockUseSignupPageInfo.mockReturnValue({ signupInfo, isLoading });
};

const mockVolunteers = (
  current: Volunteer.AsObject[] = [],
  past: Volunteer.AsObject[] = [],
  isLoading = false,
) => {
  mockUseListVolunteers.mockReturnValue({
    data: { currentVolunteersList: current, pastVolunteersList: past },
    isLoading,
  } as ReturnType<typeof useListVolunteers>);
};

describe("Facts", () => {
  beforeEach(() => {
    mockSignupPageInfo(mockSignupInfo);
    mockVolunteers();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("shows skeletons while signup info is loading and hides stat text", () => {
    mockSignupPageInfo(null, true);
    const { container } = render(<Facts />, { wrapper });
    expect(container.querySelectorAll(".MuiSkeleton-root")).toHaveLength(4);
    expect(screen.queryByText(/members/)).not.toBeInTheDocument();
    expect(screen.queryByText(/countries/)).not.toBeInTheDocument();
    expect(screen.queryByText(/volunteers/)).not.toBeInTheDocument();
  });

  it("shows skeletons while volunteers are loading", () => {
    mockVolunteers([], [], true);
    const { container } = render(<Facts />, { wrapper });
    expect(container.querySelectorAll(".MuiSkeleton-root")).toHaveLength(4);
  });

  it("shows user count from the signup info", () => {
    render(<Facts />, { wrapper });
    expect(
      screen.getByText(t("landing:num_users2", { count: 80000 })),
    ).toBeInTheDocument();
  });

  it("falls back to 77000 when signup info is unavailable", () => {
    mockSignupPageInfo(null);
    render(<Facts />, { wrapper });
    expect(
      screen.getByText(t("landing:num_users2", { count: 77000 })),
    ).toBeInTheDocument();
  });

  it("falls back to 77000 when userCount is not a valid number", () => {
    mockSignupPageInfo({ ...mockSignupInfo, userCount: "bad" });
    render(<Facts />, { wrapper });
    expect(
      screen.getByText(t("landing:num_users2", { count: 77000 })),
    ).toBeInTheDocument();
  });

  it("shows countries count", () => {
    render(<Facts />, { wrapper });
    expect(
      screen.getByText(t("landing:num_countries2", { count: 180 })),
    ).toBeInTheDocument();
  });

  it("shows last signup when lastSignup is present", () => {
    render(<Facts />, { wrapper });
    expect(screen.getByText(/Last signup/)).toBeInTheDocument();
  });

  it("hides last signup stat when lastSignup is absent", () => {
    mockSignupPageInfo({ ...mockSignupInfo, lastSignup: "" });
    render(<Facts />, { wrapper });
    expect(screen.queryByText(/Last signup/)).not.toBeInTheDocument();
  });

  it("shows combined current and past volunteer count", () => {
    const current = Array(4).fill({}) as Volunteer.AsObject[];
    const past = Array(2).fill({}) as Volunteer.AsObject[];
    mockVolunteers(current, past);
    render(<Facts />, { wrapper });
    expect(
      screen.getByText(t("press:num_volunteers", { count: 6 })),
    ).toBeInTheDocument();
  });
});
