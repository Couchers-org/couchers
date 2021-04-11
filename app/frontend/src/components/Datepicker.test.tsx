import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CHANGE_DATE, SUBMIT } from "features/constants";
import mockdate from "mockdate";
import { useForm } from "react-hook-form";

import wrapper from "../test/hookWrapper";
import Datepicker from "./Datepicker";

beforeAll(() => {
  mockdate.set("2021-03-20");
});

afterAll(() => {
  mockdate.reset();
});

const submitForm = jest.fn();
const Form = () => {
  const { control, register, handleSubmit } = useForm();
  const onSubmit = handleSubmit((data) => submitForm(data));
  return (
    <form onSubmit={onSubmit}>
      <Datepicker
        control={control}
        error={false}
        helperText=""
        id="date-field"
        inputRef={register}
        label="Date field"
        name="datefield"
      />
      <input type="submit" name={SUBMIT} />
    </form>
  );
};

describe("DatePicker", () => {
  it("should submit with proper date for clicking", async () => {
    render(<Form />, { wrapper });
    userEvent.click(screen.getByLabelText(CHANGE_DATE));
    userEvent.click(screen.getByText("23"));
    userEvent.click(screen.getByRole("button", { name: SUBMIT }));

    await waitFor(() => {
      expect(submitForm).toHaveBeenCalledWith({
        datefield: new Date("2021-03-23"),
      });
    });
  });

  //Note - single letter formats don't work with typing, so we changed them to double
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

      render(<Form />, { wrapper });

      const input = screen.getByRole("textbox") as HTMLInputElement;
      userEvent.type(screen.getByRole("textbox"), "{backspace}");
      expect(input.value).toBe(afterOneBackspace);
      userEvent.clear(input);
      userEvent.type(input, typing);
      expect(input.value).toBe(afterInput);
      userEvent.click(screen.getByRole("button", { name: SUBMIT }));
      await waitFor(() => {
        expect(submitForm).toHaveBeenCalledWith({
          datefield: new Date("2021-03-21"),
        });
      });
    }
  );
});
