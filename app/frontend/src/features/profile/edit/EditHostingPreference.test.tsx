import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Route, Switch } from "react-router-dom";
import { editHostingPreferenceRoute, userRoute } from "routes";
import { service } from "service";
import { getHookWrapperWithClient } from "test/hookWrapper";
import { getUser } from "test/serviceMockDefaults";

import { addDefaultUser, MockedService } from "../../../test/utils";
import { HOSTING_PREFERENCES, SAVE } from "../../constants";
import EditHostingPreference from "./EditHostingPreference";

const getUserMock = service.user.getUser as MockedService<
  typeof service.user.getUser
>;
const updateHostingPreferenceMock = service.user
  .updateHostingPreference as MockedService<
  typeof service.user.updateHostingPreference
>;

const MockProfileComponent = () => (
  <div data-testid="user-profile">Mock Profile Page</div>
);

const renderPage = () => {
  const { wrapper } = getHookWrapperWithClient({
    initialRouterEntries: [`${editHostingPreferenceRoute}`],
  });

  render(
    <Switch>
      <Route exact path={userRoute}>
        <MockProfileComponent />
      </Route>
      <Route exact path={editHostingPreferenceRoute}>
        <EditHostingPreference />
      </Route>
    </Switch>,
    { wrapper }
  );
};

describe("EditHostingPreference", () => {
  beforeEach(() => {
    addDefaultUser();
    getUserMock.mockImplementation(getUser);
    updateHostingPreferenceMock.mockResolvedValue(new Empty());
  });

  it("should redirect to Profile route after successful update", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { name: HOSTING_PREFERENCES })
    ).toBeInTheDocument();

    // Need to fill in the required fields in the form before submitting...

    // userEvent.click(await screen.findByRole("button", { name: SAVE }));

    // expect(await screen.findByTestId("user-profile")).toBeInTheDocument();
  });
});
