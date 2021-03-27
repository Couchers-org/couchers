import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AvatarInput from "components/AvatarInput";
import {
  CANCEL_UPLOAD,
  CONFIRM_UPLOAD,
  getAvatarLabel,
  INVALID_FILE,
  SELECT_AN_IMAGE,
  UPLOAD_PENDING_ERROR,
} from "components/constants";
import { SUBMIT } from "features/constants";
import { useForm } from "react-hook-form";
import { service } from "service";
import wrapper from "test/hookWrapper";
import { MockedService } from "test/utils";

const uploadFileMock = service.api.uploadFile as MockedService<
  typeof service.api.uploadFile
>;
const submitForm = jest.fn();

const MOCK_FILE = new File([], "example.jpg");
const MOCK_KEY = "key123";
const MOCK_INITIAL_SRC = "https://example.com/initialPreview.jpg";
const MOCK_THUMB = "thumb.jpg";
const NAME = "Test User";

describe("AvatarInput component", () => {
  beforeEach(() => {
    uploadFileMock.mockResolvedValue({
      file: MOCK_FILE,
      filename: MOCK_FILE.name,
      key: MOCK_KEY,
      thumbnail_url: MOCK_THUMB,
      full_url: "full.jpg",
    });
    const Form = () => {
      const { control, handleSubmit, errors } = useForm();
      const onSubmit = handleSubmit((data) => submitForm(data));
      return (
        <form onSubmit={onSubmit}>
          {errors.avatarInput && <p>{errors.avatarInput.message}</p>}
          <AvatarInput
            control={control}
            id="avatar-input"
            initialPreviewSrc={MOCK_INITIAL_SRC}
            name="avatarInput"
            userName={NAME}
          />
          <input type="submit" name={SUBMIT} />
        </form>
      );
    };
    render(<Form />, { wrapper });
  });

  it("displays initial preview", async () => {
    expect(screen.getByAltText(getAvatarLabel(NAME))).toBeVisible();
    expect(screen.getByAltText(getAvatarLabel(NAME))).toHaveProperty(
      "src",
      MOCK_INITIAL_SRC
    );
  });

  it("uploads upon confirmation and submits key", async () => {
    userEvent.upload(screen.getByLabelText(SELECT_AN_IMAGE), MOCK_FILE);

    expect(await screen.findByLabelText(CONFIRM_UPLOAD)).toBeVisible();

    userEvent.click(screen.getByLabelText(CONFIRM_UPLOAD));

    await waitFor(() => {
      expect(uploadFileMock).toHaveBeenCalledTimes(1);
    });

    userEvent.click(screen.getByRole("button", { name: SUBMIT }));

    await waitFor(() => {
      expect(submitForm).toHaveBeenCalledWith({ avatarInput: MOCK_KEY });
      expect(
        screen.getByAltText(getAvatarLabel(NAME)).getAttribute("src")
      ).toMatch(new RegExp(MOCK_THUMB));
    });
  });

  it("cancels when cancel button pressed and doesn't submit key", async () => {
    userEvent.upload(screen.getByLabelText(SELECT_AN_IMAGE), MOCK_FILE);

    expect(await screen.findByLabelText(CANCEL_UPLOAD)).toBeVisible();

    userEvent.click(screen.getByLabelText(CANCEL_UPLOAD));

    await waitFor(() => {
      expect(uploadFileMock).not.toHaveBeenCalled();
    });

    userEvent.click(screen.getByRole("button", { name: SUBMIT }));

    await waitFor(() => {
      expect(submitForm).toHaveBeenCalledWith({ avatarInput: "" });
    });
    expect(screen.getByAltText(getAvatarLabel(NAME))).toHaveProperty(
      "src",
      MOCK_INITIAL_SRC
    );
  });

  it(`uploading, confirming, then uploading again, then cancelling, goes back to the first upload instead of the original`, async () => {
    const OTHER_MOCK_FILE = new File([], "firstImage.jpg");
    uploadFileMock.mockResolvedValueOnce({
      file: OTHER_MOCK_FILE,
      filename: OTHER_MOCK_FILE.name,
      key: "firstKey",
      thumbnail_url: "thumb0.jpg",
      full_url: "full0.jpg",
    });

    //first upload and confirm
    userEvent.upload(screen.getByLabelText(SELECT_AN_IMAGE), OTHER_MOCK_FILE);
    expect(await screen.findByLabelText(CONFIRM_UPLOAD)).toBeVisible();
    userEvent.click(screen.getByLabelText(CONFIRM_UPLOAD));

    await waitFor(() => {
      expect(uploadFileMock).toHaveBeenCalled();
    });
    expect(
      screen.getByAltText(getAvatarLabel(NAME)).getAttribute("src")
    ).toMatch(/thumb0.jpg/);

    //2nd upload and cancel
    userEvent.upload(screen.getByLabelText(SELECT_AN_IMAGE), MOCK_FILE);
    expect(await screen.findByLabelText(CANCEL_UPLOAD)).toBeVisible();
    userEvent.click(screen.getByLabelText(CANCEL_UPLOAD));
    expect(
      (await screen.findByAltText(getAvatarLabel(NAME))).getAttribute("src")
    ).toMatch(/thumb0.jpg/);

    //submit
    userEvent.click(screen.getByRole("button", { name: SUBMIT }));

    await waitFor(() => {
      expect(submitForm).toHaveBeenCalledWith({ avatarInput: "firstKey" });
    });
  });

  it("doesn't submit without confirming/cancelling", async () => {
    userEvent.upload(screen.getByLabelText(SELECT_AN_IMAGE), MOCK_FILE);

    expect(await screen.findByLabelText(CONFIRM_UPLOAD)).toBeVisible();

    userEvent.click(screen.getByRole("button", { name: SUBMIT }));

    expect(await screen.findByText(UPLOAD_PENDING_ERROR)).toBeVisible();
    expect(submitForm).not.toHaveBeenCalled();
  });

  it("displays an error for an invalid file", async () => {
    jest.spyOn(FileReader.prototype, "readAsDataURL").mockImplementation(() => {
      FileReader.prototype.dispatchEvent(new Event("error"));
    });
    userEvent.upload(
      screen.getByLabelText(SELECT_AN_IMAGE),
      new File([new Blob(undefined)], "")
    );
    expect(await screen.findByText(INVALID_FILE)).toBeVisible();
  });

  it("displays an error if the upload fails", async () => {
    uploadFileMock.mockRejectedValueOnce(new Error("Whoops"));
    jest.spyOn(console, "error").mockReturnValueOnce(undefined);
    userEvent.upload(
      screen.getByLabelText(SELECT_AN_IMAGE),
      new File([new Blob(undefined)], "")
    );
    expect(await screen.findByLabelText(CONFIRM_UPLOAD)).toBeVisible();
    userEvent.click(screen.getByLabelText(CONFIRM_UPLOAD));

    expect(await screen.findByText("Whoops")).toBeVisible();
  });

  //this test passes even when it fails in browser
  it.skip("previews the image after cancelling and selecting the same image", async () => {
    userEvent.upload(screen.getByLabelText(SELECT_AN_IMAGE), MOCK_FILE);
    expect(await screen.findByLabelText(CANCEL_UPLOAD)).toBeVisible();
    userEvent.click(screen.getByLabelText(CANCEL_UPLOAD));

    userEvent.upload(screen.getByLabelText(SELECT_AN_IMAGE), MOCK_FILE);

    expect(await screen.findByLabelText(CANCEL_UPLOAD)).toBeVisible();
    expect(
      screen.getByAltText(getAvatarLabel(NAME)).getAttribute("src")
    ).toMatch(/base64/);
  });
});
