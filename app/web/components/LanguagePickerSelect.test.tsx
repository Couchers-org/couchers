import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { allLanguages } from "i18n/allLanguages";
import mockRouter from "next-router-mock";
import { service } from "service";
import wrapper from "test/hookWrapper";
import { MockedService } from "test/utils";

import LanguagePickerSelect from "./LanguagePickerSelect";

jest.mock("features/auth/useAuthStore", () => ({
  __esModule: true,
  default: () => ({
    authState: {
      authenticated: true,
    },
  }),
}));

const changeLanguageMock = service.account.changeLanguage as MockedService<
  typeof service.account.changeLanguage
>;

describe("LanguagePickerSelect", () => {
  beforeEach(() => {
    mockRouter.setCurrentUrl("/messages/hosting");
  });

  it("renders the select with the correct options", async () => {
    render(<LanguagePickerSelect />, { wrapper });

    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();

    const user = userEvent.setup();
    user.click(select);

    const listBox = await screen.findByRole("listbox");

    allLanguages.forEach((language) => {
      within(listBox).getByText(language.toUpperCase());
    });
  });

  it("calls changeLanguage and re-routes with locale on selection", async () => {
    render(<LanguagePickerSelect />, { wrapper });

    expect(mockRouter).toEqual(
      expect.objectContaining({
        locale: undefined,
      }),
    );

    const select = screen.getByRole("combobox");
    const user = userEvent.setup();
    await user.click(select);

    const listBox = await screen.findByRole("listbox");
    const firstOption = within(listBox).getByText(
      allLanguages[0].toUpperCase(),
    );

    await user.click(firstOption);

    expect(changeLanguageMock).toHaveBeenCalledWith(allLanguages[0]);

    expect(mockRouter).toEqual(
      expect.objectContaining({
        asPath: "/messages/hosting",
        pathname: "/messages/hosting",
        locale: allLanguages[0],
      }),
    );
  });
});
