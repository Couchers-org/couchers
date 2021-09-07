import {
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { REFERENCES } from "features/constants";
import { ReferenceType } from "proto/references_pb";
import { service } from "service";
import references from "test/fixtures/references.json";
import users from "test/fixtures/users.json";
import wrapper from "test/hookWrapper";
import { getUser } from "test/serviceMockDefaults";
import { MockedService } from "test/utils";

import {
  NO_REFERENCES,
  referenceBadgeLabel,
  REFERENCES_FILTER_A11Y_LABEL,
  referencesFilterLabels,
  SEE_MORE_REFERENCES,
} from "../constants";
import { ProfileUserProvider } from "../hooks/useProfileUser";
import { REFERENCE_LIST_ITEM_TEST_ID } from "./ReferenceListItem";
import References from "./References";

const getUserMock = service.user.getUser as MockedService<
  typeof service.user.getUser
>;
const getReferencesReceivedMock = service.references
  .getReferencesReceivedForUser as MockedService<
  typeof service.references.getReferencesReceivedForUser
>;
const getReferencesGivenMock = service.references
  .getReferencesGivenByUser as MockedService<
  typeof service.references.getReferencesGivenByUser
>;
const getAvailableReferencesMock = service.references
  .getAvailableReferences as MockedService<
  typeof service.references.getAvailableReferences
>;

function assertDateBadgeIsVisible(reference: ReturnType<typeof within>) {
  expect(reference.getByText(/\w{3} \d{4}/)).toBeVisible();
}

function renderReferences() {
  render(
    <ProfileUserProvider user={users[0]}>
      <References />
    </ProfileUserProvider>,
    { wrapper }
  );
}

const [friendReference, guestReference1, guestReference2, givenReference] =
  references;

describe("References", () => {
  beforeEach(() => {
    getUserMock.mockImplementation(getUser);
    getReferencesReceivedMock.mockResolvedValue({
      nextPageToken: "",
      referencesList: [friendReference, guestReference1, guestReference2],
    });
    getReferencesGivenMock.mockResolvedValue({
      nextPageToken: "",
      referencesList: [givenReference],
    });
    getAvailableReferencesMock.mockResolvedValue({
      canWriteFriendReference: false,
      availableWriteReferencesList: [],
    });
  });

  it("shows all references with references received first by default", async () => {
    renderReferences();

    expect(screen.getByRole("heading", { name: REFERENCES })).toBeVisible();

    const referenceListItems = await screen.findAllByTestId(
      REFERENCE_LIST_ITEM_TEST_ID
    );

    // References received
    for (let i = 0; i < 3; i++) {
      const user = await getUser(references[i].fromUserId.toString());
      const referenceType = references[i].referenceType as ReferenceType;
      const reference = within(referenceListItems[i]);

      expect(reference.getByRole("heading")).toHaveTextContent(
        new RegExp(user!.name, "i")
      );
      expect(reference.getByText(references[i].text)).toBeVisible();
      // Reference type badge
      expect(
        reference.getByText(referenceBadgeLabel[referenceType])
      ).toBeVisible();
      assertDateBadgeIsVisible(reference);
    }

    expect(getReferencesReceivedMock).toHaveBeenCalledTimes(1);
    expect(getReferencesReceivedMock).toHaveBeenCalledWith({
      referenceType: "all",
      userId: 1,
    });
  });

  it("shows the no references message by default if the user doesn't have any", async () => {
    getReferencesReceivedMock.mockResolvedValue({
      nextPageToken: "",
      referencesList: [],
    });

    renderReferences();

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));
    expect(screen.getByText(NO_REFERENCES)).toBeVisible();
    expect(
      screen.queryByTestId(REFERENCE_LIST_ITEM_TEST_ID)
    ).not.toBeInTheDocument();
  });

  describe("When a specific reference type is selected", () => {
    beforeEach(() => {
      renderReferences();
      userEvent.click(
        screen.getByRole("button", {
          name: REFERENCES_FILTER_A11Y_LABEL.trim(),
        })
      );
      // Ignore the API call from the default "all references" we encounter on first render
      getReferencesReceivedMock.mockClear();
      getReferencesGivenMock.mockClear();
    });

    it("only shows references from friends", async () => {
      getReferencesReceivedMock.mockResolvedValue({
        nextPageToken: "",
        referencesList: [friendReference],
      });
      userEvent.click(
        screen.getByRole("option", {
          name: referencesFilterLabels[ReferenceType.REFERENCE_TYPE_FRIEND],
        })
      );

      const reference = within(
        await screen.findByTestId(REFERENCE_LIST_ITEM_TEST_ID)
      );
      expect(reference.getByRole("heading")).toHaveTextContent(/Funny Dog/i);
      expect(
        reference.getByText("Funny person with dark sense of humour")
      ).toBeVisible();
      // Reference type badge
      expect(
        reference.getByText(
          referenceBadgeLabel[ReferenceType.REFERENCE_TYPE_FRIEND]
        )
      ).toBeVisible();
      assertDateBadgeIsVisible(reference);
      expect(getReferencesReceivedMock).toHaveBeenCalledTimes(1);
      expect(getReferencesReceivedMock).toHaveBeenCalledWith({
        referenceType: ReferenceType.REFERENCE_TYPE_FRIEND,
        userId: 1,
      });
    });

    it("only shows references from guests", async () => {
      const referencesList = [guestReference1, guestReference2];
      getReferencesReceivedMock.mockResolvedValue({
        nextPageToken: "",
        referencesList,
      });
      userEvent.click(
        screen.getByRole("option", {
          name: referencesFilterLabels[ReferenceType.REFERENCE_TYPE_SURFED],
        })
      );

      const references = await screen.findAllByTestId(
        REFERENCE_LIST_ITEM_TEST_ID
      );

      references.forEach(async (referenceElement, i) => {
        const reference = within(referenceElement);
        const user = await getUser(referencesList[i].fromUserId.toString());
        expect(reference.getByRole("heading")).toHaveTextContent(user.name);
        expect(reference.getByText(referencesList[i].text)).toBeVisible();
        // Reference type badge
        expect(
          reference.getByText(
            referenceBadgeLabel[ReferenceType.REFERENCE_TYPE_SURFED]
          )
        ).toBeVisible();
        assertDateBadgeIsVisible(reference);
      });

      expect(getReferencesReceivedMock).toHaveBeenCalledTimes(1);
      expect(getReferencesReceivedMock).toHaveBeenCalledWith({
        referenceType: ReferenceType.REFERENCE_TYPE_SURFED,
        userId: 1,
      });
    });

    // Since there aren't references from hosts in the fixture data
    it("shows no references from hosts", async () => {
      getReferencesReceivedMock.mockResolvedValue({
        nextPageToken: "",
        referencesList: [],
      });
      userEvent.click(
        screen.getByRole("option", {
          name: referencesFilterLabels[ReferenceType.REFERENCE_TYPE_HOSTED],
        })
      );

      expect(await screen.findByText(NO_REFERENCES)).toBeVisible();
      expect(
        screen.queryByTestId(REFERENCE_LIST_ITEM_TEST_ID)
      ).not.toBeInTheDocument();
      expect(getReferencesReceivedMock).toHaveBeenCalledTimes(1);
      expect(getReferencesReceivedMock).toHaveBeenCalledWith({
        referenceType: ReferenceType.REFERENCE_TYPE_HOSTED,
        userId: 1,
      });
    });

    it("shows references given to others", async () => {
      getReferencesGivenMock.mockResolvedValue({
        nextPageToken: "",
        referencesList: [givenReference],
      });
      userEvent.click(
        screen.getByRole("option", { name: referencesFilterLabels["given"] })
      );

      const reference = within(
        await screen.findByTestId(REFERENCE_LIST_ITEM_TEST_ID)
      );
      expect(reference.getByRole("heading")).toHaveTextContent(
        /Funny Chicken/i
      );
      expect(reference.getByText(/Staying with Chicken/)).toBeVisible();
      assertDateBadgeIsVisible(reference);
      expect(getReferencesGivenMock).toHaveBeenCalledTimes(1);
      expect(getReferencesGivenMock).toHaveBeenCalledWith({ userId: 1 });
    });
  });

  describe("when there is more than one pages of reference data", () => {
    it("shows the see more references buttons that allows you to load and show more references", async () => {
      getReferencesReceivedMock
        .mockResolvedValueOnce({
          nextPageToken: "2",
          referencesList: [friendReference],
        })
        .mockResolvedValueOnce({
          nextPageToken: "",
          referencesList: [guestReference1],
        });
      renderReferences();

      userEvent.click(
        await screen.findByRole("button", {
          name: SEE_MORE_REFERENCES,
        })
      );
      await waitForElementToBeRemoved(screen.getAllByRole("progressbar"));

      // Simpler checks here since the more thorough checks have been done in previous tests already
      expect(
        screen.getByText(/Funny person with dark sense of humour/i)
      ).toBeVisible();
      expect(screen.getByText(/I had a great time with cat/i)).toBeVisible();
      expect(getReferencesReceivedMock).toHaveBeenCalledTimes(2);
      expect(getReferencesReceivedMock).toHaveBeenNthCalledWith(1, {
        referenceType: "all",
        userId: 1,
      });
      expect(getReferencesReceivedMock).toHaveBeenNthCalledWith(2, {
        pageToken: "2",
        referenceType: "all",
        userId: 1,
      });
    });

    describe("when a specific reference type is selected", () => {
      it("shows the see more references buttons that allows you to load and show more references", async () => {
        getReferencesReceivedMock
          .mockResolvedValueOnce({
            nextPageToken: "2",
            referencesList: [friendReference],
          })
          .mockResolvedValueOnce({
            nextPageToken: "2",
            referencesList: [friendReference],
          })
          .mockResolvedValueOnce({
            nextPageToken: "",
            referencesList: [
              { ...friendReference, referenceId: 2, text: "Cat is great!" },
            ],
          });
        renderReferences();
        userEvent.click(
          screen.getByRole("button", {
            name: REFERENCES_FILTER_A11Y_LABEL.trim(),
          })
        );
        // Ignore the API calls from the default "all references" we encounter on first render
        getReferencesReceivedMock.mockClear();
        userEvent.click(
          screen.getByRole("option", {
            name: referencesFilterLabels[ReferenceType.REFERENCE_TYPE_FRIEND],
          })
        );

        userEvent.click(
          await screen.findByRole("button", { name: SEE_MORE_REFERENCES })
        );
        await waitForElementToBeRemoved(screen.getByRole("progressbar"));

        expect(
          screen.getByText("Funny person with dark sense of humour")
        ).toBeVisible();
        expect(screen.getByText("Cat is great!")).toBeVisible();
        expect(getReferencesReceivedMock).toHaveBeenCalledTimes(2);
        expect(getReferencesReceivedMock).toHaveBeenNthCalledWith(1, {
          referenceType: ReferenceType.REFERENCE_TYPE_FRIEND,
          userId: 1,
        });
        expect(getReferencesReceivedMock).toHaveBeenNthCalledWith(2, {
          pageToken: "2",
          referenceType: ReferenceType.REFERENCE_TYPE_FRIEND,
          userId: 1,
        });
      });
    });
  });

  describe("when there is an error with the API", () => {
    beforeEach(() => {
      jest.spyOn(console, "error").mockReturnValue(undefined);
    });

    it("shows an error alert", async () => {
      getReferencesReceivedMock.mockRejectedValue(
        new Error("Error loading references")
      );

      renderReferences();
      const errorAlert = await screen.findByRole("alert");
      expect(errorAlert).toBeVisible();
      expect(errorAlert).toHaveTextContent("Error loading references");

      // Error remains there when switching to a category that has an API error
      userEvent.click(
        screen.getByRole("button", {
          name: REFERENCES_FILTER_A11Y_LABEL.trim(),
        })
      );
      userEvent.click(screen.getByRole("option", { name: "From hosts" }));
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Error loading references"
      );
    });

    it("shows an error alert if the second page of data errored", async () => {
      getReferencesReceivedMock
        .mockRejectedValue(new Error("Connection error"))
        .mockResolvedValueOnce({
          nextPageToken: "2",
          referencesList: [friendReference],
        });
      renderReferences();

      userEvent.click(
        await screen.findByRole("button", {
          name: SEE_MORE_REFERENCES,
        })
      );

      // Shows error and the first page of data that didn't error before
      const errorAlert = await screen.findByRole("alert");
      expect(errorAlert).toBeVisible();
      expect(errorAlert).toHaveTextContent("Connection error");
      expect(
        screen.getByText("Funny person with dark sense of humour")
      ).toBeVisible();
    });
  });
});
