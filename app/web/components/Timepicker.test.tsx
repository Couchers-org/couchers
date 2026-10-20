import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { Temporal } from "temporal-polyfill";
import i18n from "test/i18n";

import wrapper from "../test/hookWrapper";
import Timepicker from "./Timepicker";

jest.mock("@mui/x-date-pickers", () => {
  return {
    ...jest.requireActual("@mui/x-date-pickers"),
    DatePicker: jest.requireActual("@mui/x-date-pickers").DesktopDatePicker,
    TimePicker: jest.requireActual("@mui/x-date-pickers").DesktopTimePicker,
  };
});

const Form = ({ setTime }: { setTime: (time: Temporal.PlainTime | null) => void }) => {
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
      />
      <input type="submit" value="Submit" />
    </form>
  );
};

describe("Timepicker", () => {
  afterEach(async () => {
    jest.resetAllMocks();
    await act(() => i18n.changeLanguage("en"));
  });

  it("accepts 24-hour time in 24-hour locale (de)", async () => {
    i18n.changeLanguage("de");
    let time: Temporal.PlainTime | null = null;
    render(<Form setTime={(t) => (time = t)} />, { wrapper });

    const user = userEvent.setup();

    const group = await screen.findByRole("group", { name: /Time field/i });
    await user.click(group);

    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("2359");

    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(time!.toString()).toBe("23:59:00");
  });

  it("accepts 12-hour time in 12-hour locale (en)", async () => {
    i18n.changeLanguage("en");
    let time: Temporal.PlainTime | null = null;
    render(<Form setTime={(t) => (time = t)} />, { wrapper });

    const user = userEvent.setup();

    const group = await screen.findByRole("group", { name: /Time field/i });
    await user.click(group);

    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("1200 AM");

    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(time!.toString()).toBe("00:00:00");
  });

  it("accepts 1:37 PM in 12-hour locale (en)", async () => {
    i18n.changeLanguage("en");
    let time: Temporal.PlainTime | null = null;
    render(<Form setTime={(t) => (time = t)} />, { wrapper });

    const user = userEvent.setup();

    const group = await screen.findByRole("group", { name: /Time field/i });
    await user.click(group);

    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("0137 PM");

    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(time!.toString()).toBe("13:37:00");
  });

  it("accepts 13:37 in 24-hour locale (fr)", async () => {
    i18n.changeLanguage("fr");
    let time: Temporal.PlainTime | null = null;
    render(<Form setTime={(t) => (time = t)} />, { wrapper });

    const user = userEvent.setup();

    const group = await screen.findByRole("group", { name: /Time field/i });
    await user.click(group);

    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("1337");

    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(time!.toString()).toBe("13:37:00");
  });
});
