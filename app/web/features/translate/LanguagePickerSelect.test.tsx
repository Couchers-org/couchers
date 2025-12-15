import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import mockRouter from "next-router-mock";
import { service } from "service";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { MockedService } from "test/utils";

import LanguagePickerSelect from "./LanguagePickerSelect";

const { t } = i18n;

jest.mock("features/auth/useAuthStore", () => ({
  __esModule: true,
  default: () => ({
    authState: {
      authenticated: true,
    },
  }),
}));

jest.mock("features/weblate/useWeblateStats", () => ({
  __esModule: true,
  useWeblateStats: () => ({
    data: [
      { code: "en", name: "English", translated_percent: 100 },
      { code: "es", name: "Spanish", translated_percent: 85 },
      { code: "fr", name: "French", translated_percent: 75 },
      { code: "de", name: "German", translated_percent: 60 },
      { code: "it", name: "Italian", translated_percent: 45 },
      { code: "pt", name: "Portuguese", translated_percent: 30 },
      { code: "ru", name: "Russian", translated_percent: 15 },
    ],
    isLoading: false,
    error: null,
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

    // Only languages with > 50% translation should be shown
    const expectedLanguages = ["EN", "ES", "FR", "DE"];
    expectedLanguages.forEach((language) => {
      within(listBox).getByText(language);
    });

    // Russian should not be present since it has < 20% translation
    expect(within(listBox).queryByText("RU")).not.toBeInTheDocument();
    expect(within(listBox).queryByText("IT")).not.toBeInTheDocument();
    expect(within(listBox).queryByText("PT")).not.toBeInTheDocument();
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
    const spanishOption = within(listBox).getByText("ES");

    await user.click(spanishOption);

    expect(changeLanguageMock).toHaveBeenCalledWith("es");

    expect(mockRouter).toEqual(
      expect.objectContaining({
        asPath: "/messages/hosting",
        pathname: "/messages/hosting",
        locale: "es",
      }),
    );
  });

  it("view all settings link navigates to the language section of the account settings page", async () => {
    render(<LanguagePickerSelect />, { wrapper });

    const select = screen.getByRole("combobox");
    const user = userEvent.setup();
    await user.click(select);

    const listBox = await screen.findByRole("listbox");
    const translationProgressLink = within(listBox).getByText(
      t("global:language_preference.translation_progress.title"),
    );

    expect(translationProgressLink).toBeInTheDocument();

    await user.click(translationProgressLink);

    expect(mockRouter).toEqual(
      expect.objectContaining({
        asPath: "/translate",
      }),
    );
  });
});
