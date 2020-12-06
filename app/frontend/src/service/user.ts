import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import wrappers from "google-protobuf/google/protobuf/wrappers_pb";
import {
  GetUserReq,
  HostingStatus,
  NullableBoolValue,
  NullableStringValue,
  NullableUInt32Value,
  PingReq,
  RepeatedStringValue,
  UpdateProfileReq,
  User,
} from "../pb/api_pb";
import {
  AuthReq,
  CompleteSignupReq,
  CompleteTokenLoginReq,
  DeAuthReq,
} from "../pb/auth_pb";
import { ProtoToJsTypes } from "../utils/types";
import client from "./client";

type RequiredUpdateProfileReq = Required<UpdateProfileReq.AsObject>;
type ProfileFormData = {
  [K in keyof RequiredUpdateProfileReq]: ProtoToJsTypes<
    RequiredUpdateProfileReq[K]
  >;
};

export type UpdateUserProfileData = Pick<
  ProfileFormData,
  | "name"
  | "city"
  | "gender"
  | "occupation"
  | "languages"
  | "aboutMe"
  | "aboutPlace"
  | "countriesVisited"
  | "countriesLived"
>;

export type HostingPreferenceData = Omit<
  ProfileFormData,
  keyof UpdateUserProfileData | "color" | "hostingStatus"
>;

export type SignupArguments = {
  signupToken: string;
  username: string;
  name: string;
  city: string;
  birthdate: string;
  gender: string;
  hostingStatus: HostingStatus;
};

/**
 * Login user using password and returns session token
 */
export async function passwordLogin(username: string, password: string) {
  const req = new AuthReq();
  req.setUser(username);
  req.setPassword(password);

  const response = await client.auth.authenticate(req);
  const token = response.getToken();
  const jailed = response.getJailed();

  return { token, jailed };
}

/**
 * Login user using a login token and returns session token
 */
export async function tokenLogin(loginToken: string) {
  const req = new CompleteTokenLoginReq();
  req.setLoginToken(loginToken);

  const response = await client.auth.completeTokenLogin(req);
  const token = response.getToken();
  const jailed = response.getJailed();

  return { token, jailed };
}

/**
 * Returns User record of logged in user
 *
 * @returns {Promise<User.AsObject>}
 */
export async function getCurrentUser(token?: string): Promise<User.AsObject> {
  const req = new PingReq();

  const response = await client.api.ping(
    req,
    token ? { authorization: `Bearer ${token}` } : undefined
  );

  return response.getUser()!.toObject();
}

/**
 * Returns User record by Username or id
 *
 * @param {string} user
 * @param {string} token
 * @returns {Promise<User.AsObject>}
 */
export async function getUser(
  user: string,
  token?: string
): Promise<User.AsObject> {
  const userReq = new GetUserReq();
  userReq.setUser(user || "");

  const response = await client.api.getUser(
    userReq,
    token ? { authorization: `Bearer ${token}` } : undefined
  );

  return response.toObject();
}

/**
 * Updates user profile
 */
export async function updateProfile(
  profile: UpdateUserProfileData
): Promise<Empty> {
  const req = new UpdateProfileReq();

  const name = new wrappers.StringValue().setValue(profile.name);
  const city = new wrappers.StringValue().setValue(profile.city);
  const gender = new wrappers.StringValue().setValue(profile.gender);
  const occupation = new NullableStringValue().setValue(profile.occupation);
  const languages = new RepeatedStringValue()
    .setValueList(profile.languages)
    .setExists(!!profile.languages);
  const aboutMe = new NullableStringValue().setValue(profile.aboutMe);
  const aboutPlace = new NullableStringValue().setValue(profile.aboutPlace);
  const countriesVisited = new RepeatedStringValue()
    .setValueList(profile.countriesVisited)
    .setExists(!!profile.countriesVisited);
  const countriesLived = new RepeatedStringValue()
    .setValueList(profile.countriesLived)
    .setExists(!!profile.countriesLived);

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

  return client.api.updateProfile(req);
}

export function updateHostingPreference(preferences: HostingPreferenceData) {
  const req = new UpdateProfileReq();

  const maxGuests =
    preferences.maxGuests !== null
      ? new NullableUInt32Value()
          .setValue(preferences.maxGuests)
          .setIsNull(false)
      : new NullableUInt32Value().setIsNull(true);
  const area = new NullableStringValue().setValue(preferences.area);
  const houseRules = new NullableStringValue().setValue(preferences.houseRules);
  const multipleGroups = new NullableBoolValue()
    .setValue(preferences.multipleGroups)
    .setIsNull(false);
  const acceptsKids = new NullableBoolValue()
    .setValue(preferences.acceptsKids)
    .setIsNull(false);
  const acceptsPets = new NullableBoolValue()
    .setValue(preferences.acceptsPets)
    .setIsNull(false);
  const lastMinute = new NullableBoolValue()
    .setValue(preferences.lastMinute)
    .setIsNull(false);
  const wheelchairAccessible = new NullableBoolValue()
    .setValue(preferences.wheelchairAccessible)
    .setIsNull(false);
  const smokingAllowed = preferences.smokingAllowed;
  const sleepingArrangement = new NullableStringValue().setValue(
    preferences.sleepingArrangement
  );

  req
    .setMaxGuests(maxGuests)
    .setArea(area)
    .setHouseRules(houseRules)
    .setMultipleGroups(multipleGroups)
    .setAcceptsKids(acceptsKids)
    .setAcceptsPets(acceptsPets)
    .setLastMinute(lastMinute)
    .setWheelchairAccessible(wheelchairAccessible)
    .setSmokingAllowed(smokingAllowed)
    .setSleepingArrangement(sleepingArrangement);

  return client.api.updateProfile(req);
}

/**
 * Completes the signup process
 */
export async function completeSignup({
  signupToken,
  username,
  name,
  city,
  birthdate,
  gender,
  hostingStatus,
}: SignupArguments) {
  const req = new CompleteSignupReq();
  req.setSignupToken(signupToken);
  req.setUsername(username);
  req.setName(name);
  req.setCity(city);
  req.setBirthdate(birthdate);
  req.setGender(gender);
  req.setHostingStatus(hostingStatus);

  const res = await client.auth.completeSignup(req);
  const sessionToken = res.getToken();
  const jailed = res.getJailed();
  return { token: sessionToken, jailed };
}

/**
 * Logout user using a session token
 */
export async function logout(sessionToken: string) {
  const req = new DeAuthReq();
  req.setToken(sessionToken);

  await client.auth.deauthenticate(req);
}
