import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ABOUT_HOME,
  ACCEPT_SMOKING,
  HOSTING_PREFERENCES,
  PARKING_DETAILS,
  SAVE,
  SPACE,
} from "features/profile/constants";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import mockRouter from "next-router-mock";
import { routeToProfile } from "routes";
import { service } from "service";
import wrapper from "test/hookWrapper";
import { getUser } from "test/serviceMockDefaults";

import { addDefaultUser, MockedService } from "../../../test/utils";
import EditHostingPreference from "./EditHostingPreference";

jest.mock("components/MarkdownInput");

const getUserMock = service.user.getUser as MockedService<
  typeof service.user.getUser
>;
const updateHostingPreferenceMock = service.user
  .updateHostingPreference as MockedService<
  typeof service.user.updateHostingPreference
>;

const renderPage = () => {
  render(<EditHostingPreference />, { wrapper });
};

describe("EditHostingPreference", () => {
  beforeEach(() => {
    addDefaultUser(1);
    getUserMock.mockImplementation(getUser);
    updateHostingPreferenceMock.mockResolvedValue(new Empty());
  });

  it("should redirect to the user profile route with 'home' tab active after successful update", async () => {
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: SAVE }));
    await waitFor(() =>
      expect(mockRouter.pathname).toBe(routeToProfile("home"))
    );
  });

  it(`should not submit the default headings for the '${ABOUT_HOME}'section`, async () => {
    getUserMock.mockImplementation(async (user) => ({
      ...(await getUser(user)),
      aboutPlace: "",
    }));
    renderPage();
    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    await userEvent.click(screen.getByRole("button", { name: SAVE }));
    await waitFor(() =>
      expect(mockRouter.pathname).toBe(routeToProfile("home"))
    );

    expect(updateHostingPreferenceMock).toHaveBeenCalledTimes(1);
    expect(updateHostingPreferenceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        aboutPlace: "",
      })
    );
  });

  it("should display the users hosting preferences", async () => {
    renderPage();

    await screen.findByText(HOSTING_PREFERENCES);

    expect(
      screen.getByLabelText(ACCEPT_SMOKING) as HTMLSelectElement
    ).toHaveValue("1");

    expect(
      screen.getByLabelText(PARKING_DETAILS) as HTMLSelectElement
    ).toHaveValue("3");

    expect(screen.getByLabelText(SPACE) as HTMLSelectElement).toHaveValue("2");
  });
});
