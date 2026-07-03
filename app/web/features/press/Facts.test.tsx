import { UseQueryResult } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { RpcError } from "grpc-web";
import { GetVolunteersRes, Volunteer } from "proto/public_pb";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";

import Facts from "./Facts";

const { t } = i18n;

const makeVolunteers = (
  current: Volunteer.AsObject[] = [],
  past: Volunteer.AsObject[] = [],
  isLoading = false,
) =>
  ({
    data: { currentVolunteersList: current, pastVolunteersList: past },
    isLoading,
  }) as UseQueryResult<GetVolunteersRes.AsObject, RpcError>;

const mockSignupInfo = {
  userCount: "80000",
  lastSignup: "2024-01-01T00:00:00Z",
  lastLocation: "Berlin",
};

describe("Facts", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSignupInfo),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows skeletons while loading and hides stat text", () => {
    const { container } = render(
      <Facts volunteers={makeVolunteers([], [], true)} />,
      { wrapper },
    );
    expect(container.querySelectorAll(".MuiSkeleton-root")).toHaveLength(4);
    expect(screen.queryByText(/members/)).not.toBeInTheDocument();
    expect(screen.queryByText(/countries/)).not.toBeInTheDocument();
    expect(screen.queryByText(/volunteers/)).not.toBeInTheDocument();
  });

  it("shows user count from API", async () => {
    render(<Facts volunteers={makeVolunteers()} />, { wrapper });
    expect(
      await screen.findByText(t("landing:num_users2", { count: 80000 })),
    ).toBeInTheDocument();
  });

  it("falls back to 77000 when fetch fails", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
    render(<Facts volunteers={makeVolunteers()} />, { wrapper });
    expect(
      await screen.findByText(t("landing:num_users2", { count: 77000 })),
    ).toBeInTheDocument();
  });

  it("falls back to 77000 when the response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    });
    render(<Facts volunteers={makeVolunteers()} />, { wrapper });
    expect(
      await screen.findByText(t("landing:num_users2", { count: 77000 })),
    ).toBeInTheDocument();
  });

  it("falls back to 77000 when userCount is not a valid number", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ...mockSignupInfo, userCount: "bad" }),
    });
    render(<Facts volunteers={makeVolunteers()} />, { wrapper });
    expect(
      await screen.findByText(t("landing:num_users2", { count: 77000 })),
    ).toBeInTheDocument();
  });

  it("shows countries count", async () => {
    render(<Facts volunteers={makeVolunteers()} />, { wrapper });
    expect(
      await screen.findByText(t("landing:num_countries2", { count: 180 })),
    ).toBeInTheDocument();
  });

  it("shows last signup when lastSignup is present", async () => {
    render(<Facts volunteers={makeVolunteers()} />, { wrapper });
    expect(await screen.findByText(/Last signup/)).toBeInTheDocument();
  });

  it("hides last signup stat when lastSignup is absent", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ...mockSignupInfo, lastSignup: "" }),
    });
    render(<Facts volunteers={makeVolunteers()} />, { wrapper });
    await screen.findByText(/members/);
    expect(screen.queryByText(/Last signup/)).not.toBeInTheDocument();
  });

  it("shows combined current and past volunteer count", async () => {
    const current = Array(4).fill({}) as Volunteer.AsObject[];
    const past = Array(2).fill({}) as Volunteer.AsObject[];
    render(<Facts volunteers={makeVolunteers(current, past)} />, { wrapper });
    expect(
      await screen.findByText(t("press:num_volunteers2", { count: 6 })),
    ).toBeInTheDocument();
  });
});
