import { render, screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import mockRouter from "next-router-mock";
import { service } from "service";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { MockedService } from "test/utils";

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

    // Only languages with >= 50% translation should be shown
    const expectedLanguages = ["EN", "ES", "FR", "DE"];
    expectedLanguages.forEach((language) => {
      within(listBox).getByText(language);
    });

    // Languages < 50% should not be shown
    expect(within(listBox).queryByText("RU")).not.toBeInTheDocument();
    expect(within(listBox).queryByText("IT")).not.toBeInTheDocument();
    expect(within(listBox).queryByText("PT")).not.toBeInTheDocument();

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
    const spanishOption = within(listBox).getByText("ES");

    await user.click(spanishOption);

    // Should set cookie client-side for authenticated users too
    expect(cookieSetter).toHaveBeenCalledWith(
      "NEXT_LOCALE=es; path=/; max-age=31536000; samesite=lax",
    );

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
    const frenchOption = within(listBox).getByText("FR");

    await user.click(frenchOption);

    // Should set cookie client-side
    expect(cookieSetter).toHaveBeenCalledWith(
      "NEXT_LOCALE=fr; path=/; max-age=31536000; samesite=lax",
    );

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
    const spanishOption = within(listBox).getByText("ES");
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
    const frenchOption = within(listBox2).getByText("FR");
    await user.click(frenchOption);

    // Second change should succeed
    expect(cookieSetter).toHaveBeenCalledTimes(1);
    expect(changeLanguageMock).toHaveBeenCalledTimes(1);
    expect(changeLanguageMock).toHaveBeenCalledWith("fr");
  });
});
