import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AvatarInput from "components/AvatarInput";
import {
  CANCEL_UPLOAD,
  CONFIRM_UPLOAD,
  getAvatarLabel,
  SELECT_AN_IMAGE,
  UPLOAD_PENDING_ERROR,
} from "components/constants";
import { SUBMIT } from "features/constants";
import { useForm } from "react-hook-form";
import { service } from "service/index";
import wrapper from "test/hookWrapper";
import { MockedService } from "test/utils";

const uploadFileMock = service.api.uploadFile as MockedService<
  typeof service.api.uploadFile
>;
const submitForm = jest.fn();

const MOCK_FILE = new File([], "example.jpg");
const MOCK_KEY = "key123";
const MOCK_INITIAL_SRC = "https://example.com/initialPreview.jpg";
const NAME = "Test User";

describe("AvatarInput component", () => {
  beforeEach(() => {
    uploadFileMock.mockResolvedValue({
      file: MOCK_FILE,
      filename: MOCK_FILE.name,
      key: MOCK_KEY,
      thumbnail_url: "thumb.jpg",
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

    await waitFor(() => {
      expect(screen.getByLabelText(CONFIRM_UPLOAD)).toBeVisible();
      expect(screen.getByLabelText(CANCEL_UPLOAD)).toBeVisible();
    });

    userEvent.click(screen.getByLabelText(CONFIRM_UPLOAD));

    await waitFor(() => {
      expect(uploadFileMock).toHaveBeenCalled();
    });

    userEvent.click(screen.getByRole("button", { name: SUBMIT }));

    await waitFor(() => {
      expect(submitForm).toHaveBeenCalledWith({ avatarInput: MOCK_KEY });
    });
  });

  it("cancels when cancel button pressed and doesn't submit key", async () => {
    userEvent.upload(screen.getByLabelText(SELECT_AN_IMAGE), MOCK_FILE);

    await waitFor(() => {
      expect(screen.getByLabelText(CONFIRM_UPLOAD)).toBeVisible();
      expect(screen.getByLabelText(CANCEL_UPLOAD)).toBeVisible();
    });

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

    userEvent.upload(screen.getByLabelText(SELECT_AN_IMAGE), OTHER_MOCK_FILE);

    await waitFor(() => {
      expect(screen.getByLabelText(CONFIRM_UPLOAD)).toBeVisible();
    });

    userEvent.click(screen.getByLabelText(CONFIRM_UPLOAD));

    await waitFor(() => {
      expect(uploadFileMock).toHaveBeenCalled();
    });

    expect(screen.getByAltText(getAvatarLabel(NAME))).not.toHaveProperty(
      "src",
      MOCK_INITIAL_SRC
    );

    userEvent.upload(screen.getByLabelText(SELECT_AN_IMAGE), MOCK_FILE);

    await waitFor(() => {
      expect(screen.getByLabelText(CONFIRM_UPLOAD)).toBeVisible();
    });

    userEvent.click(screen.getByLabelText(CONFIRM_UPLOAD));

    await waitFor(() => {
      expect(uploadFileMock).toHaveBeenCalledTimes(2);
    });

    expect(screen.getByAltText(getAvatarLabel(NAME))).not.toHaveProperty(
      "src",
      MOCK_INITIAL_SRC
    );

    userEvent.click(screen.getByRole("button", { name: SUBMIT }));

    await waitFor(() => {
      expect(submitForm).toHaveBeenCalledWith({ avatarInput: MOCK_KEY });
    });
  });

  it("doesn't submit without confirming/cancelling", async () => {
    userEvent.upload(screen.getByLabelText(SELECT_AN_IMAGE), MOCK_FILE);

    await waitFor(() => {
      expect(screen.getByLabelText(CONFIRM_UPLOAD)).toBeVisible();
    });

    userEvent.click(screen.getByRole("button", { name: SUBMIT }));

    await waitFor(() => {
      expect(screen.getByText(UPLOAD_PENDING_ERROR)).toBeVisible();
    });
    expect(submitForm).not.toHaveBeenCalled();
  });
});
