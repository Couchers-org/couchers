import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContributeOption } from "proto/auth_pb";
import wrapper from "test/hookWrapper";
import { mockConsoleError } from "test/utils";

import {
  CONTRIBUTE_WAYS_OPTIONS,
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

    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: SUBMIT }));

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
    const processForm = jest.fn(() => Promise.resolve());
    render(<ContributorForm processForm={processForm} />, { wrapper });

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(IDEAS_LABEL), "I have great ideas");
    await user.type(
      screen.getByLabelText(FEATURES_LABEL),
      "I want all the features",
    );
    await user.click(screen.getByRole("radio", { name: "Yes" }));

    await user.click(
      screen.getByRole("checkbox", {
        name: CONTRIBUTE_WAYS_OPTIONS[8].description,
      }),
    );

    await user.click(
      screen.getByRole("checkbox", {
        name: CONTRIBUTE_WAYS_OPTIONS[4].description,
      }),
    );
    await user.type(
      screen.getByLabelText(EXPERTISE_LABEL),
      "I am a robot, I have all the expertise",
    );
    await user.type(
      screen.getByLabelText(EXPERIENCE_LABEL),
      "I have lots of experience",
    );

    await user.click(screen.getByRole("button", { name: SUBMIT }));
    expect(await screen.findByText(SUCCESS_MSG)).toBeVisible();
    expect(processForm).toHaveBeenCalledWith({
      ideas: "I have great ideas",
      features: "I want all the features",
      experience: "I have lots of experience",
      contribute: ContributeOption.CONTRIBUTE_OPTION_YES,
      contributeWaysList: expect.arrayContaining(["other", "marketing"]),
      expertise: "I am a robot, I have all the expertise",
    });
  });

  it("shows the form again if processing the form fails", async () => {
    const processForm = jest.fn(() =>
      Promise.reject(new Error("Network error?")),
    );
    mockConsoleError();
    render(<ContributorForm processForm={processForm} />, { wrapper });

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(IDEAS_LABEL), "I have great ideas");

    await user.click(screen.getByRole("button", { name: SUBMIT }));
    expect(screen.getByRole("alert")).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent("Network error?");
    expect(screen.queryByText(SUCCESS_MSG)).not.toBeInTheDocument();
    expect(screen.getByLabelText(IDEAS_LABEL) as HTMLInputElement).toHaveValue(
      "I have great ideas",
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
