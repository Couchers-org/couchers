import { UseQueryResult } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { RpcError } from "grpc-web";
import { GetVolunteersRes, Volunteer } from "proto/public_pb";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import useSignupPageInfo, { SignupInfo } from "utils/useSignupPageInfo";

import Facts from "./Facts";

const { t } = i18n;

jest.mock("utils/useSignupPageInfo");

const mockUseSignupPageInfo = useSignupPageInfo as jest.MockedFunction<
  typeof useSignupPageInfo
>;

const makeVolunteers = (
  current: Volunteer.AsObject[] = [],
  past: Volunteer.AsObject[] = [],
  isLoading = false,
) =>
  ({
    data: { currentVolunteersList: current, pastVolunteersList: past },
    isLoading,
  }) as UseQueryResult<GetVolunteersRes.AsObject, RpcError>;

const mockSignupInfo: SignupInfo = {
  userCount: "80000",
  lastSignup: "2024-01-01T00:00:00Z",
  lastLocation: "Berlin",
};

const mockHook = (signupInfo: SignupInfo | null, isLoading = false) => {
  mockUseSignupPageInfo.mockReturnValue({ signupInfo, isLoading });
};

describe("Facts", () => {
  beforeEach(() => {
    mockHook(mockSignupInfo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("shows skeletons while loading and hides stat text", () => {
    mockHook(null, true);
    const { container } = render(<Facts volunteers={makeVolunteers()} />, {
      wrapper,
    });
    expect(container.querySelectorAll(".MuiSkeleton-root")).toHaveLength(4);
    expect(screen.queryByText(/members/)).not.toBeInTheDocument();
    expect(screen.queryByText(/countries/)).not.toBeInTheDocument();
    expect(screen.queryByText(/volunteers/)).not.toBeInTheDocument();
  });

  it("shows skeletons while volunteers are loading", () => {
    const { container } = render(
      <Facts volunteers={makeVolunteers([], [], true)} />,
      { wrapper },
    );
    expect(container.querySelectorAll(".MuiSkeleton-root")).toHaveLength(4);
  });

  it("shows user count from the signup info", () => {
    render(<Facts volunteers={makeVolunteers()} />, { wrapper });
    expect(
      screen.getByText(t("landing:num_users2", { count: 80000 })),
    ).toBeInTheDocument();
  });

  it("falls back to 77000 when signup info is unavailable", () => {
    mockHook(null);
    render(<Facts volunteers={makeVolunteers()} />, { wrapper });
    expect(
      screen.getByText(t("landing:num_users2", { count: 77000 })),
    ).toBeInTheDocument();
  });

  it("falls back to 77000 when userCount is not a valid number", () => {
    mockHook({ ...mockSignupInfo, userCount: "bad" });
    render(<Facts volunteers={makeVolunteers()} />, { wrapper });
    expect(
      screen.getByText(t("landing:num_users2", { count: 77000 })),
    ).toBeInTheDocument();
  });

  it("shows countries count", () => {
    render(<Facts volunteers={makeVolunteers()} />, { wrapper });
    expect(
      screen.getByText(t("landing:num_countries2", { count: 180 })),
    ).toBeInTheDocument();
  });

  it("shows last signup when lastSignup is present", () => {
    render(<Facts volunteers={makeVolunteers()} />, { wrapper });
    expect(screen.getByText(/Last signup/)).toBeInTheDocument();
  });

  it("hides last signup stat when lastSignup is absent", () => {
    mockHook({ ...mockSignupInfo, lastSignup: "" });
    render(<Facts volunteers={makeVolunteers()} />, { wrapper });
    expect(screen.queryByText(/Last signup/)).not.toBeInTheDocument();
  });

  it("shows combined current and past volunteer count", () => {
    const current = Array(4).fill({}) as Volunteer.AsObject[];
    const past = Array(2).fill({}) as Volunteer.AsObject[];
    render(<Facts volunteers={makeVolunteers(current, past)} />, { wrapper });
    expect(
      screen.getByText(t("press:num_volunteers2", { count: 6 })),
    ).toBeInTheDocument();
  });
});
