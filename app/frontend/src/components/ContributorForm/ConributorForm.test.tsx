import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ContributeOption,
  ContributorForm as ContributorFormPb,
} from "pb/account_pb";

import { SUBMIT, SUCCESS_MSG } from "./constants";
import ContributorForm from "./ContributorForm";

describe("contributor form", () => {
  it("can be submitted empty", async () => {
    const processForm = jest.fn();
    processForm.mockReturnValue(true);
    render(<ContributorForm processForm={processForm} />);
    userEvent.click(await screen.findByRole("button", { name: SUBMIT }));
    expect(await screen.findByText(SUCCESS_MSG)).toBeVisible();

    await waitFor(() => {
      expect(processForm).toHaveBeenCalledTimes(1);
      const param = processForm.mock.calls[0][0] as ContributorFormPb;
      expect(param.getIdeas()).toBe("");
      expect(param.getFeatures()).toBe("");
      expect(param.getExperience()).toBe("");
      expect(param.getContribute()).toBe(
        ContributeOption.CONTRIBUTE_OPTION_UNSPECIFIED
      );
      expect(param.getContributeWaysList()).toHaveLength(0);
      expect(param.getExpertise()).toBe("");
    });
  });
});
