import {
  UnauthenticatedCallback,
  createServiceClients,
} from "@couchers/services";

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
