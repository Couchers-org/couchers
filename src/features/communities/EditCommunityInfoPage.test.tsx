import {
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UPDATE } from "features/constants";
import { Route, Switch } from "react-router";
import {
  communityRoute,
  editCommunityPageRoute,
  routeToEditCommunityPage,
} from "routes";
import { service } from "service";
import community from "test/fixtures/community.json";
import { getHookWrapperWithClient } from "test/hookWrapper";
import { assertErrorAlert, mockConsoleError } from "test/utils";

import {
  COMMUNITY_PAGE_UPDATED,
  EDIT_LOCAL_INFO,
  PAGE_CONTENT_FIELD_LABEL,
} from "./constants";
import EditCommunityInfoPage from "./EditCommunityInfoPage";

jest.mock("components/MarkdownInput");

const getCommunityMock = service.communities
  .getCommunity as jest.MockedFunction<typeof service.communities.getCommunity>;
const updatePageMock = service.pages.updatePage as jest.MockedFunction<
  typeof service.pages.updatePage
>;

function renderEditCommunityPage() {
  const { wrapper } = getHookWrapperWithClient({
    initialRouterEntries: [routeToEditCommunityPage(2, "amsterdam")],
  });
  render(
    <Switch>
      <Route exact path={editCommunityPageRoute}>
        <EditCommunityInfoPage />
      </Route>
      <Route exact path={communityRoute}>
        <h1 data-testid="mock-community-page">Community route</h1>
      </Route>
    </Switch>,
    { wrapper }
  );
}

describe("Edit community page", () => {
  beforeEach(() => {
    getCommunityMock.mockResolvedValue({
      ...community,
      mainPage: { ...community.mainPage, canEdit: true },
    });
  });

  it("renders the page correctly", async () => {
    renderEditCommunityPage();

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    expect(
      screen.getByRole("heading", { name: EDIT_LOCAL_INFO })
    ).toBeVisible();
    expect(screen.getByLabelText(PAGE_CONTENT_FIELD_LABEL)).toBeVisible();
    expect(screen.getByRole("button", { name: UPDATE })).toBeVisible();
  });

  it("redirects the user back to the community page if they do not have permission", async () => {
    getCommunityMock.mockResolvedValue(community);
    renderEditCommunityPage();

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));
    expect(screen.getByTestId("mock-community-page")).toBeInTheDocument();
  });

  it("lets the user update the community page successfully", async () => {
    const newContent = "Stroopwafels are great!";
    updatePageMock.mockResolvedValue({
      ...community.mainPage,
      canEdit: true,
      content: newContent,
    });
    renderEditCommunityPage();
    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    userEvent.type(
      screen.getByLabelText(PAGE_CONTENT_FIELD_LABEL),
      " are great!"
    );
    userEvent.click(screen.getByRole("button", { name: UPDATE }));

    const successAlert = await screen.findByRole("alert");
    expect(successAlert).toBeVisible();
    expect(successAlert).toHaveTextContent(COMMUNITY_PAGE_UPDATED);
    expect(updatePageMock).toHaveBeenCalledTimes(1);
    expect(updatePageMock).toHaveBeenCalledWith({
      content: newContent,
      pageId: 3,
      photoKey: "",
    });
  });

  it("shows an error snack bar if the page update failed", async () => {
    mockConsoleError();
    const errorMessage = "Error updating community info page";
    updatePageMock.mockRejectedValue(new Error(errorMessage));
    renderEditCommunityPage();
    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    userEvent.click(screen.getByRole("button", { name: UPDATE }));

    await assertErrorAlert(errorMessage);
  });
});
