import { render, screen, within } from "@testing-library/react";
import {
  INVALID_REFERENCE_TYPE,
  //REFERENCE_TYPE_NOT_AVAILABLE,
} from "features/communities/constants";
import { Route } from "react-router-dom";
import { leaveReferenceBaseRoute } from "routes";
import { service } from "service";
import { getHookWrapperWithClient } from "test/hookWrapper";
import { getAvailableReferences } from "test/serviceMockDefaults";
import { MockedService } from "test/utils";

import LeaveReferencePage from "./LeaveReferencePage";

const getAvailableReferencesMock = service.references
  .getAvailableReferences as MockedService<
  typeof service.references.getAvailableReferences
>;

function renderLeaveReferencePage(
  referenceType: string,
  userId: string,
  hostRequest?: number
) {
  const { wrapper } = getHookWrapperWithClient({
    initialRouterEntries: [`${leaveReferenceBaseRoute}/:referenceType/:userId`],
  });
  hostRequest
    ? render(
        <Route path={`${leaveReferenceBaseRoute}/:referenceType/:userId`}>
          <LeaveReferencePage />
        </Route>,
        { wrapper }
      )
    : render(
        <Route path={`${leaveReferenceBaseRoute}/:referenceType/:userId`}>
          <LeaveReferencePage />
        </Route>,
        { wrapper }
      );
}

describe("LeaveReferencePage", () => {
  // references.getAvailableReferences' is called. You should probably mock it.
  beforeEach(() => {
    getAvailableReferencesMock.mockImplementation(getAvailableReferences);
  });

  describe("When the reference type is invalid", () => {
    it("Returns an error", async () => {
      renderLeaveReferencePage("hello", "1");
      const errorAlert = await screen.findByRole("alert");
      expect(
        within(errorAlert).getByText(INVALID_REFERENCE_TYPE)
      ).toBeVisible();
    });
  });
});

/* THINGS YOU HAVE TO TEST: 
- if invalid type, returns error                          x
- if valid type:
  - friend:
    - if friend and available, return form                  
    - else error                  
  - surf/host if request available, return form

*/
