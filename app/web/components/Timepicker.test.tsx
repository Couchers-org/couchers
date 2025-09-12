import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useForm } from "react-hook-form";

import wrapper from "@/test/hookWrapper";
import { Dayjs } from "@/utils/dayjs";

import Timepicker from "./Timepicker";

jest.mock("@mui/x-date-pickers", () => {
  const originalModule = jest.requireActual<
    typeof import("@mui/x-date-pickers")
  >("@mui/x-date-pickers");
  return {
    ...originalModule,
    DatePicker: originalModule.DesktopDatePicker,
    TimePicker: originalModule.DesktopTimePicker,
  };
});

const Form = ({ setTime }: { setTime: (time: Dayjs | null) => void }) => {
  const { control, handleSubmit } = useForm();
  const onSubmit = handleSubmit((data) => {
    setTime(data.timefield as Dayjs);
  });
  return (
    <form onSubmit={() => void onSubmit()}>
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

    const user = userEvent.setup();

    const group = await screen.findByRole("group", { name: /Time field/i });
    await user.click(group);

    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("2359");

    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(time).toBeDefined();
    expect(time!.hour()).toBe(23);
    expect(time!.minute()).toBe(59);
  });

  it("accepts 12-hour time in 12-hour locale (en-US)", async () => {
    jest.spyOn(navigator, "language", "get").mockReturnValue("en-US");
    let time: Dayjs | null = null;
    render(<Form setTime={(t) => (time = t)} />, { wrapper });

    const user = userEvent.setup();

    const group = await screen.findByRole("group", { name: /Time field/i });
    await user.click(group);

    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("1200 AM");

    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(time).toBeDefined();
    expect(time!.hour()).toBe(0);
    expect(time!.minute()).toBe(0);
  });

  it("accepts 1:37 PM in 12-hour locale (en-US)", async () => {
    jest.spyOn(navigator, "language", "get").mockReturnValue("en-US");
    let time: Dayjs | null = null;
    render(<Form setTime={(t) => (time = t)} />, { wrapper });

    const user = userEvent.setup();

    const group = await screen.findByRole("group", { name: /Time field/i });
    await user.click(group);

    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("0137 PM");

    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(time).toBeDefined();
    expect(time!.hour()).toBe(13);
    expect(time!.minute()).toBe(37);
  });

  it("accepts 13:37 in 24-hour locale (fr-FR)", async () => {
    jest.spyOn(navigator, "language", "get").mockReturnValue("fr-FR");
    let time: Dayjs | null = null;
    render(<Form setTime={(t) => (time = t)} />, { wrapper });

    const user = userEvent.setup();

    const group = await screen.findByRole("group", { name: /Time field/i });
    await user.click(group);

    await user.keyboard("{Control>}a{/Control}");
    await user.keyboard("1337");

    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(time).toBeDefined();
    expect(time!.hour()).toBe(13);
    expect(time!.minute()).toBe(37);
  });
});
