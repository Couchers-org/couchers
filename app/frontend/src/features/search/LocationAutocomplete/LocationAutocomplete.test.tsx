import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { server } from "test/restMock";
import { GeocodeResult } from "utils/hooks";

import { LOCATION } from "../constants";
import LocationAutocomplete from "./index";

const submitAction = jest.fn();
const submitInvalidAction = jest.fn();

const renderForm = (
  defaultValue: GeocodeResult | undefined,
  onChange: (value: GeocodeResult | "") => void
) => {
  const Form = () => {
    const { control, handleSubmit } = useForm();
    const onSubmit = handleSubmit(submitAction, submitInvalidAction);

    return (
      <form onSubmit={onSubmit}>
        <LocationAutocomplete
          control={control}
          defaultValue={defaultValue}
          onChange={onChange}
        />
        <input type="submit" />
      </form>
    );
  };
  render(<Form />);
};

describe("LocationAutocomplete component", () => {
  beforeAll(() => {
    server.listen();
  });
  afterEach(() => {
    server.resetHandlers();
  });
  afterAll(() => {
    server.close();
  });

  it("successfully searches and submits", async () => {
    const onChange = jest.fn();
    renderForm(undefined, onChange);

    const input = (await screen.findByLabelText(LOCATION)) as HTMLInputElement;
    expect(input).toBeVisible();
    userEvent.type(input, "tes{enter}");

    const item = await screen.findByText("test city, test country");
    expect(item).toBeVisible();
    userEvent.click(item);
    expect(input.value).toBe("test city, test country");

    const submitButton = await screen.findByRole("button");
    userEvent.click(submitButton);
    await waitFor(() => {
      expect(submitAction).toBeCalledWith(
        expect.objectContaining({
          location: {
            name: "test city, test country",
            simplifiedName: "test city, test country",
            location: { lng: 1.0, lat: 2.0 },
          },
        }),
        expect.anything()
      );
    });
  });
});
