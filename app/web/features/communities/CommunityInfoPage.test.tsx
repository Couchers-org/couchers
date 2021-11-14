import {
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getProfileLinkA11yLabel } from "components/Avatar/constants";
import { EDIT } from "features/constants";
import mockRouter from "next-router-mock";
import { routeToCommunity, routeToEditCommunityPage } from "routes";
import { service } from "service";
import community from "test/fixtures/community.json";
import users from "test/fixtures/users.json";
import wrapper from "test/hookWrapper";
import { getUser, listCommunityAdmins } from "test/serviceMockDefaults";
import { assertErrorAlert, keyPress, mockConsoleError } from "test/utils";

import CommunityInfoPage from "./CommunityInfoPage";
import {
  COMMUNITY_MODERATORS,
  EDIT_LOCAL_INFO,
  LOAD_MORE_MODERATORS,
  LOCAL_INFO_TITLE,
  NO_MODERATORS,
  SEE_ALL_MODERATORS,
} from "./constants";

const listAdminsMock = service.communities.listAdmins as jest.MockedFunction<
  typeof service.communities.listAdmins
>;
const getUserMock = service.user.getUser as jest.MockedFunction<
  typeof service.user.getUser
>;
const [, firstAdmin, secondAdmin, thirdAdmin] = users;

function assertAdminsShown(element: typeof screen | ReturnType<typeof within>) {
  expect(
    element.getByRole("link", {
      name: getProfileLinkA11yLabel(firstAdmin.name),
    })
  ).toBeVisible();
  expect(element.getByText(firstAdmin.name)).toBeVisible();
  expect(
    element.getByRole("link", {
      name: getProfileLinkA11yLabel(secondAdmin.name),
    })
  ).toBeVisible();
  expect(element.getByText(secondAdmin.name)).toBeVisible();
}

