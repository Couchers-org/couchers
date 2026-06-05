import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useTranslation } from "i18n";
import { useForm } from "react-hook-form";
import i18n from "test/i18n";
import dayjs, { Dayjs } from "utils/dayjs";

import wrapper from "../test/hookWrapper";
import Datepicker from "./Datepicker";

const { t } = i18n;

jest.mock("@mui/x-date-pickers", () => {
  return {
    ...jest.requireActual("@mui/x-date-pickers"),
    DatePicker: jest.requireActual("@mui/x-date-pickers").DesktopDatePicker,
    PickersDay: jest.requireActual("@mui/x-date-pickers").DesktopPickersDay,
  };
});

const Form = ({ setDate }: { setDate: (date: Dayjs) => void }) => {
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
        defaultValue={dayjs()}
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
    let date: Dayjs | undefined = undefined;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    await user.click(
      screen.getByLabelText(t("global:components.datepicker.change_date")),
    );

    await user.click(screen.getByRole("button", { name: t("global:submit") }));

    expect(date).toBeDefined();
    expect(date!.date).toEqual(dayjs("2021-03-23").date);
  });

  it("selecting today works with timezone US/Eastern", async () => {
    let date: Dayjs | undefined;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const submitButton = await screen.findByRole("button", {
      name: t("global:submit"),
    });

    await user.click(submitButton);

    expect(date?.format("YYYY-MM-DD")).toBe("2021-03-20");
  });

  it("selecting today works with timezone UTC", async () => {
    dayjs.tz.setDefault("UTC");

    let date: Dayjs | undefined;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const submitButton = await screen.findByRole("button", {
      name: t("global:submit"),
    });

    await user.click(submitButton);

    expect(date?.format("YYYY-MM-DD")).toBe("2021-03-20");
  });

  it("selecting today works with timezone Europe/London", async () => {
    dayjs.tz.setDefault("Europe/London");

    let date: Dayjs | undefined;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const submitButton = await screen.findByRole("button", {
      name: t("global:submit"),
    });

    await user.click(submitButton);

    expect(date?.format("YYYY-MM-DD")).toBe("2021-03-20");
  });

  it("selecting today works with timezone Brazil/East", async () => {
    dayjs.tz.setDefault("Brazil/East");

    let date: Dayjs | undefined;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const submitButton = await screen.findByRole("button", {
      name: t("global:submit"),
    });

    await user.click(submitButton);

    expect(date?.format("YYYY-MM-DD")).toBe("2021-03-20");
  });

  it("selecting today works with timezone Australia/Adelaide", async () => {
    dayjs.tz.setDefault("Australia/Adelaide");

    let date: Dayjs | undefined;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const submitButton = await screen.findByRole("button", {
      name: t("global:submit"),
    });

    await user.click(submitButton);

    expect(date?.format("YYYY-MM-DD")).toBe("2021-03-20");
  });

  it("typing should work in de's DD.MM.YYYY format", async () => {
    i18n.changeLanguage("de");

    let date: Dayjs | undefined = undefined;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const group = await screen.findByRole("group", { name: /Date field/i });
    await user.click(group);

    // Clear the field and type the full date
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("21032021");

    await user.click(screen.getByRole("button", { name: t("global:submit") }));

    const expectedDate = "2021-03-21";
    expect(date).toBeDefined();
    expect(date!.format("YYYY-MM-DD")).toEqual(expectedDate);
  });

  it("typing should work in en's MM/DD/YYYY format", async () => {
    i18n.changeLanguage("en");

    let date: Dayjs | undefined = undefined;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const group = await screen.findByRole("group", { name: /Date field/i });
    await user.click(group);

    // Clear the field and type the full date
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("03212021");

    await user.click(screen.getByRole("button", { name: t("global:submit") }));

    const expectedDate = "2021-03-21";
    expect(date).toBeDefined();
    expect(date!.format("YYYY-MM-DD")).toEqual(expectedDate);
  });

  it("typing should work in zh-Hant's YYYY/MM/DD format", async () => {
    i18n.changeLanguage("zh-Hant");

    let date: Dayjs | undefined = undefined;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const group = await screen.findByRole("group", { name: /Date field/i });
    await user.click(group);

    // Clear the field and type the full date
    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("20210321");

    await user.click(screen.getByRole("button", { name: t("global:submit") }));

    const expectedDate = "2021-03-21";
    expect(date).toBeDefined();
    expect(date!.format("YYYY-MM-DD")).toEqual(expectedDate);
  });

  it("uses the locale date format when no format prop is given", async () => {
    render(<Form setDate={() => {}} />, { wrapper });

    const group = await screen.findByRole("group", { name: /Date field/i });

    // en locale format is MM/DD/YYYY, system time is 2021-03-20
    expect(group).toHaveTextContent("03/20/2021");
  });

  it("uses the format prop to override the locale date format", async () => {
    const FormatForm = () => {
      const { control } = useForm();
      return (
        <Datepicker
          control={control}
          error={false}
          helperText=""
          id="date-field"
          testId="datepicker"
          label="Date field"
          name="datefield"
          defaultValue={dayjs("2021-03-20")}
          format="LL"
        />
      );
    };

    render(<FormatForm />, { wrapper });

    const group = await screen.findByRole("group", { name: /Date field/i });

    // LL is the localized long date format, e.g. "March 20, 2021"
    expect(group).toHaveTextContent("March 20, 2021");
  });
});
