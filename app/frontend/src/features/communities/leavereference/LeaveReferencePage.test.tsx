import { render, screen, within } from "@testing-library/react";
import {
  INVALID_REFERENCE_TYPE,
  REFERENCE_TYPE_NOT_AVAILABLE,
} from "features/communities/constants";
import { Route } from "react-router-dom";
import { leaveReferenceBaseRoute } from "routes";
import { service } from "service";
import { getHookWrapperWithClient } from "test/hookWrapper";
import { getAvailableReferences, getUser } from "test/serviceMockDefaults";
import { MockedService } from "test/utils";

import LeaveReferencePage from "./LeaveReferencePage";
import { REVIEWEE_CARD_TEST_ID } from "./RevieweeOverview";

const getAvailableReferencesMock = service.references
  .getAvailableReferences as MockedService<
  typeof service.references.getAvailableReferences
>;
const getUserMock = service.user.getUser as MockedService<
  typeof service.user.getUser
>;

function renderLeaveReferencePage(
  referenceType: string,
  userId: string,
  hostRequest?: number
) {
  const { wrapper } = getHookWrapperWithClient({
    initialRouterEntries: [
      `${leaveReferenceBaseRoute}/${referenceType}/${userId}`,
    ],
  });

  render(
    <Route path={`${leaveReferenceBaseRoute}/:referenceType/:userId`}>
      <LeaveReferencePage hostRequest={hostRequest} />
    </Route>,
    { wrapper }
  );
}

describe("LeaveReferencePage", () => {
  beforeEach(() => {
    getUserMock.mockImplementation(getUser);
    getAvailableReferencesMock.mockImplementation(getAvailableReferences);
  });

  describe("When the reference type is invalid", () => {
    beforeEach(() => {
      renderLeaveReferencePage("hello", "1");
    });

    it("Returns an error", async () => {
      const errorAlert = await screen.findByRole("alert");
      expect(
        within(errorAlert).getByText(INVALID_REFERENCE_TYPE)
      ).toBeVisible();
    });

    it("does not show reviewee information", () => {
      const card = screen.queryByTestId(REVIEWEE_CARD_TEST_ID);
      expect(card).not.toBeInTheDocument();
    });

    it("does not show the form", () => {
      expect(
        screen.queryByRole("heading", {
          name: "You met with Friendly Cow",
        })
      ).not.toBeInTheDocument();
    });
  });

  describe("When the reference type is friend", () => {
    describe("and the users are friends", () => {
      beforeEach(() => {
        renderLeaveReferencePage("friend", "5");
      });

      it("verifies that the review type is available", async () => {
        expect(getAvailableReferencesMock).toHaveBeenCalledTimes(1);
        expect(getAvailableReferencesMock).toHaveReturned();
      });

      it("does not return an error", () => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      });

      it("displays reviewee information", async () => {
        expect(
          await screen.findByTestId(REVIEWEE_CARD_TEST_ID)
        ).toBeInTheDocument();
      });

      it("displays the form", async () => {
        expect(
          await screen.findByRole("heading", {
            name: "You met with Friendly Cow",
          })
        ).toBeInTheDocument();
      });
    });

    describe("and the users aren't friends", () => {
      beforeEach(() => {
        renderLeaveReferencePage("friend", "1");
      });

      it("verifies the review type", async () => {
        expect(getAvailableReferencesMock).toHaveBeenCalledTimes(1);
        expect(getAvailableReferencesMock).toHaveReturned();
      });

      it("Returns an error", async () => {
        const errorAlert = await screen.findByRole("alert");
        expect(
          within(errorAlert).getByText(REFERENCE_TYPE_NOT_AVAILABLE)
        ).toBeVisible();
      });

      it("does not show reviewee information", () => {
        expect(
          screen.findByTestId(REVIEWEE_CARD_TEST_ID)
        ).not.toBeInTheDocument();
      });

      it("does not show the form", () => {
        expect(
          screen.queryByRole("heading", {
            name: "You met with Funny Cat current User",
          })
        ).not.toBeInTheDocument();
      });
    });
  });
});

describe("When the reference type is hosted/surfed", () => {
  describe("And a review is available", () => {
    beforeEach(() => {
      renderLeaveReferencePage("hosted", "5", 1);
    });

    it("verifies that the review type is available", async () => {
      expect(getAvailableReferencesMock).toHaveBeenCalledTimes(1);
      expect(getAvailableReferencesMock).toHaveReturned();
    });

    it("does not return an error", () => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("displays reviewee information", async () => {
      expect(
        await screen.findByTestId(REVIEWEE_CARD_TEST_ID)
      ).toBeInTheDocument();
    });

    it("displays the form", async () => {
      expect(
        await screen.findByRole("heading", {
          name: "You met with Friendly Cow",
        })
      ).toBeInTheDocument();
    });
  });

  describe("and a review is unavailable", () => {});
});
