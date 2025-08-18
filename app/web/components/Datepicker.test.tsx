import { render, screen, waitFor } from "@testing-library/react";
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

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllTimers();
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

  it("typing should work in en-GB", async () => {
    const langMock = jest.spyOn(navigator, "language", "get");
    langMock.mockReturnValue("en-GB");

    let date: Dayjs | undefined = undefined;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });

    const input = screen.getByRole("textbox") as HTMLInputElement;

    await waitFor(() => expect(input).toBeEnabled());

    const user = userEvent.setup();

    user.type(input, "21032021");
    await waitFor(() => expect(input).toHaveValue("21/03/2021"));
    user.click(screen.getByRole("button", { name: t("global:submit") }));
    const expectedDate = "2021-03-21";
    await waitFor(() => {
      expect(date?.format().split("T")[0]).toEqual(expectedDate);
    });
  });

  it("typing should work in en-US", async () => {
    const langMock = jest.spyOn(navigator, "language", "get");
    langMock.mockReturnValue("en-US");

    let date: Dayjs | undefined = undefined;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });

    const input = screen.getByRole("textbox") as HTMLInputElement;

    await waitFor(() => expect(input).toBeEnabled());

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    await user.type(input, "03212021");
    expect(input).toHaveValue("03/21/2021");
    await user.click(screen.getByRole("button", { name: t("global:submit") }));
    const expectedDate = "2021-03-21";

    expect(date).toBeDefined();
    expect(date!.format().split("T")[0]).toEqual(expectedDate);
  });

  it("typing should work in or-IN", async () => {
    const langMock = jest.spyOn(navigator, "language", "get");
    langMock.mockReturnValue("or-IN");

    let date: Dayjs | undefined = undefined;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });

    const input = screen.getByRole("textbox") as HTMLInputElement;
    await waitFor(() => expect(input).toBeEnabled());

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    await user.type(input, "21-0321");
    expect(input).toHaveValue("21-03-21");
    await user.click(screen.getByRole("button", { name: t("global:submit") }));
    const expectedDate = "2021-03-21";

    expect(date).toBeDefined();
    expect(date!.format().split("T")[0]).toEqual(expectedDate);
  });

  it("typing should work in zh-TW", async () => {
    const langMock = jest.spyOn(navigator, "language", "get");
    langMock.mockReturnValue("zh-TW");

    let date: Dayjs | undefined = undefined;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });

    const input = screen.getByRole("textbox") as HTMLInputElement;
    await waitFor(() => expect(input).toBeEnabled());

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    await user.type(input, "20210321");
    expect(input).toHaveValue("2021/03/21");
    await user.click(screen.getByRole("button", { name: t("global:submit") }));
    const expectedDate = "2021-03-21";

    expect(date).toBeDefined();
    expect(date!.format().split("T")[0]).toEqual(expectedDate);
  });
});
