import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTranslation } from "i18n";
import { useForm } from "react-hook-form";
import { t } from "test/utils";
import timezoneMock from "timezone-mock";
import dayjs, { Dayjs } from "utils/dayjs";

import wrapper from "../test/hookWrapper";
import Datepicker from "./Datepicker";

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
  beforeAll(() => {
    jest.useFakeTimers();
  });

  beforeEach(() => {
    jest.setSystemTime(new Date("2021-03-20"));
    timezoneMock.register("UTC");
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    timezoneMock.unregister();
    jest.resetAllMocks();
    jest.clearAllTimers();
  });

  it("should submit with proper date for clicking", async () => {
    let date: Dayjs | undefined = undefined;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });
    userEvent.click(
      screen.getByLabelText(t("global:components.datepicker.change_date"))
    );

    userEvent.click(screen.getByRole("button", { name: t("global:submit") }));

    await waitFor(() => {
      expect(date?.date).toEqual(dayjs("2021-03-23").date);
    });
  });

  it("selecting today works with timezone US/Eastern", async () => {
    timezoneMock.register("US/Eastern");
    const mockDate = new Date("2021-03-20 00:00");
    //@ts-ignore - ts thinks we mock Date() but actually we want to mock new Date()
    jest.spyOn(global, "Date").mockImplementation(() => mockDate);

    let date: Dayjs | undefined;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });
    userEvent.click(
      await screen.findByRole("button", { name: t("global:submit") })
    );

    await waitFor(() => {
      expect(date?.format().split("T")[0]).toBe(undefined);
    });
  });

  it("selecting today works with timezone UTC", async () => {
    timezoneMock.register("UTC");
    const mockDate = new Date("2021-03-20 00:00");
    //@ts-ignore - ts thinks we mock Date() but actually we want to mock new Date()
    jest.spyOn(global, "Date").mockImplementation(() => mockDate);

    let date: Dayjs | undefined;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });
    userEvent.click(
      await screen.findByRole("button", { name: t("global:submit") })
    );

    await waitFor(() => {
      expect(date?.format().split("T")[0]).toBe(undefined);
    });
  });

  it("selecting today works with timezone Europe/London", async () => {
    timezoneMock.register("Europe/London");
    const mockDate = new Date("2021-03-20 00:00");
    //@ts-ignore - ts thinks we mock Date() but actually we want to mock new Date()
    jest.spyOn(global, "Date").mockImplementation(() => mockDate);

    let date: Dayjs | undefined;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });
    userEvent.click(
      await screen.findByRole("button", { name: t("global:submit") })
    );

    await waitFor(() => {
      expect(date?.format().split("T")[0]).toBe(undefined);
    });
  });

  it("selecting today works with timezone Brazil/East", async () => {
    timezoneMock.register("Brazil/East");
    const mockDate = new Date("2021-03-20 00:00");
    //@ts-ignore - ts thinks we mock Date() but actually we want to mock new Date()
    jest.spyOn(global, "Date").mockImplementation(() => mockDate);

    let date: Dayjs | undefined;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });
    userEvent.click(
      await screen.findByRole("button", { name: t("global:submit") })
    );

    await waitFor(() => {
      expect(date?.format().split("T")[0]).toBe(undefined);
    });
  });

  it("selecting today works with timezone Australia/Adelaide", async () => {
    timezoneMock.register("Australia/Adelaide");
    const mockDate = new Date("2021-03-20 00:00");
    //@ts-ignore - ts thinks we mock Date() but actually we want to mock new Date()
    jest.spyOn(global, "Date").mockImplementation(() => mockDate);

    let date: Dayjs | undefined;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });
    userEvent.click(
      await screen.findByRole("button", { name: t("global:submit") })
    );

    await waitFor(() => {
      expect(date?.format().split("T")[0]).toBe(undefined);
    });
  });

  it("typing should work in en-GB", async () => {
    const langMock = jest.spyOn(navigator, "language", "get");
    langMock.mockReturnValue("en-GB");

    let date: Dayjs | undefined = undefined;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });

    const input = screen.getByRole("textbox") as HTMLInputElement;
    userEvent.type(screen.getByRole("textbox"), "{backspace}");
    expect(input.value).toBe("20/03/202");
    userEvent.clear(input);
    userEvent.type(input, "21032021");
    expect(input.value).toBe("21/03/2021");
    userEvent.click(screen.getByRole("button", { name: t("global:submit") }));
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
    userEvent.type(screen.getByRole("textbox"), "{backspace}");
    expect(input.value).toBe("03/20/202");
    userEvent.clear(input);
    userEvent.type(input, "03212021");
    expect(input.value).toBe("03/21/2021");
    userEvent.click(screen.getByRole("button", { name: t("global:submit") }));
    const expectedDate = "2021-03-21";
    await waitFor(() => {
      expect(date?.format().split("T")[0]).toEqual(expectedDate);
    });
  });

  it("typing should work in or-IN", async () => {
    const langMock = jest.spyOn(navigator, "language", "get");
    langMock.mockReturnValue("or-IN");

    let date: Dayjs | undefined = undefined;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });

    const input = screen.getByRole("textbox") as HTMLInputElement;
    userEvent.type(screen.getByRole("textbox"), "{backspace}");
    expect(input.value).toBe("20-03-2");
    userEvent.clear(input);
    userEvent.type(input, "21-0321");
    expect(input.value).toBe("21-03-21");
    userEvent.click(screen.getByRole("button", { name: t("global:submit") }));
    const expectedDate = "2021-03-21";
    await waitFor(() => {
      expect(date?.format().split("T")[0]).toEqual(expectedDate);
    });
  });

  it("typing should work in zh-TW", async () => {
    const langMock = jest.spyOn(navigator, "language", "get");
    langMock.mockReturnValue("zh-TW");

    let date: Dayjs | undefined = undefined;
    render(<Form setDate={(d) => (date = d)} />, { wrapper });

    const input = screen.getByRole("textbox") as HTMLInputElement;
    userEvent.type(screen.getByRole("textbox"), "{backspace}");
    expect(input.value).toBe("2021/03/2");
    userEvent.clear(input);
    userEvent.type(input, "20210321");
    expect(input.value).toBe("2021/03/21");
    userEvent.click(screen.getByRole("button", { name: t("global:submit") }));
    const expectedDate = "2021-03-21";
    await waitFor(() => {
      expect(date?.format().split("T")[0]).toEqual(expectedDate);
    });
  });
});
