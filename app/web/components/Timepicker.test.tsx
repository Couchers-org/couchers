import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import i18n from "test/i18n";
import { Dayjs } from "utils/dayjs";

import wrapper from "../test/hookWrapper";
import Timepicker from "./Timepicker";

const { t } = i18n;

jest.mock("@mui/x-date-pickers", () => {
  return {
    ...jest.requireActual("@mui/x-date-pickers"),
    DatePicker: jest.requireActual("@mui/x-date-pickers").DesktopDatePicker,
    TimePicker: jest.requireActual("@mui/x-date-pickers").DesktopTimePicker,
  };
});

const Form = ({ setTime }: { setTime: (time: Dayjs | null) => void }) => {
  const { control, handleSubmit } = useForm();
  const onSubmit = handleSubmit((data) => setTime(data.timefield));
  return (
    <form onSubmit={onSubmit}>
      <Timepicker
        control={control}
        error={false}
        helperText=""
        id="time-field"
        testId="timepicker"
        label="Time field"
        name="timefield"
        defaultValue={null}
      />
      <input type="submit" value="Submit" />
    </form>
  );
};

describe("Timepicker", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("accepts 24-hour time in 24-hour locale (de-DE)", async () => {
    jest.spyOn(navigator, "language", "get").mockReturnValue("de-DE");
    let time: Dayjs | null = null;
    render(<Form setTime={(t) => (time = t)} />, { wrapper });
    const input = screen.getByRole("textbox") as HTMLInputElement;
    const user = userEvent.setup();
    await user.type(input, "2359");
    await waitFor(() => expect(input).toHaveValue("23:59"));
    await user.click(screen.getByRole("button", { name: t("global:submit") }));
    expect(time).toBeDefined();
    expect(time!.hour()).toBe(23);
    expect(time!.minute()).toBe(59);
  });

  it("accepts 12-hour time in 12-hour locale (en-US)", async () => {
    jest.spyOn(navigator, "language", "get").mockReturnValue("en-US");
    let time: Dayjs | null = null;
    render(<Form setTime={(t) => (time = t)} />, { wrapper });
    const input = screen.getByRole("textbox") as HTMLInputElement;
    const user = userEvent.setup();
    await user.type(input, "1200 AM");
    await waitFor(() => expect(input).toHaveValue("12:00 am"));
    await user.click(screen.getByRole("button", { name: t("global:submit") }));
    expect(time).toBeDefined();
    expect(time!.hour()).toBe(0);
    expect(time!.minute()).toBe(0);
  });

  it("accepts 1:37 PM in 12-hour locale (en-US)", async () => {
    jest.spyOn(navigator, "language", "get").mockReturnValue("en-US");
    let time: Dayjs | null = null;
    render(<Form setTime={(t) => (time = t)} />, { wrapper });
    const input = screen.getByRole("textbox") as HTMLInputElement;
    const user = userEvent.setup();
    await user.type(input, "0137 PM");
    await waitFor(() => expect(input).toHaveValue("01:37 pm"));
    await user.click(screen.getByRole("button", { name: t("global:submit") }));
    expect(time).toBeDefined();
    expect(time!.hour()).toBe(13);
    expect(time!.minute()).toBe(37);
  });

  it("accepts 13:37 in 24-hour locale (fr-FR)", async () => {
    jest.spyOn(navigator, "language", "get").mockReturnValue("fr-FR");
    let time: Dayjs | null = null;
    render(<Form setTime={(t) => (time = t)} />, { wrapper });
    const input = screen.getByRole("textbox") as HTMLInputElement;
    const user = userEvent.setup();
    await user.type(input, "1337");
    await waitFor(() => expect(input).toHaveValue("13:37"));
    await user.click(screen.getByRole("button", { name: t("global:submit") }));
    expect(time).toBeDefined();
    expect(time!.hour()).toBe(13);
    expect(time!.minute()).toBe(37);
  });
});
