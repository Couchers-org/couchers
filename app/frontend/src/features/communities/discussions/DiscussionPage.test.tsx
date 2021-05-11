import {
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getProfileLinkA11yLabel } from "components/Avatar/constants";
import { Route, Switch } from "react-router-dom";
import { discussionBaseRoute, discussionRoute } from "routes";
import { service } from "service";
import discussions from "test/fixtures/discussions.json";
import threadRes from "test/fixtures/getThreadRes.json";
import { getHookWrapperWithClient } from "test/hookWrapper";
import { getUser } from "test/serviceMockDefaults";
import { assertErrorAlert, mockConsoleError, MockedService } from "test/utils";

import { PREVIOUS_PAGE } from "../constants";
import DiscussionPage from "./DiscussionPage";

const getUserMock = service.user.getUser as MockedService<
  typeof service.user.getUser
>;
const getDiscussionMock = service.discussions.getDiscussion as MockedService<
  typeof service.discussions.getDiscussion
>;
const getThreadMock = service.threads.getThread as MockedService<
  typeof service.threads.getThread
>;

function renderDiscussion() {
  const { client, wrapper } = getHookWrapperWithClient({
    initialRouterEntries: [
      "/previous-page",
      `${discussionBaseRoute}/1/what-is-there-to-do-in-amsterdam`,
    ],
    initialIndex: 1,
  });
  render(
    <Switch>
      <Route exact path={discussionRoute}>
        <DiscussionPage />
      </Route>
      <Route exact path="/previous-page">
        <h1 data-testid="previous-page">Previous page</h1>
      </Route>
    </Switch>,
    { wrapper }
  );

  return client;
}

describe("Discussion page", () => {
  beforeEach(() => {
    getUserMock.mockImplementation(getUser);
    getDiscussionMock.mockResolvedValue(discussions[0]);
    getThreadMock.mockResolvedValue(threadRes);
  });

  it("renders the discussion successfully", async () => {
    renderDiscussion();

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    // Author and discussion content assertions
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "What is there to do in Amsterdam?",
      })
    ).toBeVisible();
    expect(
      screen.getByText(/i'm looking for activities to do here!/i)
    ).toBeVisible();
    expect(screen.getByText("Funny Cat current User")).toBeVisible();
    expect(screen.getByText("Created at Jan 01, 2020")).toBeVisible();
  });

  it("renders a loading skeleton if the user info is still loading", async () => {
    getUserMock.mockImplementation(async () => new Promise(() => undefined));
    renderDiscussion();
    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "What is there to do in Amsterdam?",
      })
    ).toBeVisible();
    expect(
      screen.queryByRole("link", {
        name: getProfileLinkA11yLabel("Funny Cat current User"),
      })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Funny Cat current User")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Created at Jan 01, 2020")
    ).not.toBeInTheDocument();
  });

  it("goes back to the previous page when the back button is clicked", async () => {
    renderDiscussion();
    await screen.findByRole("heading", {
      level: 1,
      name: "What is there to do in Amsterdam?",
    });

    userEvent.click(screen.getByRole("button", { name: PREVIOUS_PAGE }));

    expect(screen.getByTestId("previous-page")).toBeInTheDocument();
  });

  it("shows an error alert if the discussion fails to load", async () => {
    mockConsoleError();
    const errorMessage = "Error getting discussion";
    getDiscussionMock.mockRejectedValue(new Error(errorMessage));

    renderDiscussion();

    await assertErrorAlert(errorMessage);
  });
});
