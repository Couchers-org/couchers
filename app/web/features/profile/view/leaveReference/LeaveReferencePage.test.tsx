import {
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import mockRouter from "next-router-mock";

import { LEAVE_REFERENCE_BASE_ROUTE, ReferenceStep } from "@/routes";
import { service } from "@/service";
import wrapper from "@/test/hookWrapper";
import i18n from "@/test/i18n";
import { getAvailableReferences, getUser } from "@/test/serviceMockDefaults";
import { MockedService } from "@/test/utils";

import LeaveReferencePage from "./LeaveReferencePage";

const { t } = i18n;

const getAvailableReferencesMock = service.references
  .getAvailableReferences as MockedService<
  typeof service.references.getAvailableReferences
>;
const getUserMock = service.user.getUser as MockedService<
  typeof service.user.getUser
>;

const renderLeaveFriendReferencePage = (
  referenceType: string,
  userId: number,
  step?: ReferenceStep,
) => {
  if (step) {
    mockRouter.setCurrentUrl(
      `${LEAVE_REFERENCE_BASE_ROUTE}/${referenceType}/${userId}/${step}`,
    );
  } else {
    mockRouter.setCurrentUrl(
      `${LEAVE_REFERENCE_BASE_ROUTE}/${referenceType}/${userId}`,
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
};

const renderLeaveRequestReferencePage = (
  referenceType: string,
  userId: number,
  hostRequestId: number,
  step?: ReferenceStep,
) => {
  if (step) {
    mockRouter.setCurrentUrl(
      `${LEAVE_REFERENCE_BASE_ROUTE}/${referenceType}/${userId}/${hostRequestId}/${step}`,
    );
  } else {
    mockRouter.setCurrentUrl(
      `${LEAVE_REFERENCE_BASE_ROUTE}/${referenceType}/${userId}/${hostRequestId}`,
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
};

describe("LeaveReferencePage", () => {
  beforeEach(() => {
    getUserMock.mockImplementation(getUser);
    getAvailableReferencesMock.mockImplementation(getAvailableReferences);
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

      it("verifies that the review type is available", () => {
        expect(getAvailableReferencesMock).toHaveBeenCalledTimes(1);
        expect(getAvailableReferencesMock).toHaveBeenCalledWith({ userId: 5 });
      });

      it("does not return an error", () => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      });

      it("should redirect to base friend route to get first friend step", () => {
        // if friend, it should skip the "did-stay" step
        expect(mockRouter.pathname).toBe(
          `${LEAVE_REFERENCE_BASE_ROUTE}/friend/5`,
        );
      });
    });

    describe("and the users aren't friends", () => {
      beforeEach(() => {
        renderLeaveFriendReferencePage("friend", 1);
      });

      it("verifies the review type", () => {
        expect(getAvailableReferencesMock).toHaveBeenCalledTimes(1);
        expect(getAvailableReferencesMock).toHaveBeenCalledWith({ userId: 1 });
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

  describe("When the reference type is hosted/surfed", () => {
    describe("And a review is available", () => {
      beforeEach(() => {
        renderLeaveRequestReferencePage("hosted", 5, 1);
      });

      it("verifies that the review type is available", () => {
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

      it("verifies the review type", () => {
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

  describe("When the user skips a step", () => {
    it("redirects to first step of the hosting reference form", async () => {
      renderLeaveRequestReferencePage("hosted", 5, 1, "submit");

      await waitForElementToBeRemoved(screen.getByRole("progressbar"));
      expect(mockRouter.pathname).toBe(
        `${LEAVE_REFERENCE_BASE_ROUTE}/hosted/5/1`,
      );
    });

    it("redirects to first step of the friend reference form", async () => {
      renderLeaveFriendReferencePage("friend", 5, "submit");

      await waitForElementToBeRemoved(screen.getByRole("progressbar"));
      expect(mockRouter.pathname).toBe(
        `${LEAVE_REFERENCE_BASE_ROUTE}/friend/5`,
      );
    });
  });
});