describe("Community info page", () => {
  beforeEach(() => {
    getUserMock.mockImplementation(getUser);
    listAdminsMock.mockImplementation(listCommunityAdmins);
    process.env.NEXT_PUBLIC_MEDIA_BASE_URL = "http://mymedia.com";
  });

  it("renders the info page correctly", async () => {
    render(<CommunityInfoPage community={community} />, { wrapper });

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    // General information heading checks
    expect(
      screen.getByRole("heading", {
        name: LOCAL_INFO_TITLE(community.name),
      })
    ).toBeVisible();
    expect(screen.getByText(community.mainPage.content)).toBeVisible();

    // Shouldn't show the edit link since the default user doesn't have permission
    expect(screen.queryByRole("link", { name: EDIT })).not.toBeInTheDocument();

    // Community moderators section checks
    expect(
      screen.getByRole("heading", { name: COMMUNITY_MODERATORS })
    ).toBeVisible();
    assertAdminsShown(screen);

    // Shouldn't show "see all moderators" button since the page already shows
    // everyone in this case
    expect(
      screen.queryByRole("button", { name: SEE_ALL_MODERATORS })
    ).not.toBeInTheDocument();
  });

  describe("when the user has permission to edit a community info page", () => {
    it("takes the user to the edit community info page when such a link is clicked", async () => {
      mockRouter.setCurrentUrl(
        routeToCommunity(community.communityId, community.slug, "info")
      );
      render(
        <CommunityInfoPage
          community={{
            ...community,
            mainPage: { ...community.mainPage, canEdit: true },
          }}
        />,
        { wrapper }
      );
      await waitForElementToBeRemoved(screen.getByRole("progressbar"));

      const editLink = screen.getByRole("link", { name: EDIT });
      expect(editLink).toBeVisible();

      userEvent.click(editLink);
      expect(mockRouter.pathname).toBe(
        routeToEditCommunityPage(community.communityId, community.slug)
      );
    });
  });

  it("shows an error alert if the community moderators fails to load", async () => {
    mockConsoleError();
    const errorMessage = "Error listing admins";
    listAdminsMock.mockRejectedValue(new Error(errorMessage));
    render(<CommunityInfoPage community={community} />, { wrapper });

    await assertErrorAlert(errorMessage);
    expect(screen.queryByText(NO_MODERATORS)).not.toBeInTheDocument();
  });

  describe("when there are more than one page of moderators", () => {
    it("should show a 'See all moderators' button which opens a dialog when clicked", async () => {
      listAdminsMock.mockResolvedValue({
        adminUserIdsList: [2, 3],
        nextPageToken: "3",
      });
      render(<CommunityInfoPage community={community} />, { wrapper });
      await waitForElementToBeRemoved(screen.getByRole("progressbar"));

      userEvent.click(screen.getByRole("button", { name: SEE_ALL_MODERATORS }));
      const adminDialog = within(
        await screen.findByRole("dialog", { name: COMMUNITY_MODERATORS })
      );

      expect(
        adminDialog.getByRole("heading", { name: COMMUNITY_MODERATORS })
      ).toBeVisible();
      assertAdminsShown(adminDialog);
      expect(
        adminDialog.getByRole("button", { name: LOAD_MORE_MODERATORS })
      ).toBeVisible();
    });
  });

  describe("when the moderators dialog is opened", () => {
    beforeEach(async () => {
      listAdminsMock.mockResolvedValue({
        adminUserIdsList: [2, 3],
        nextPageToken: "3",
      });
      render(<CommunityInfoPage community={community} />, { wrapper });
      await waitForElementToBeRemoved(screen.getByRole("progressbar"));

      userEvent.click(screen.getByRole("button", { name: SEE_ALL_MODERATORS }));
      await screen.findByRole("dialog", { name: COMMUNITY_MODERATORS });
    });

    it("loads more moderators when the button is clicked", async () => {
      listAdminsMock.mockResolvedValue({
        adminUserIdsList: [4],
        nextPageToken: "",
      });

      userEvent.click(
        screen.getByRole("button", { name: LOAD_MORE_MODERATORS })
      );
      await waitForElementToBeRemoved(screen.getByRole("progressbar"));

      const adminDialog = within(
        await screen.findByRole("dialog", { name: COMMUNITY_MODERATORS })
      );
      assertAdminsShown(adminDialog);
      expect(
        adminDialog.getByRole("link", {
          name: getProfileLinkA11yLabel(thirdAdmin.name),
        })
      ).toBeVisible();
      expect(adminDialog.getByText(thirdAdmin.name)).toBeVisible();

      // Check it doesn't affect the underlying page
      userEvent.click(document.querySelector(".MuiBackdrop-root")!);
      await waitForElementToBeRemoved(
        screen.getByRole("dialog", { name: COMMUNITY_MODERATORS })
      );
      expect(
        adminDialog.queryByRole("link", {
          name: getProfileLinkA11yLabel(thirdAdmin.name),
        })
      ).not.toBeInTheDocument();
      expect(adminDialog.queryByRole(thirdAdmin.name)).not.toBeInTheDocument();
    });

    it("closes the dialog by clicking the backdrop", async () => {
      userEvent.click(document.querySelector(".MuiBackdrop-root")!);
      await waitForElementToBeRemoved(
        screen.getByRole("dialog", { name: COMMUNITY_MODERATORS })
      );

      expect(
        screen.queryByRole("button", { name: LOAD_MORE_MODERATORS })
      ).not.toBeInTheDocument();
    });

    it("closes the dialog by pressing the escape key", async () => {
      keyPress(screen.getByRole("dialog", { name: COMMUNITY_MODERATORS }), {
        key: "Escape",
        code: "Escape",
      });
      await waitForElementToBeRemoved(
        screen.getByRole("dialog", { name: COMMUNITY_MODERATORS })
      );

      expect(
        screen.queryByRole("button", { name: LOAD_MORE_MODERATORS })
      ).not.toBeInTheDocument();
    });
  });
});
