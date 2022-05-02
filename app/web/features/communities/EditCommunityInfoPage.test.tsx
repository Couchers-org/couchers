import {
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import mockRouter from "next-router-mock";
import { routeToCommunity, routeToEditCommunityPage } from "routes";
import { service } from "service";
import community from "test/fixtures/community.json";
import { getHookWrapperWithClient } from "test/hookWrapper";
import { assertErrorAlert, mockConsoleError, t } from "test/utils";

import EditCommunityInfoPage from "./EditCommunityInfoPage";

jest.mock("components/MarkdownInput");

const getCommunityMock = service.communities
  .getCommunity as jest.MockedFunction<typeof service.communities.getCommunity>;
const updatePageMock = service.pages.updatePage as jest.MockedFunction<
  typeof service.pages.updatePage
>;

function renderEditCommunityPage() {
  mockRouter.setCurrentUrl(routeToEditCommunityPage(2, "amsterdam"));
  const { wrapper } = getHookWrapperWithClient();
  render(<EditCommunityInfoPage communityId={2} />, { wrapper });
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
      screen.getByRole("heading", {
        name: t("communities:edit_info_page_title"),
      })
    ).toBeVisible();
    expect(
      screen.getByLabelText(t("communities:page_content_field_label"))
    ).toBeVisible();
    expect(
      screen.getByLabelText(t("communities:page_content_field_label"))
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: t("global:update") })
    ).toBeVisible();
  });

  it("redirects the user back to the community page if they do not have permission", async () => {
    jest.spyOn(console, "warn").mockReturnValue(undefined);
    getCommunityMock.mockResolvedValue(community);
    renderEditCommunityPage();

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));
    expect(mockRouter.pathname).toBe(routeToCommunity(2, "amsterdam", "info"));
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

    await userEvent.type(
      screen.getByLabelText(t("communities:page_content_field_label")),
      " are great!"
    );
    await userEvent.click(
      screen.getByRole("button", { name: t("global:update") })
    );

    const successAlert = await screen.findByRole("alert");
    expect(successAlert).toBeVisible();
    expect(successAlert).toHaveTextContent(
      t("communities:edit_info_page_success_message")
    );
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

    await userEvent.click(
      screen.getByRole("button", { name: t("global:update") })
    );

    await assertErrorAlert(errorMessage);
  });
});
