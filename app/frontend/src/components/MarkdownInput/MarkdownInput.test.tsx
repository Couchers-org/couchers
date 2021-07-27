import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CONFIRM_UPLOAD, SELECT_AN_IMAGE } from "components/constants";
import {
  IMAGE_DESCRIPTION,
  INSERT_IMAGE,
} from "components/MarkdownInput/constants";
import { useForm } from "react-hook-form";
import { service } from "service";
import wrapper from "test/hookWrapper";
import { MockedService } from "test/utils";

import MarkdownInput from "./MarkdownInput";

const uploadFileMock = service.api.uploadFile as MockedService<
  typeof service.api.uploadFile
>;

const Form = ({ submit }: { submit(value: string): void }) => {
  const { control, handleSubmit } = useForm();
  const onSubmit = handleSubmit(({ value }) => submit(value));
  return (
    <form onSubmit={onSubmit}>
      <h1 id="form-header">Form</h1>
      <MarkdownInput
        control={control}
        labelId="form-header"
        id="markdown-input"
        name="value"
        imageUpload
      />
      <input type="submit" />
    </form>
  );
};

describe("MarkdownInput", () => {
  it("has a working image upload button", async () => {
    const mockFile = new File([], "example.jpg");
    uploadFileMock.mockResolvedValue({
      file: mockFile,
      filename: "example.jpg",
      key: "key",
      thumbnail_url: "thumb.jpg",
      full_url: "full.jpg",
    });
    const onSubmit = jest.fn();

    render(<Form submit={onSubmit} />, { wrapper });
    userEvent.click(screen.getByRole("button", { name: INSERT_IMAGE }));
    const dialog = await screen.findByRole("dialog");
    userEvent.upload(within(dialog).getByLabelText(SELECT_AN_IMAGE), mockFile);
    userEvent.type(
      within(dialog).getByLabelText(IMAGE_DESCRIPTION),
      "description"
    );
    userEvent.click(
      await within(dialog).findByRole("button", { name: CONFIRM_UPLOAD })
    );
    await waitForElementToBeRemoved(dialog);
    userEvent.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() =>
      expect(onSubmit).toBeCalledWith("![description](full.jpg)")
    );
  });
});
