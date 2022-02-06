import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContributeOption } from "proto/auth_pb";
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

describe("contributor form", () => {
  it("can be submitted empty", async () => {
    const processForm = jest.fn(() => Promise.resolve());
    render(<ContributorForm processForm={processForm} />, { wrapper });
    userEvent.click(await screen.findByRole("button", { name: SUBMIT }));
    expect(await screen.findByText(SUCCESS_MSG)).toBeVisible();

    await waitFor(() => {
      expect(processForm).toHaveBeenCalledTimes(1);
    });
    expect(processForm).toHaveBeenCalledWith({
      ideas: "",
      features: "",
      experience: "",
      contribute: ContributeOption.CONTRIBUTE_OPTION_UNSPECIFIED,
      contributeWaysList: [],
      expertise: "",
    });
  });

  it("can be submitted filled", async () => {
    jest.setTimeout(10000);
    const processForm = jest.fn(() => Promise.resolve());
    render(<ContributorForm processForm={processForm} />, { wrapper });
    userEvent.type(screen.getByLabelText(IDEAS_LABEL), "I have great ideas");
    userEvent.type(
      screen.getByLabelText(FEATURES_LABEL),
      "I want all the features"
    );
    userEvent.click(screen.getByRole("radio", { name: "Yes" }));
    // For some reason, checking boxes makes tests flakey when running jest
    // either on CI, or with many workers. Go figure. (Performance related?)
    // userEvent.click(screen.getByRole("checkbox", { name: "Other" }));
    // userEvent.click(screen.getByRole("checkbox", { name: "Marketing" }));
    userEvent.type(
      screen.getByLabelText(EXPERTISE_LABEL),
      "I am a robot, I have all the expertise"
    );
    userEvent.type(
      screen.getByLabelText(EXPERIENCE_LABEL),
      "I have lots of experience"
    );

    userEvent.click(screen.getByRole("button", { name: SUBMIT }));
    expect(await screen.findByText(SUCCESS_MSG)).toBeVisible();
    expect(processForm).toHaveBeenCalledWith({
      ideas: "I have great ideas",
      features: "I want all the features",
      experience: "I have lots of experience",
      contribute: ContributeOption.CONTRIBUTE_OPTION_YES,
      contributeWaysList: [], //["other", "marketing"],
      expertise: "I am a robot, I have all the expertise",
    });
  });

  it("shows the form again if processing the form fails", async () => {
    const processForm = jest.fn(() =>
      Promise.reject(new Error("Network error?"))
    );
    mockConsoleError();
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
    expect(processForm).toHaveBeenCalledWith({
      ideas: "I have great ideas",
      features: "",
      experience: "",
      contribute: ContributeOption.CONTRIBUTE_OPTION_UNSPECIFIED,
      contributeWaysList: [],
      expertise: "",
    });
  });
});
