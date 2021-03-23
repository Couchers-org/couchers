import {
  fireEvent,
  Queries,
  render,
  RenderResult,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SUBMIT } from "features/constants";
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

describe("DatePicker", () => {
  const submitForm = jest.fn();
  let testWrapper: RenderResult<Queries, HTMLElement>;

  beforeEach(() => {
    submitForm.mockClear();
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

    testWrapper = render(<Form />, { wrapper });
  });

  it("should submit with proper date for clicking", async () => {
    await waitFor(() => {
      fireEvent.click(
        testWrapper.container.querySelector(".MuiIconButton-label") as Element
      );
      fireEvent.click(screen.getByText("23"));

      userEvent.click(screen.getByRole("button", { name: SUBMIT }));
    });
    expect(submitForm).toHaveBeenCalledWith({ datefield: "2021-03-23" });
  });
});
