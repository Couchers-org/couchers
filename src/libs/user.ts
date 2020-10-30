import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import wrappers from "google-protobuf/google/protobuf/wrappers_pb";
import { authClient, client } from "../features/api";
import { GetUserReq, UpdateProfileReq, User } from "../pb/api_pb";
import { AuthReq } from "../pb/auth_pb";

/**
 * Login user and returns token
 *
 * @param {string} username
 * @param {string} password
 * @returns {Promise<string>}
 */
export const login = async (
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
 * Returns User record by Username
 *
 * @param {string} username
 * @returns {Promise<User.AsObject>}
 */
export const getUserByUsername = async (
  username: string, token?: string
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
