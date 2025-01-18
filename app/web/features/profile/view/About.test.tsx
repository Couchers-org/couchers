import { render, screen } from "@testing-library/react";
import { User } from "proto/api_pb";
import { service } from "service";
import wrapper from "test/hookWrapper";
import { getLanguages, getRegions } from "test/serviceMockDefaults";

import About from "./About";

const getLanguagesMock = service.resources.getLanguages as jest.MockedFunction<
  typeof service.resources.getLanguages
>;

const getRegionsMock = service.resources.getRegions as jest.MockedFunction<
  typeof service.resources.getRegions
>;

beforeEach(() => {
  getLanguagesMock.mockImplementation(getLanguages);
  getRegionsMock.mockImplementation(getRegions);
});

function renderAbout(user?: User.AsObject) {
  return render(<About user={user || defaultUser} />, { wrapper });
}
describe("About (user)", () => {
  it("displays both visited and lived regions", async () => {
    renderAbout();

    // Australia is displayed both for lived and visited regions
    expect(
      (await screen.findAllByText("Australia", { exact: false })).length,
    ).toBe(2);
    // Sweden is only displayed for lived regions
    expect(
      (await screen.findAllByText("Sweden", { exact: false })).length,
    ).toBe(1);
  });

  it("should display age and gender without verification icons when unspecified ", async () => {
    renderAbout({
      ...defaultUser,
      genderVerificationStatus: 0,
      birthdateVerificationStatus: 0,
    });

    const checkIcon = screen.queryByTestId("check-circle-icon");
    expect(checkIcon).toBeNull();
    const errorIcon = screen.queryByTestId("error-icon");
    expect(errorIcon).toBeNull();
  });
  it("should display age and gender without verification icons when unverified", async () => {
    renderAbout({
      ...defaultUser,
      genderVerificationStatus: 1,
      birthdateVerificationStatus: 1,
    });

    const checkIcon = screen.queryByTestId("check-circle-icon");
    expect(checkIcon).toBeNull();
    const errorIcon = screen.queryByTestId("error-icon");
    expect(errorIcon).toBeNull();
  });

  it("should display verification ticks when verified", async () => {
    renderAbout({
      ...defaultUser,
      genderVerificationStatus: 2,
      birthdateVerificationStatus: 2,
    });

    const checkIcons = screen.queryAllByTestId("check-circle-icon");
    expect(checkIcons.length).toEqual(2);
    const errorIcon = screen.queryByTestId("error-icon");
    expect(errorIcon).toBeNull();
  });

  it("should display error icons when mismatched", async () => {
    renderAbout({
      ...defaultUser,
      genderVerificationStatus: 3,
      birthdateVerificationStatus: 3,
    });

    const checkIcons = screen.queryByTestId("check-circle-icon");
    expect(checkIcons).toBeNull();
    const errorIcons = screen.queryAllByTestId("error-icon");
    expect(errorIcons.length).toEqual(2);
  });

  it("displays None when there are no regions", async () => {
    renderAbout({
      ...defaultUser,
      regionsVisitedList: [],
      regionsLivedList: [],
    });
    expect((await screen.findAllByText("None")).length).toBe(2);
  });
});
