import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Switch } from "react-router-dom";
import { userRoute } from "routes";
import { service } from "service";
import wrapper from "test/hookWrapper";
import { getUser } from "test/serviceMockDefaults";

import { addDefaultUser, MockedService } from "../../../test/utils";
import { SAVE } from "../../constants";
import EditHostingPreference from "./EditHostingPreference";

const mockProfilePage = "Mock Profile Page";
const getUserMock = service.user.getUser as MockedService<
  typeof service.user.getUser
>;
const MockProfileComponent = () => <div title={mockProfilePage} />;

describe("EditHostingPreference", () => {
  beforeEach(() => {
    getUserMock.mockImplementation(getUser);
    addDefaultUser();
  });

  it("should redirect to Profile route after successful update", async () => {
    render(
      <Switch>
        <Route path={userRoute}>
          <MockProfileComponent />
        </Route>
        <Route>
          <EditHostingPreference />
        </Route>
      </Switch>,
      { wrapper }
    );

    userEvent.click(await screen.findByRole("button", { name: SAVE }));

    expect(await screen.findByTitle(mockProfilePage)).toBeInTheDocument();
  });
});
