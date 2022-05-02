import { render, screen, waitFor } from "@testing-library/react";
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
      />
      <input type="submit" name={t("submit")} />
    </form>
  );
};

describe.skip("DatePicker", () => {
  beforeEach(() => {
    jest.useFakeTimers("modern");
    jest.setSystemTime(new Date("2021-03-20"));
  });
  afterEach(() => {
    jest.useRealTimers();
  });
  it("should submit with proper date for clicking", async () => {
    let date: Dayjs | undefined = undefined;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });
    await userEvent.click(
      screen.getByLabelText(t("global:components.datepicker.change_date"))
    );
    await userEvent.click(screen.getByText("23"));
    await userEvent.click(screen.getByRole("button", { name: t("global:submit") }));

    await waitFor(() => {
      expect(date?.format()).toEqual(dayjs("2021-03-23").format());
    });
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
    await userEvent.click(
      await screen.findByRole("button", { name: t("global:submit") })
    );

    await waitFor(() => {
      expect(date?.format().split("T")[0]).toBe("2021-03-20");
    });
    timezoneMock.unregister();
    spy.mockRestore();
  });

  // Note - single letter formats don't work with typing, so we changed them to double
  it.each`
    language   | afterOneBackspace | typing         | afterInput
    ${"en-GB"} | ${"20/03/202_"}   | ${"21032021"}  | ${"21/03/2021"}
    ${"en-US"} | ${"03/20/202_"}   | ${"03/212021"} | ${"03/21/2021"}
    ${"or-IN"} | ${"20-03-2_"}     | ${"21-0321"}   | ${"21-03-21"}
    ${"zh-TW"} | ${"2021/03/2_"}   | ${"20210321"}  | ${"2021/03/21"}
  `(
    "typing works in $language",
    async ({ language, afterOneBackspace, typing, afterInput }) => {
      const langMock = jest.spyOn(navigator, "language", "get");
      langMock.mockReturnValue(language);

      let date: Dayjs | undefined = undefined;
      render(<Form setDate={(d) => (date = d)} />, { wrapper });

      const input = screen.getByRole("textbox") as HTMLInputElement;
      await userEvent.type(screen.getByRole("textbox"), "{backspace}");
      expect(input.value).toBe(afterOneBackspace);
      await userEvent.clear(input);
      await userEvent.type(input, typing);
      expect(input.value).toBe(afterInput);
      await userEvent.click(screen.getByRole("button", { name: t("global:submit") }));
      const expectedDate = "2021-03-21";
      await waitFor(() => {
        expect(date?.format().split("T")[0]).toEqual(expectedDate);
      });
    }
  );
});
