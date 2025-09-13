import {
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import mockRouter from "next-router-mock";
import { HasGivenHostRequestReferenceRes } from "proto/references_pb";
import { leaveReferenceBaseRoute, ReferenceStep } from "routes";
import { service } from "service";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { getAvailableReferences, getUser } from "test/serviceMockDefaults";
import { MockedService } from "test/utils";

import LeaveReferencePage from "./LeaveReferencePage";

const { t } = i18n;

const getAvailableReferencesMock = service.references
  .getAvailableReferences as MockedService<
  typeof service.references.getAvailableReferences
>;
const getUserMock = service.user.getUser as MockedService<
  typeof service.user.getUser
>;
const hasGivenMock = service.references
  .hasGivenHostRequestReference as unknown as jest.MockedFunction<
  (hostRequestId: number) => Promise<HasGivenHostRequestReferenceRes.AsObject>
>;

function renderLeaveFriendReferencePage(
  referenceType: string,
  userId: number,
  step?: ReferenceStep,
) {
  if (step) {
    mockRouter.setCurrentUrl(
      `${leaveReferenceBaseRoute}/${referenceType}/${userId}/${step}`,
    );
  } else {
    mockRouter.setCurrentUrl(
      `${leaveReferenceBaseRoute}/${referenceType}/${userId}`,
    );
  }

  render(
    <LeaveReferencePage
      referenceType={referenceType}
      userId={userId}
      step={step}
    />,
    {
      wrapper,
    },
  );
}

function renderLeaveRequestReferencePage(
  referenceType: string,
  userId: number,
  hostRequestId: number,
  step?: ReferenceStep,
) {
  if (step) {
    mockRouter.setCurrentUrl(
      `${leaveReferenceBaseRoute}/${referenceType}/${userId}/${hostRequestId}/${step}`,
    );
  } else {
    mockRouter.setCurrentUrl(
      `${leaveReferenceBaseRoute}/${referenceType}/${userId}/${hostRequestId}`,
    );
  }

  render(
    <LeaveReferencePage
      referenceType={referenceType}
      userId={userId}
      hostRequestId={hostRequestId}
      step={step}
    />,
    { wrapper },
  );
}

describe("LeaveReferencePage", () => {
  beforeEach(() => {
    getUserMock.mockImplementation(getUser);
    getAvailableReferencesMock.mockImplementation(getAvailableReferences);
    hasGivenMock.mockResolvedValue({ hasGiven: false });
  });

  describe("When the reference type is invalid", () => {
    beforeEach(() => {
      renderLeaveFriendReferencePage("hello", 1);
    });

    it("Returns an error", async () => {
      const errorAlert = await screen.findByRole("alert");
      expect(
        within(errorAlert).getByText(
          t("profile:leave_reference.invalid_reference_type"),
        ),
      ).toBeVisible();
    });

    it("does not show the form", () => {
      expect(
        screen.queryByRole("heading", {
          name: "You met with Friendly Cow",
        }),
      ).not.toBeInTheDocument();
    });
  });

  describe("When the reference type is friend", () => {
    describe("and the users are friends", () => {
      beforeEach(() => {
        renderLeaveFriendReferencePage("friend", 5);
      });

      it("verifies that the review type is available", async () => {
        expect(getAvailableReferencesMock).toHaveBeenCalledTimes(1);
        expect(getAvailableReferencesMock).toHaveBeenCalledWith({ userId: 5 });
      });

      it("does not return an error", () => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      });

      it("should redirect to base friend route to get first friend step", async () => {
        // if friend, it should skip the "did-stay" step
        expect(mockRouter.pathname).toBe(`${leaveReferenceBaseRoute}/friend/5`);
      });
    });

    describe("and the users aren't friends", () => {
      beforeEach(() => {
        renderLeaveFriendReferencePage("friend", 1);
      });

      it("verifies the review type", async () => {
        expect(getAvailableReferencesMock).toHaveBeenCalledTimes(1);
        expect(getAvailableReferencesMock).toHaveBeenCalledWith({ userId: 1 });
      });

      it("Returns a not-friends error", async () => {
        const errorAlert = await screen.findByRole("alert");
        expect(
          within(errorAlert).getByText(
            t("profile:leave_reference.friend_reference_requires_friendship"),
          ),
        ).toBeVisible();
      });

      it("does not show the form", () => {
        expect(
          screen.queryByRole("heading", {
            name: "You met with Funny Cat current User",
          }),
        ).not.toBeInTheDocument();
      });
    });

    describe("when friend reference is unavailable", () => {
      beforeEach(() => {
        getAvailableReferencesMock.mockResolvedValue({
          canWriteFriendReference: false,
          availableWriteReferencesList: [],
        } as unknown as ReturnType<typeof getAvailableReferences>);
        renderLeaveFriendReferencePage("friend", 5);
      });

      it("verifies the review type", async () => {
        expect(getAvailableReferencesMock).toHaveBeenCalledTimes(1);
        expect(getAvailableReferencesMock).toHaveBeenCalledWith({ userId: 5 });
      });

      it("Returns the fallback error", async () => {
        const errorAlert = await screen.findByRole("alert");
        expect(
          within(errorAlert).getByText(
            t("profile:leave_reference.reference_type_not_available"),
          ),
        ).toBeVisible();
      });

      it("does not show the form", () => {
        expect(
          screen.queryByRole("heading", {
            name: "You met with Friendly Cow",
          }),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("When the reference type is hosted/surfed", () => {
    describe("And a review is available", () => {
      beforeEach(() => {
        renderLeaveRequestReferencePage("hosted", 5, 1);
      });

      it("verifies that the review type is available", async () => {
        expect(getAvailableReferencesMock).toHaveBeenCalledTimes(1);
        expect(getAvailableReferencesMock).toHaveBeenCalledWith({ userId: 5 });
      });

      it("does not return an error", () => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      });

      it("displays the form", async () => {
        expect(
          await screen.findByText("Did you host Friendly Cow?"),
        ).toBeVisible();
      });
    });

    describe("and a review is unavailable", () => {
      beforeEach(() => {
        renderLeaveRequestReferencePage("hosted", 5, 2);
      });

      it("verifies the review type", async () => {
        expect(getAvailableReferencesMock).toHaveBeenCalledTimes(1);
        expect(getAvailableReferencesMock).toHaveBeenCalledWith({ userId: 5 });
      });

      it("Returns an error", async () => {
        const errorAlert = await screen.findByRole("alert");
        expect(
          within(errorAlert).getByText(
            t("profile:leave_reference.reference_type_not_available"),
          ),
        ).toBeVisible();
      });

      it("does not show the form", () => {
        expect(
          screen.queryByRole("heading", {
            name: "You met with Funny Cat current User",
          }),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("hasGivenHostRequestReference", () => {
    describe("hasGivenHostRequestReference returns true", () => {
      beforeEach(() => {
        hasGivenMock.mockResolvedValue({ hasGiven: true });
        // Ensure available references don't interfere
        getAvailableReferencesMock.mockResolvedValue({
          canWriteFriendReference: false,
          availableWriteReferencesList: [],
        } as unknown as ReturnType<typeof getAvailableReferences>);
        renderLeaveRequestReferencePage("hosted", 5, 1);
      });

      it("calls hasGivenHostRequestReference with hostRequestId", async () => {
        expect(hasGivenMock).toHaveBeenCalledTimes(1);
        expect(hasGivenMock).toHaveBeenCalledWith(1);
      });

      it("shows the already-wrote info alert and hides the form", async () => {
        const alert = await screen.findByRole("alert");
        expect(
          within(alert).getByText(
            t("profile:leave_reference.already_wrote_reference_for_stay"),
          ),
        ).toBeVisible();

        expect(
          screen.queryByText("Did you host Friendly Cow?"),
        ).not.toBeInTheDocument();
      });
    });

    describe("hasGivenHostRequestReference returns false", () => {
      beforeEach(() => {
        hasGivenMock.mockResolvedValue({ hasGiven: false });
        renderLeaveRequestReferencePage("hosted", 5, 1);
      });

      it("does not show the already-wrote alert and renders the form", async () => {
        expect(
          screen.queryByText(
            t("profile:leave_reference.already_wrote_reference_for_stay"),
          ),
        ).not.toBeInTheDocument();

        expect(
          await screen.findByText("Did you host Friendly Cow?"),
        ).toBeVisible();
      });
    });
  });

  describe("When the user skips a step", () => {
    it("redirects to first step of the hosting reference form", async () => {
      renderLeaveRequestReferencePage("hosted", 5, 1, "submit");

      await waitForElementToBeRemoved(screen.getByRole("progressbar"));
      expect(mockRouter.pathname).toBe(`${leaveReferenceBaseRoute}/hosted/5/1`);
    });

    it("redirects to first step of the friend reference form", async () => {
      renderLeaveFriendReferencePage("friend", 5, "submit");

      await waitForElementToBeRemoved(screen.getByRole("progressbar"));
      expect(mockRouter.pathname).toBe(`${leaveReferenceBaseRoute}/friend/5`);
    });
  });
});
