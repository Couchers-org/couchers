import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { GetMyVolunteerInfoRes } from "proto/account_pb";
import { service } from "service";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { MockedService } from "test/utils";

import VolunteerForm from "./VolunteerForm";

const { t } = i18n;

const updateVolunteerInfoMock = service.account.updateVolunteerInfo as MockedService<
  typeof service.account.updateVolunteerInfo
>;

jest.mock("features/userQueries/useCurrentUser");
const useCurrentUserMock = useCurrentUser as jest.MockedFunction<typeof useCurrentUser>;

const volunteerInfo: GetMyVolunteerInfoRes.AsObject = {
  displayName: "",
  displayLocation: "",
  role: "Tester",
  startedVolunteering: "2020-06-01",
  stoppedVolunteering: "",
  showOnTeamPage: true,
  linkType: "website",
  linkText: "",
  linkUrl: "",
};

describe("VolunteerForm", () => {
  beforeEach(() => {
    updateVolunteerInfoMock.mockResolvedValue(new GetMyVolunteerInfoRes());
    useCurrentUserMock.mockReturnValue({ data: undefined } as ReturnType<typeof useCurrentUser>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("sends the link text and URL for a website link", async () => {
    const user = userEvent.setup();
    render(<VolunteerForm volunteerInfo={volunteerInfo} />, { wrapper });

    await user.type(
      screen.getByLabelText(t("auth:volunteer_management.form.link_url_label")),
      "https://www.example.com/me",
    );
    await user.type(screen.getByLabelText(t("auth:volunteer_management.form.link_text_website_label")), "example.com");
    await user.click(screen.getByRole("button", { name: t("auth:volunteer_management.form.save_button") }));

    await waitFor(() => {
      expect(updateVolunteerInfoMock).toHaveBeenCalledWith(
        expect.objectContaining({
          linkType: "website",
          linkText: "example.com",
          linkUrl: "https://www.example.com/me",
        }),
      );
    });
  });

  it("does not submit a website link whose text is not part of the URL", async () => {
    const user = userEvent.setup();
    render(<VolunteerForm volunteerInfo={volunteerInfo} />, { wrapper });

    await user.type(
      screen.getByLabelText(t("auth:volunteer_management.form.link_url_label")),
      "https://www.example.com/me",
    );
    await user.type(
      screen.getByLabelText(t("auth:volunteer_management.form.link_text_website_label")),
      "https://www.example.com",
    );
    await user.click(screen.getByRole("button", { name: t("auth:volunteer_management.form.save_button") }));

    expect(await screen.findByText(t("auth:volunteer_management.form.link_text_website_invalid"))).toBeVisible();
    expect(updateVolunteerInfoMock).not.toHaveBeenCalled();
  });
});
