import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import wrappers from "google-protobuf/google/protobuf/wrappers_pb";
import { authClient, client } from "../features/api";
import {
  GetUserReq,
  HostingStatus,
  PingReq,
  UpdateProfileReq,
  User,
} from "../pb/api_pb";
import {
  AuthReq,
  CompleteSignupReq,
  CompleteTokenLoginReq,
} from "../pb/auth_pb";

/**
 * Login user using password and returns session token
 *
 * @param {string} username
 * @param {string} password
 * @returns {Promise<string>}
 */
export const passwordLogin = async (
  username: string,
  password: string
): Promise<string> => {
  const req = new AuthReq();
  req.setUser(username);
  req.setPassword(password);

  const response = await authClient.authenticate(req);
  const token = response.getToken();

  return token;
};

/**
 * Login user using a login token and returns session token
 *
 * @param {string} token
 * @returns {Promise<string>}
 */
export const tokenLogin = async (loginToken: string): Promise<string> => {
  const req = new CompleteTokenLoginReq();
  req.setLoginToken(loginToken);

  const response = await authClient.completeTokenLogin(req);
  const token = response.getToken();

  return token;
};

/**
 * Returns User record of logged in user
 *
 * @returns {Promise<User.AsObject>}
 */
export const getCurrentUser = async (
  token?: string
): Promise<User.AsObject> => {
  const req = new PingReq();

  const response = await client.ping(
    req,
    token ? { authorization: `Bearer ${token}` } : undefined
  );

  return response.getUser()!.toObject();
};

/**
 * Returns User record by Username
 *
 * @param {string} username
 * @param {string} token
 * @returns {Promise<User.AsObject>}
 */
export const getUserByUsername = async (
  username: string,
  token?: string
): Promise<User.AsObject> => {
  const userReq = new GetUserReq();
  userReq.setUser(username || "");

  const response = await client.getUser(
    userReq,
    token ? { authorization: `Bearer ${token}` } : undefined
  );

  return response.toObject();
};

/**
 * Updates user
 *
 * @param {User.AsObject} user
 * @returns {Promise<Empty>}
 */
export const updateUser = async (user: User.AsObject): Promise<Empty> => {
  const req = new UpdateProfileReq();

  const nameWrapper = new wrappers.StringValue();
  const cityWrapper = new wrappers.StringValue();
  const genderWrapper = new wrappers.StringValue();

  nameWrapper.setValue(user.name);
  cityWrapper.setValue(user.city);
  genderWrapper.setValue(user.gender);

  req.setName(nameWrapper);
  req.setCity(cityWrapper);
  req.setGender(genderWrapper);

  return client.updateProfile(req);
};

export type SignupArguments = {
  signupToken: string;
  username: string;
  name: string;
  city: string;
  birthdate: Date;
  gender: string;
  hostingStatus: HostingStatus;
};

/**
 * Completes the signup process
 *
 * @param {SignupArguments} signup arguments
 * @returns {Promise<string>} session token
 */
export const completeSignup = async ({
  signupToken,
  username,
  name,
  city,
  birthdate,
  gender,
  hostingStatus,
}: SignupArguments) => {
  const req = new CompleteSignupReq();
  req.setSignupToken(signupToken);
  req.setUsername(username);
  req.setName(name);
  req.setCity(city);
  req.setBirthdate(birthdate.toISOString().split("T")[0]);
  req.setGender(gender);
  req.setHostingStatus(hostingStatus);

  const res = await authClient.completeSignup(req);
  return res.getToken();
};
