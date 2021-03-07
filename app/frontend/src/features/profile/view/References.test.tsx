import {
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  NO_REFERENCES,
  referenceBadgeLabel,
  REFERENCES,
} from "features/constants";
import { ReferenceType, User } from "pb/api_pb";
import { service } from "service/index";
import references from "test/fixtures/references.json";
import users from "test/fixtures/users.json";
import wrapper from "test/hookWrapper";
import { getUser } from "test/serviceMockDefaults";
import { MockedService } from "test/utils";

import { REFERENCE_LIST_ITEM_TEST_ID } from "./ReferenceListItem";
import References from "./References";

const getUserMock = service.user.getUser as MockedService<
  typeof service.user.getUser
>;
const getReferencesReceivedMock = service.user
  .getReferencesReceived as MockedService<
  typeof service.user.getReferencesReceived
>;
const getReferencesGivenMock = service.user.getReferencesGiven as MockedService<
  typeof service.user.getReferencesGiven
>;

function assertAPIOnlyCalledOnce() {
  expect(getReferencesGivenMock).toHaveBeenCalledTimes(1);
  expect(getReferencesReceivedMock).toHaveBeenCalledTimes(1);
}

function assertDateBadgeIsVisible(reference: ReturnType<typeof within>) {
  expect(reference.getByText(/\w{3} \d{4}/)).toBeVisible();
}

describe("References", () => {
  beforeEach(() => {
    getUserMock.mockImplementation(
      getUser as (u: string) => Promise<User.AsObject>
    );
    getReferencesReceivedMock.mockResolvedValue({
      referencesList: references.slice(0, 2),
      totalMatches: 2,
    });
    getReferencesGivenMock.mockResolvedValue({
      referencesList: references.slice(2),
      totalMatches: 1,
    });
  });

  it("shows all references with references received first by default", async () => {
    render(<References user={users[0] as User.AsObject} />, { wrapper });

    expect(screen.getByRole("heading", { name: REFERENCES })).toBeVisible();

    const referenceListItems = await screen.findAllByTestId(
      REFERENCE_LIST_ITEM_TEST_ID
    );

    // References received
    for (let i = 0; i < 2; i++) {
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

    // Reference given
    expect(
      screen.getByRole("heading", {
        name: /References Funny Cat current User wrote/,
      })
    ).toBeVisible();
    const referenceGiven = within(referenceListItems[2]);
    const user = await getUser(references[2].toUserId.toString());
    expect(referenceGiven.getByRole("heading")).toHaveTextContent(
      new RegExp(user!.name, "i")
    );
    expect(referenceGiven.getByText(references[2].text)).toBeVisible();
    // Date time badge
    assertDateBadgeIsVisible(referenceGiven);

    expect(getReferencesGivenMock).toHaveBeenCalledTimes(1);
    expect(getReferencesGivenMock).toHaveBeenCalledWith({
      count: 50,
      offset: 0,
      userId: 1,
    });
    expect(getReferencesReceivedMock).toHaveBeenCalledTimes(1);
    expect(getReferencesReceivedMock).toHaveBeenCalledWith({
      count: 50,
      offset: 0,
      userId: 1,
    });
  });

  it("shows the no references message by default if the user doesn't have any", async () => {
    getReferencesReceivedMock.mockResolvedValue({
      referencesList: [],
      totalMatches: 0,
    });
    getReferencesGivenMock.mockResolvedValue({
      referencesList: [],
      totalMatches: 0,
    });
    render(<References user={users[0] as User.AsObject} />, { wrapper });

    await waitForElementToBeRemoved(screen.getByRole("progressbar"));

    expect(screen.getByText(NO_REFERENCES)).toBeVisible();
    expect(
      screen.queryByTestId(REFERENCE_LIST_ITEM_TEST_ID)
    ).not.toBeInTheDocument();
  });

  describe("When a specific reference type is selected", () => {
    beforeEach(() => {
      render(<References user={users[0] as User.AsObject} />, { wrapper });
      userEvent.click(screen.getByRole("button", { name: /Show references/i }));
    });

    it("only shows references from friends", async () => {
      userEvent.click(screen.getByRole("option", { name: "From friends" }));

      const reference = within(
        await screen.findByTestId(REFERENCE_LIST_ITEM_TEST_ID)
      );
      expect(reference.getByRole("heading")).toHaveTextContent(/Funny Dog/i);
      expect(
        reference.getByText("Funny person with dark sense of humour")
      ).toBeVisible();
      // Reference type badge
      expect(
        reference.getByText(referenceBadgeLabel[ReferenceType.FRIEND])
      ).toBeVisible();
      assertDateBadgeIsVisible(reference);
      assertAPIOnlyCalledOnce();
    });

    it("only shows references from hosts", async () => {
      userEvent.click(screen.getByRole("option", { name: "From hosts" }));

      const reference = within(
        await screen.findByTestId(REFERENCE_LIST_ITEM_TEST_ID)
      );
      expect(reference.getByRole("heading")).toHaveTextContent(/Funny Kid/i);
      expect(reference.getByText(/I had a great time with cat/)).toBeVisible();
      // Reference type badge
      expect(
        reference.getByText(referenceBadgeLabel[ReferenceType.SURFED])
      ).toBeVisible();
      assertDateBadgeIsVisible(reference);
      assertAPIOnlyCalledOnce();
    });

    // Since there aren't references from guests in the fixture data
    it("shows no references from guests", async () => {
      userEvent.click(screen.getByRole("option", { name: "From guests" }));

      expect(await screen.findByText(NO_REFERENCES)).toBeVisible();
      expect(
        screen.queryByTestId(REFERENCE_LIST_ITEM_TEST_ID)
      ).not.toBeInTheDocument();
    });

    it("shows references given to others", async () => {
      userEvent.click(screen.getByRole("option", { name: "Given to others" }));

      const reference = within(
        await screen.findByTestId(REFERENCE_LIST_ITEM_TEST_ID)
      );
      expect(reference.getByRole("heading")).toHaveTextContent(
        /Funny Chicken/i
      );
      expect(reference.getByText(/Staying with Chicken/)).toBeVisible();
      assertDateBadgeIsVisible(reference);
      assertAPIOnlyCalledOnce();
    });
  });

  describe("when there is an error with the API", () => {
    it("shows an error alert", async () => {
      jest.spyOn(console, "error").mockReturnValue(undefined);
      getReferencesReceivedMock.mockRejectedValue(
        new Error("Error loading references")
      );

      render(<References user={users[0] as User.AsObject} />, { wrapper });
      const errorAlert = await screen.findByRole("alert");
      expect(errorAlert).toBeVisible();
      expect(errorAlert).toHaveTextContent("Error loading references");

      // Error remains there when switching to a category that has an API error
      userEvent.click(screen.getByRole("button", { name: /Show references/i }));
      userEvent.click(screen.getByRole("option", { name: "From hosts" }));
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Error loading references"
      );
    });
  });
});
