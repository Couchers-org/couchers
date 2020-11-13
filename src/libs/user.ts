import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import wrappers from "google-protobuf/google/protobuf/wrappers_pb";
import { authClient, client } from "../features/api";
import {
  GetUserReq,
  PingReq,
  UpdateProfileReq,
  User,
  NullableStringValue,
  RepeatedStringValue,
} from "../pb/api_pb";
import { AuthReq, CompleteTokenLoginReq } from "../pb/auth_pb";
import { ProfileFormData } from "../features/profile";

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
 * @param {User.AsObject} reqObject
 * @returns {Promise<Empty>}
 */
export const updateProfile = async (
  reqObject: ProfileFormData
): Promise<Empty> => {
  const req = new UpdateProfileReq();

  const name = new wrappers.StringValue().setValue(reqObject.name);
  const city = new wrappers.StringValue().setValue(reqObject.city);
  const gender = new wrappers.StringValue().setValue(reqObject.gender);
  const occupation = new NullableStringValue().setValue(reqObject.occupation);
  const languages = new RepeatedStringValue()
    .setValueList(reqObject.languages)
    .setExists(!!reqObject.languages);
  const aboutMe = new NullableStringValue().setValue(reqObject.aboutMe);
  const aboutPlace = new NullableStringValue().setValue(reqObject.aboutPlace);
  const countriesVisited = new RepeatedStringValue()
    .setValueList(reqObject.countriesVisited)
    .setExists(!!reqObject.countriesVisited);
  const countriesLived = new RepeatedStringValue()
    .setValueList(reqObject.countriesLived)
    .setExists(!!reqObject.countriesLived);

  req
    .setName(name)
    .setCity(city)
    .setGender(gender)
    .setOccupation(occupation)
    .setLanguages(languages)
    .setAboutMe(aboutMe)
    .setAboutPlace(aboutPlace)
    .setCountriesVisited(countriesVisited)
    .setCountriesLived(countriesLived);

  return client.updateProfile(req);
};
