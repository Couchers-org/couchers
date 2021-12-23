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
  render(<About user={user || defaultUser} />, { wrapper });
}
describe("About (user)", () => {
  it("displays both visited and lived regions", async () => {
    renderAbout();

    // Australia is displayed both for lived and visited regions
    expect(
      (await screen.findAllByText("Australia", { exact: false })).length
    ).toBe(2);
    // Sweden is only displayed for lived regions
    expect(
      (await screen.findAllByText("Sweden", { exact: false })).length
    ).toBe(1);
  });
});
