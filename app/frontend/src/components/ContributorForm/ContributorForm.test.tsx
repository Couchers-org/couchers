import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ContributeOption,
  ContributorForm as ContributorFormPb,
} from "proto/auth_pb";
import wrapper from "test/hookWrapper";
import { mockConsoleError } from "test/utils";

import {
  EXPERIENCE_LABEL,
  EXPERTISE_LABEL,
  FEATURES_LABEL,
  IDEAS_LABEL,
  SUBMIT,
  SUCCESS_MSG,
} from "./constants";
import ContributorForm from "./ContributorForm";

let processForm: jest.Mock;

describe("contributor form", () => {
  beforeEach(() => {
    processForm = jest.fn();
    processForm.mockImplementation(() => Promise.resolve());
  });
  it("can be submitted empty", async () => {
    render(<ContributorForm processForm={processForm} />, { wrapper });
    userEvent.click(await screen.findByRole("button", { name: SUBMIT }));
    expect(await screen.findByText(SUCCESS_MSG)).toBeVisible();

    await waitFor(() => {
      expect(processForm).toHaveBeenCalledTimes(1);
    });
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

  it("can be submitted filled", async () => {
    render(<ContributorForm processForm={processForm} />, { wrapper });
    userEvent.type(screen.getByLabelText(IDEAS_LABEL), "I have great ideas");
    userEvent.type(
      screen.getByLabelText(FEATURES_LABEL),
      "I want all the features"
    );
    userEvent.type(
      screen.getByLabelText(EXPERIENCE_LABEL),
      "I have lots of experience"
    );
    userEvent.click(screen.getByRole("radio", { name: "Yes" }));
    userEvent.click(screen.getByRole("checkbox", { name: "Other" }));
    userEvent.click(screen.getByRole("checkbox", { name: "Marketing" }));
    userEvent.type(
      screen.getByLabelText(EXPERTISE_LABEL),
      "I am a robot, I have all the expertise"
    );

    userEvent.click(screen.getByRole("button", { name: SUBMIT }));
    await waitFor(() => {
      expect(screen.getByText(SUCCESS_MSG)).toBeVisible();
      expect(processForm).toHaveBeenCalledTimes(1);
      const param = processForm.mock.calls[0][0] as ContributorFormPb;
      expect(param.getIdeas()).toBe("I have great ideas");
      expect(param.getFeatures()).toBe("I want all the features");
      expect(param.getExperience()).toBe("I have lots of experience");
      expect(param.getContribute()).toBe(
        ContributeOption.CONTRIBUTE_OPTION_YES
      );
      expect(param.getContributeWaysList()).toStrictEqual([
        "other",
        "marketing",
      ]);
      expect(param.getExpertise()).toBe(
        "I am a robot, I have all the expertise"
      );
    });
  });

  it("shows the form again if processing the form fails", async () => {
    mockConsoleError();
    processForm.mockRejectedValue(new Error("Network error?"));
    render(<ContributorForm processForm={processForm} />, { wrapper });
    userEvent.type(screen.getByLabelText(IDEAS_LABEL), "I have great ideas");

    userEvent.click(screen.getByRole("button", { name: SUBMIT }));
    await waitForElementToBeRemoved(screen.getByRole("progressbar"));
    expect(screen.getByRole("alert")).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent("Network error?");
    expect(screen.queryByText(SUCCESS_MSG)).not.toBeInTheDocument();
    expect((screen.getByLabelText(IDEAS_LABEL) as HTMLInputElement).value).toBe(
      "I have great ideas"
    );
    expect(processForm).toHaveBeenCalledTimes(1);

    const param = processForm.mock.calls[0][0] as ContributorFormPb;
    expect(param.getIdeas()).toBe("I have great ideas");
    expect(param.getFeatures()).toBe("");
    expect(param.getExperience()).toBe("");
    expect(param.getContribute()).toBe(
      ContributeOption.CONTRIBUTE_OPTION_UNSPECIFIED
    );
    expect(param.getContributeWaysList()).toHaveLength(0);
    expect(param.getExpertise()).toBe("");
  });
});
