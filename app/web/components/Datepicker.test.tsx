import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTranslation } from "i18n";
import { useForm } from "react-hook-form";
import { t } from "test/utils";
import timezoneMock from "timezone-mock";
import dayjs, { Dayjs } from "utils/dayjs";

import wrapper from "../test/hookWrapper";
import Datepicker from "./Datepicker";

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
    jest.setSystemTime(new Date("2021-03-20"));
  });
  afterEach(() => {
    jest.useRealTimers();
  });
  it("should submit with proper date for clicking", async () => {
    let date: Dayjs | undefined = undefined;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });
    userEvent.click(
      screen.getByLabelText(t("global:components.datepicker.change_date"))
    );
    const datePickerDialog = await screen.findByRole("dialog");
    userEvent.click(
      within(datePickerDialog).getByRole("gridcell", { name: "23" })
    );
    userEvent.click(
      within(datePickerDialog).getByRole("button", { name: "OK" })
    );
    await waitForElementToBeRemoved(datePickerDialog);

    userEvent.click(screen.getByRole("button", { name: t("global:submit") }));

    await waitFor(() => {
      expect(date?.date).toEqual(dayjs("2021-03-23").date);
    });
  });
});

describe("Selecting today", () => {
  afterEach(() => {
    timezoneMock.unregister();
    jest.restoreAllMocks();
  });

  it.each`
    timezone
    ${"US/Eastern"}
    ${"UTC"}
    ${"Europe/London"}
    ${"Brazil/East"}
    ${"Australia/Adelaide"}
  `("selecting today works with timezone $timezone", async ({ timezone }) => {
    timezoneMock.register(timezone);
    const mockDate = new Date("2021-03-20 00:00");
    //@ts-ignore - ts thinks we mock Date() but actually we want to mock new Date()
    const spy = jest.spyOn(global, "Date").mockImplementation(() => mockDate);
    let date: Dayjs | undefined;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });
    userEvent.click(
      await screen.findByRole("button", { name: t("global:submit") })
    );

    await waitFor(() => {
      expect(date?.format().split("T")[0]).toBe(undefined);
    });
    timezoneMock.unregister();
    spy.mockRestore();
  });
});
