import {
  FETCH_FAILED,
  IMAGE_TOO_LARGE,
  INTERNAL_ERROR,
  SERVER_ERROR,
  UnauthenticatedCallback,
  createServiceClients,
} from "@couchers/services";

import log from "./log";

// TODO(FB) Consider moving to env/config variable
const grpcTimeout = 10000;

let unauthenticatedCallback: UnauthenticatedCallback | undefined;

export const setUnauthenticatedCallback = (
  callback: UnauthenticatedCallback,
) => {
  unauthenticatedCallback = callback;
};

const serviceClients = createServiceClients(
  Config.apiBaseUrl,
  (isJailed) => {
    unauthenticatedCallback?.(isJailed);
  },
  grpcTimeout,
);

export default serviceClients;

// TODO(FB) Move everything below to sensible place
/* eslint-disable @typescript-eslint/naming-convention */
export interface ImageInputValues {
  file: File;
  filename: string;
  key: string;
  thumbnail_url: string;
  full_url: string;
}
/* eslint-enable @typescript-eslint/naming-convention */
// Helpers
export const uploadFile = async (file: File): Promise<ImageInputValues> => {
  const urlResponse = await serviceClients.api.initiateMediaUpload({});
  const uploadURL = urlResponse.uploadUrl;

  const requestBody = new FormData();
  requestBody.append("file", file);

  const uploadResponse = await fetch(uploadURL, {
    method: "POST",
    body: requestBody,
  }).catch((e: unknown) => {
    log.error(e);
    throw new Error(FETCH_FAILED);
  });

  if (uploadResponse.status === 413) {
    throw new Error(IMAGE_TOO_LARGE);
  } else if (!uploadResponse.ok) {
    throw new Error(`${SERVER_ERROR}: ${uploadResponse.statusText}`);
  }

  try {
    const responseJson = (await uploadResponse.json()) as ImageInputValues;

    return {
      ...responseJson,
      file,
    };
  } catch (e) {
    log.error(e);
    if (e instanceof Error) {
      throw new Error(`${INTERNAL_ERROR}: ${e.message}`);
    }
    throw new Error(`${INTERNAL_ERROR}: Unknown error`);
  }
};
