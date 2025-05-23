import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  COULDNT_READ_FILE,
  getAvatarLabel,
  SELECT_AN_IMAGE,
} from "components/constants";
import { StatusCode } from "grpc-web";
import { InitiateMediaUploadRes } from "proto/api_pb";
import { useForm } from "react-hook-form";
import { service } from "service";
import client from "service/client";
import {
  IMAGE_TOO_LARGE,
  INTERNAL_ERROR,
  SERVER_ERROR,
} from "service/constants";
import wrapper from "test/hookWrapper";
import i18n from "test/i18n";
import { server } from "test/restMock";
import { assertErrorAlert, mockConsoleError, MockedService } from "test/utils";

import ImageInput from "./ImageInput";

const { t } = i18n;

const uploadFileMock = service.api.uploadFile as MockedService<
  typeof service.api.uploadFile
>;
const submitForm = jest.fn();
const onSuccessMock = jest.fn(() => Promise.resolve());

const MOCK_FILE = new File([], "example.jpg");
const MOCK_KEY = "key123";
const MOCK_INITIAL_SRC = "https://example.com/initialPreview.jpg";
const MOCK_THUMB = "thumb.jpg";
const MOCK_FULL_IMAGE = "full.jpg";
const NAME = "Test User";

describe.each`
  type
  ${"avatar"}
  ${"rect"}
`("ImageInput component ($type)", ({ type }) => {
  beforeEach(() => {
    uploadFileMock.mockResolvedValue({
      file: MOCK_FILE,
      filename: MOCK_FILE.name,
      key: MOCK_KEY,
      thumbnail_url: MOCK_THUMB,
      full_url: MOCK_FULL_IMAGE,
    });
    const Form = () => {
      const {
        control,
        handleSubmit,
        formState: { errors },
      } = useForm<{ imageInput: File }>();
      const onSubmit = handleSubmit((data) => submitForm(data));
      return (
        <form onSubmit={onSubmit}>
          {errors.imageInput && <p>{errors.imageInput.message}</p>}
          {type === "avatar" ? (
            <ImageInput
              control={control}
              id="image-input"
              initialPreviewSrc={MOCK_INITIAL_SRC}
              name="imageInput"
              userName={NAME}
              type="avatar"
              onSuccess={onSuccessMock}
            />
          ) : (
            <ImageInput
              control={control}
              id="image-input"
              initialPreviewSrc={MOCK_INITIAL_SRC}
              name="imageInput"
              alt={getAvatarLabel(NAME)}
              type="rect"
              onSuccess={onSuccessMock}
            />
          )}
          <input type="submit" name={t("global:submit")} />
        </form>
      );
    };
    render(<Form />, { wrapper });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("displays initial preview", async () => {
    expect(screen.getByAltText(getAvatarLabel(NAME))).toBeVisible();
    expect(screen.getByAltText(getAvatarLabel(NAME))).toHaveProperty(
      "src",
      MOCK_INITIAL_SRC,
    );
  });

  it("uploads and submits key", async () => {
    const user = userEvent.setup({ applyAccept: false });
    await user.upload(
      screen.getByLabelText(SELECT_AN_IMAGE) as HTMLInputElement,
      MOCK_FILE,
    );

    await waitFor(() => {
      expect(uploadFileMock).toHaveBeenCalledTimes(1);
    });

    expect(onSuccessMock).toBeCalledWith({
      file: MOCK_FILE,
      filename: MOCK_FILE.name,
      key: MOCK_KEY,
      thumbnail_url: MOCK_THUMB,
      full_url: MOCK_FULL_IMAGE,
    });

    let expectedImage: string = MOCK_FULL_IMAGE;
    if (type === "avatar") {
      expectedImage = MOCK_THUMB;
    }

    await user.click(screen.getByRole("button", { name: t("global:submit") }));

    await waitFor(() => {
      expect(submitForm).toHaveBeenCalledWith({ imageInput: MOCK_KEY });
    });
    expect(
      screen.getByAltText(getAvatarLabel(NAME)).getAttribute("src"),
    ).toMatch(new RegExp(expectedImage));
  });

  it("displays an error when the passed onSuccess function rejects", async () => {
    mockConsoleError();
    onSuccessMock.mockRejectedValue({
      code: StatusCode.INVALID_ARGUMENT,
      message: "Invalid argument",
    });
    const user = userEvent.setup({ applyAccept: false });

    await user.upload(
      screen.getByLabelText(SELECT_AN_IMAGE) as HTMLInputElement,
      MOCK_FILE,
    );

    await waitFor(() => {
      expect(uploadFileMock).toHaveBeenCalledTimes(1);
    });
    await assertErrorAlert("Invalid argument");
  });

  it("displays an error for an invalid file", async () => {
    jest.spyOn(FileReader.prototype, "readAsDataURL").mockImplementation(() => {
      FileReader.prototype.dispatchEvent(new Event("error"));
    });

    const user = userEvent.setup({ applyAccept: false });

    await user.upload(
      screen.getByLabelText(SELECT_AN_IMAGE) as HTMLInputElement,
      new File([new Blob(undefined)], ""),
    );
    expect(
      await screen.findByText(new RegExp(COULDNT_READ_FILE)),
    ).toBeVisible();
  });

  it("displays an error if the upload fails", async () => {
    uploadFileMock.mockRejectedValueOnce(new Error("Whoops"));
    jest.spyOn(console, "error").mockReturnValueOnce(undefined);

    const user = userEvent.setup({ applyAccept: false });

    await user.upload(
      screen.getByLabelText(SELECT_AN_IMAGE) as HTMLInputElement,
      new File([new Blob(undefined)], ""),
    );

    expect(await screen.findByText("Whoops")).toBeVisible();
  });

  it("calls onUploading callback during image upload", async () => {
    const onUploadingMock = jest.fn();
    const Form = () => {
      const { control } = useForm();
      return (
        <form data-testid="test-form">
          <ImageInput
            control={control}
            id="image-input"
            initialPreviewSrc={MOCK_INITIAL_SRC}
            name="imageInput"
            userName={NAME}
            type="avatar"
            onUploading={onUploadingMock}
          />
        </form>
      );
    };
    render(<Form />, { wrapper });

    const user = userEvent.setup({ applyAccept: false });
    const form = screen.getByTestId("test-form");

    // Start upload
    await user.upload(
      within(form).getByLabelText(SELECT_AN_IMAGE) as HTMLInputElement,
      MOCK_FILE,
    );

    // Verify onUploading was called with true when upload started
    expect(onUploadingMock).toHaveBeenCalledWith(true);

    // Wait for upload to complete
    await waitFor(() => {
      expect(uploadFileMock).toHaveBeenCalled();
    });

    // Verify onUploading was called with false when upload completed
    expect(onUploadingMock).toHaveBeenCalledWith(false);
  });
});

describe("ImageInput http error tests", () => {
  beforeAll(() => {
    server.listen();
  });
  beforeEach(() => {
    const View = () => {
      const { control } = useForm();
      return (
        <ImageInput
          control={control}
          id="image-input"
          initialPreviewSrc={MOCK_INITIAL_SRC}
          name="imageInput"
          userName={NAME}
          type="avatar"
        />
      );
    };
    render(<View />, { wrapper });
    const uploadFile = jest.requireActual("service").service.api.uploadFile;
    uploadFileMock.mockImplementation(uploadFile);
    const initiateMediaUploadMock = jest.spyOn(
      client.api,
      "initiateMediaUpload",
    );
    initiateMediaUploadMock.mockResolvedValue({
      getUploadUrl: () => "https://example.com/upload",
    } as InitiateMediaUploadRes);
    mockConsoleError();
  });
  afterEach(() => {
    server.resetHandlers();
  });
  afterAll(() => {
    server.close();
  });

  it("displays the right error if the file is too large", async () => {
    jest.spyOn(global, "fetch").mockImplementation(
      async () =>
        new Response(JSON.stringify({ error: "Payload Too Large" }), {
          status: 413,
          statusText: "Payload Too Large",
          headers: { "Content-Type": "application/json" },
        }),
    );
    const user = userEvent.setup({ applyAccept: false });

    await user.upload(
      screen.getByLabelText(SELECT_AN_IMAGE) as HTMLInputElement,
      MOCK_FILE,
    );

    await assertErrorAlert(IMAGE_TOO_LARGE);
  });

  it("displays a general error for server errors", async () => {
    jest.spyOn(global, "fetch").mockImplementation(
      async () =>
        new Response(JSON.stringify({ error: "Internal server error" }), {
          status: 500,
          statusText: "Internal server error",
          headers: { "Content-Type": "application/json" },
        }),
    );

    const user = userEvent.setup({ applyAccept: false });

    await user.upload(
      screen.getByLabelText(SELECT_AN_IMAGE) as HTMLInputElement,
      MOCK_FILE,
    );

    await assertErrorAlert(SERVER_ERROR);
  });

  it("displays an internal error for bad json", async () => {
    jest.spyOn(global, "fetch").mockImplementationOnce(() => {
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        // Simulate a response where .json() will fail
        json: async () => {
          throw new SyntaxError("Unexpected token < in JSON at position 0");
        },
      }) as unknown as Promise<Response>;
    });

    const user = userEvent.setup({ applyAccept: false });

    await user.upload(
      screen.getByLabelText(SELECT_AN_IMAGE) as HTMLInputElement,
      MOCK_FILE,
    );

    await assertErrorAlert(INTERNAL_ERROR);
  });
});
