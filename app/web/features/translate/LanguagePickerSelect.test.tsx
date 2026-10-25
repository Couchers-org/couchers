import { render, screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import mockRouter from "next-router-mock";
import { service } from "service";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { MockedService } from "test/utils";

import { TranslationReadiness } from "../../i18n/translationReadiness";
import LanguagePickerSelect from "./LanguagePickerSelect";

const { t } = i18n;

const mockAuthState = {
  authenticated: true,
};

jest.mock("features/auth/useAuthStore", () => ({
  __esModule: true,
  default: () => ({
    authState: mockAuthState,
  }),
}));

jest.mock("i18n/useSelectableLocales", () => ({
  __esModule: true,
  useSelectableLocales: () => [
    { code: "en", autonym: "English", readiness: TranslationReadiness.Complete },
    { code: "de", autonym: "Deutsch", readiness: TranslationReadiness.AlmostDone },
    { code: "fr", autonym: "Français", readiness: TranslationReadiness.Midway },
    { code: "es", autonym: "Español", readiness: TranslationReadiness.EarlyStage },
  ],
}));

const changeLanguageMock = service.account.changeLanguage as MockedService<typeof service.account.changeLanguage>;

describe("LanguagePickerSelect", () => {
  beforeEach(() => {
    mockRouter.setCurrentUrl("/messages/all");
    mockAuthState.authenticated = true;
    jest.clearAllMocks();
  });

  it("renders the select with the correct options", async () => {
    render(<LanguagePickerSelect />, { wrapper });

    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(select);

    const listBox = await screen.findByRole("listbox");

    // Ensure all languages are present
    const expectedLanguages = ["English", "Deutsch", "Français", "Español"];
    expectedLanguages.forEach((language) => {
      within(listBox).getByText(language);
    });

    // Wait for MUI transitions to complete
    await waitFor(() => expect(select).toBeInTheDocument());
  });

  it("calls changeLanguage and re-routes with locale on selection", async () => {
    // Mock document.cookie
    const cookieSetter = jest.fn();
    Object.defineProperty(document, "cookie", {
      set: cookieSetter,
      configurable: true,
    });

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
    const spanishOption = within(listBox).getByText("Español");

    await user.click(spanishOption);

    // Should set cookie client-side for authenticated users too
    expect(cookieSetter).toHaveBeenCalledWith("NEXT_LOCALE=es; path=/; max-age=31536000; samesite=lax");

    // Should also call backend API for authenticated users
    expect(changeLanguageMock).toHaveBeenCalledWith("es");

    await waitFor(() =>
      expect(mockRouter).toEqual(
        expect.objectContaining({
          asPath: "/messages/all",
          pathname: "/messages/all",
          locale: "es",
        }),
      ),
    );
  });

  it("sets cookie client-side for logged-out users and does not call backend", async () => {
    // Mock logged-out state
    mockAuthState.authenticated = false;

    // Mock document.cookie
    const cookieSetter = jest.fn();
    Object.defineProperty(document, "cookie", {
      set: cookieSetter,
      configurable: true,
    });

    render(<LanguagePickerSelect />, { wrapper });

    const select = screen.getByRole("combobox");
    const user = userEvent.setup();
    await user.click(select);

    const listBox = await screen.findByRole("listbox");
    const frenchOption = within(listBox).getByText("Français");

    await user.click(frenchOption);

    // Should set cookie client-side
    expect(cookieSetter).toHaveBeenCalledWith("NEXT_LOCALE=fr; path=/; max-age=31536000; samesite=lax");

    // Should NOT call backend API for logged-out users
    expect(changeLanguageMock).not.toHaveBeenCalled();

    // Should navigate to the new locale
    await waitFor(() =>
      expect(mockRouter).toEqual(
        expect.objectContaining({
          locale: "fr",
        }),
      ),
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

  it("prevents rapid consecutive language changes", async () => {
    // Mock document.cookie
    const cookieSetter = jest.fn();
    Object.defineProperty(document, "cookie", {
      set: cookieSetter,
      configurable: true,
    });

    render(<LanguagePickerSelect />, { wrapper });

    const select = screen.getByRole("combobox");
    const user = userEvent.setup();

    // First language change
    await user.click(select);
    const listBox = await screen.findByRole("listbox");
    const spanishOption = within(listBox).getByText("Español");
    await user.click(spanishOption);

    // Verify first change went through
    expect(cookieSetter).toHaveBeenCalledTimes(1);
    expect(changeLanguageMock).toHaveBeenCalledTimes(1);
    expect(changeLanguageMock).toHaveBeenCalledWith("es");

    // Clear mocks
    cookieSetter.mockClear();
    changeLanguageMock.mockClear();

    // Second change should work after first completes
    await user.click(select);
    const listBox2 = await screen.findByRole("listbox");
    const frenchOption = within(listBox2).getByText("Français");
    await user.click(frenchOption);

    // Second change should succeed
    expect(cookieSetter).toHaveBeenCalledTimes(1);
    expect(changeLanguageMock).toHaveBeenCalledTimes(1);
    expect(changeLanguageMock).toHaveBeenCalledWith("fr");
  });
});
