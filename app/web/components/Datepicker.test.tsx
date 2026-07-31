import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useTranslation } from "i18n";
import { useForm } from "react-hook-form";
import { Temporal } from "temporal-polyfill";
import i18n from "test/i18n";
import dayjs from "utils/dayjs";

import wrapper from "../test/hookWrapper";
import Datepicker, { PickerOnlyDatepicker } from "./Datepicker";

const { t } = i18n;

jest.mock("@mui/x-date-pickers", () => {
  return {
    ...jest.requireActual("@mui/x-date-pickers"),
    // Force the Desktop variant so tests get consistent, non-adaptive
    // rendering regardless of viewport
    DatePicker: jest.requireActual("@mui/x-date-pickers").DesktopDatePicker,
  };
});

const Form = ({
  setDate,
}: {
  setDate: (date: Temporal.PlainDate | null) => void;
}) => {
  const { t } = useTranslation();
  const { control, handleSubmit } = useForm();
  const onSubmit = handleSubmit((data) => setDate(data.datefield));
  return (
    <form onSubmit={onSubmit}>
      <Datepicker
        control={control}
        error={false}
        helperText=""
        id="date-field"
        testId="datepicker"
        label="Date field"
        name="datefield"
        defaultValue={Temporal.Now.plainDateISO()}
      />
      <input type="submit" name={t("submit")} />
    </form>
  );
};

describe("DatePicker", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2021-03-20 00:00"));
  });

  afterEach(async () => {
    jest.resetAllMocks();
    jest.clearAllTimers();
    await act(() => i18n.changeLanguage("en"));
  });

  it("should submit with proper date for clicking", async () => {
    let date: Temporal.PlainDate | null = null;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    await user.click(
      screen.getByLabelText(t("global:components.datepicker.change_date")),
    );

    await user.click(screen.getByRole("button", { name: t("global:submit") }));

    expect(date!.toString()).toBe("2021-03-20");
  });

  it("selecting today works with timezone US/Eastern", async () => {
    let date: Temporal.PlainDate | null = null;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const submitButton = await screen.findByRole("button", {
      name: t("global:submit"),
    });

    await user.click(submitButton);

    expect(date!.toString()).toBe("2021-03-20");
  });

  it("selecting today works with timezone UTC", async () => {
    dayjs.tz.setDefault("UTC");

    let date: Temporal.PlainDate | null = null;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const submitButton = await screen.findByRole("button", {
      name: t("global:submit"),
    });

    await user.click(submitButton);

    expect(date!.toString()).toBe("2021-03-20");
  });

  it("selecting today works with timezone Europe/London", async () => {
    dayjs.tz.setDefault("Europe/London");

    let date: Temporal.PlainDate | null = null;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const submitButton = await screen.findByRole("button", {
      name: t("global:submit"),
    });

    await user.click(submitButton);

    expect(date!.toString()).toBe("2021-03-20");
  });

  it("selecting today works with timezone Brazil/East", async () => {
    dayjs.tz.setDefault("Brazil/East");

    let date: Temporal.PlainDate | null = null;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const submitButton = await screen.findByRole("button", {
      name: t("global:submit"),
    });

    await user.click(submitButton);

    expect(date!.toString()).toBe("2021-03-20");
  });

  it("selecting today works with timezone Australia/Adelaide", async () => {
    dayjs.tz.setDefault("Australia/Adelaide");

    let date: Temporal.PlainDate | null = null;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const submitButton = await screen.findByRole("button", {
      name: t("global:submit"),
    });

    await user.click(submitButton);

    expect(date!.toString()).toBe("2021-03-20");
  });

  it("typing should work in de's DD.MM.YYYY format", async () => {
    i18n.changeLanguage("de");

    let date: Temporal.PlainDate | null = null;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const group = await screen.findByRole("group", { name: /Date field/i });
    await user.click(group);

    // Clear the field and type the full date
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("21032021");

    await user.click(screen.getByRole("button", { name: t("global:submit") }));

    expect(date!.toString()).toBe("2021-03-21");
  });

  it("typing should work in en's MM/DD/YYYY format", async () => {
    i18n.changeLanguage("en");

    let date: Temporal.PlainDate | null = null;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const group = await screen.findByRole("group", { name: /Date field/i });
    await user.click(group);

    // Clear the field and type the full date
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("03212021");

    await user.click(screen.getByRole("button", { name: t("global:submit") }));

    expect(date!.toString()).toBe("2021-03-21");
  });

  it("typing should work in zh-Hant's YYYY/MM/DD format", async () => {
    i18n.changeLanguage("zh-Hant");

    let date: Temporal.PlainDate | null = null;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const group = await screen.findByRole("group", { name: /Date field/i });
    await user.click(group);

    // Clear the field and type the full date
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("20210321");

    await user.click(screen.getByRole("button", { name: t("global:submit") }));

    expect(date!.toString()).toBe("2021-03-21");
  });

  it("uses the locale date format when no format prop is given", async () => {
    render(<Form setDate={() => {}} />, { wrapper });

    const group = await screen.findByRole("group", { name: /Date field/i });

    // en locale format is MM/DD/YYYY, system time is 2021-03-20
    expect(group).toHaveTextContent("03/20/2021");
  });

  describe("PickerOnlyDatepicker", () => {
    it("shows a localized long date with the month name", async () => {
      const LongDateForm = () => {
        const { control } = useForm();
        return (
          <PickerOnlyDatepicker
            control={control}
            error={false}
            helperText=""
            id="date-field"
            testId="datepicker"
            label="Date field"
            name="datefield"
            defaultValue={Temporal.PlainDate.from("2021-03-20")}
          />
        );
      };

      render(<LongDateForm />, { wrapper });

      // PickerOnlyDatepicker renders a single read-only input showing the long date.
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input).toHaveValue("March 20, 2021");
    });

    it("localizes the long date via the adapter locale", async () => {
      const LocalizedForm = () => {
        const { control } = useForm();
        return (
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="de">
            <PickerOnlyDatepicker
              control={control}
              error={false}
              helperText=""
              id="date-field"
              testId="datepicker"
              label="Date field"
              name="datefield"
              defaultValue={Temporal.PlainDate.from("1990-04-08")}
            />
          </LocalizationProvider>
        );
      };

      render(<LocalizedForm />, { wrapper });

      // German long date via the adapter locale: day-first with the German month
      // name (the localized "LL" format), not the English "April 8, 1990".
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input).toHaveValue("8. April 1990");
    });

    it("read-only, no mask placeholder, opens on click", async () => {
      const PickerOnlyForm = () => {
        const { control } = useForm();
        return (
          <PickerOnlyDatepicker
            control={control}
            error={false}
            helperText=""
            id="date-field"
            testId="datepicker"
            label="Date field"
            name="datefield"
          />
        );
      };

      render(<PickerOnlyForm />, { wrapper });
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      const input = screen.getByRole("textbox") as HTMLInputElement;

      // no text input allowed
      expect(input).toHaveAttribute("readonly");
      // no prefilled mask (e.g. "MMMM DD, YYYY")
      expect(input).toHaveValue("");
      expect(input.getAttribute("placeholder") ?? "").not.toMatch(/[MDY]/);

      // typing does nothing
      await user.type(input, "03212021");
      expect(input).toHaveValue("");

      // clicking the field (not just the icon) opens the picker
      await user.click(input);
      expect(await screen.findByRole("dialog")).toBeInTheDocument();
    });
  });
});
