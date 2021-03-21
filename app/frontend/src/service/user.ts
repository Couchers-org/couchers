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
  ReportReq,
  UpdateProfileReq,
  User,
} from "pb/api_pb";
import { AuthReq, CompleteSignupReq, CompleteTokenLoginReq } from "pb/auth_pb";
import client from "service/client";
import { ProtoToJsTypes } from "utils/types";

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
  | "hometown"
  | "lat"
  | "lng"
  | "radius"
  | "pronouns"
  | "occupation"
  | "education"
  | "aboutMe"
  | "myTravels"
  | "thingsILike"
  | "aboutPlace"
  | "hostingStatus"
  | "meetupStatus"
  | "languages"
  | "countriesVisited"
  | "countriesLived"
  | "additionalInformation"
>;

export type HostingPreferenceData = Omit<
  ProfileFormData,
  keyof UpdateUserProfileData | "gender"
>;

export type SignupArguments = {
  signupToken: string;
  username: string;
  name: string;
  city: string;
  location: {
    lat: number;
    lng: number;
    radius: number;
  };
  birthdate: string;
  gender: string;
  hostingStatus: HostingStatus;
  acceptTOS: boolean;
};

/**
 * Login user using password
 */
export async function passwordLogin(username: string, password: string) {
  const req = new AuthReq();
  req.setUser(username);
  req.setPassword(password);

  const response = await client.auth.authenticate(req);
  const jailed = response.getJailed();

  return { jailed };
}

/**
 * Login user using a login token
 */
export async function tokenLogin(loginToken: string) {
  const req = new CompleteTokenLoginReq();
  req.setLoginToken(loginToken);

  const response = await client.auth.completeTokenLogin(req);
  const jailed = response.getJailed();

  return { jailed };
}

/**
 * Returns User record of logged in user
 *
 * @returns {Promise<User.AsObject>}
 */
export async function getCurrentUser(): Promise<User.AsObject> {
  const req = new PingReq();

  const response = await client.api.ping(req);

  return response.getUser()!.toObject();
}

/**
 * Returns User record by Username or id
 *
 * @param {string} user
 * @returns {Promise<User.AsObject>}
 */
export async function getUser(user: string): Promise<User.AsObject> {
  const userReq = new GetUserReq();
  userReq.setUser(user || "");

  const response = await client.api.getUser(userReq);

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
  const hometown = new NullableStringValue().setValue(profile.hometown);
  const lat = new wrappers.DoubleValue().setValue(profile.lat);
  const lng = new wrappers.DoubleValue().setValue(profile.lng);
  const radius = new wrappers.DoubleValue().setValue(profile.radius);
  const pronouns = new NullableStringValue().setValue(profile.pronouns);
  const occupation = new NullableStringValue().setValue(profile.occupation);
  const education = new NullableStringValue().setValue(profile.education);
  const aboutMe = new NullableStringValue().setValue(profile.aboutMe);
  const myTravels = new NullableStringValue().setValue(profile.myTravels);
  const thingsILike = new NullableStringValue().setValue(profile.thingsILike);
  const aboutPlace = new NullableStringValue().setValue(profile.aboutPlace);
  const hostingStatus = profile.hostingStatus;
  const meetupStatus = profile.meetupStatus;
  const languages = new RepeatedStringValue()
    .setValueList(profile.languages)
    .setExists(!!profile.languages);
  const countriesVisited = new RepeatedStringValue()
    .setValueList(profile.countriesVisited)
    .setExists(!!profile.countriesVisited);
  const countriesLived = new RepeatedStringValue()
    .setValueList(profile.countriesLived)
    .setExists(!!profile.countriesLived);
  const additionalInformation = new NullableStringValue().setValue(
    profile.additionalInformation
  );

  req
    .setName(name)
    .setCity(city)
    .setHometown(hometown)
    .setLat(lat)
    .setLng(lng)
    .setRadius(radius)
    .setPronouns(pronouns)
    .setOccupation(occupation)
    .setEducation(education)
    .setAboutMe(aboutMe)
    .setMyTravels(myTravels)
    .setThingsILike(thingsILike)
    .setAboutPlace(aboutPlace)
    .setHostingStatus(hostingStatus)
    .setMeetupStatus(meetupStatus)
    .setLanguages(languages)
    .setCountriesVisited(countriesVisited)
    .setCountriesLived(countriesLived)
    .setAdditionalInformation(additionalInformation);

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
  const lastMinute = new NullableBoolValue()
    .setValue(preferences.lastMinute)
    .setIsNull(false);
  const hasPets = new NullableBoolValue()
    .setValue(preferences.hasPets)
    .setIsNull(false);
  const acceptsPets = new NullableBoolValue()
    .setValue(preferences.acceptsPets)
    .setIsNull(false);
  const petDetails = new NullableStringValue().setValue(preferences.petDetails);
  const hasKids = new NullableBoolValue()
    .setValue(preferences.hasKids)
    .setIsNull(false);
  const acceptsKids = new NullableBoolValue()
    .setValue(preferences.acceptsKids)
    .setIsNull(false);
  const kidDetails = new NullableStringValue().setValue(preferences.kidDetails);
  const hasHousemates = new NullableBoolValue()
    .setValue(preferences.hasHousemates)
    .setIsNull(false);
  const housemateDetails = new NullableStringValue().setValue(
    preferences.housemateDetails
  );
  const wheelchairAccessible = new NullableBoolValue()
    .setValue(preferences.wheelchairAccessible)
    .setIsNull(false);
  const smokingAllowed = preferences.smokingAllowed;
  const smokesAtHome = new NullableBoolValue()
    .setValue(preferences.smokesAtHome)
    .setIsNull(false);
  const drinkingAllowed = new NullableBoolValue()
    .setValue(preferences.drinkingAllowed)
    .setIsNull(false);
  const drinksAtHome = new NullableBoolValue()
    .setValue(preferences.drinksAtHome)
    .setIsNull(false);
  const otherHostInfo = new NullableStringValue().setValue(
    preferences.otherHostInfo
  );
  const sleepingArrangement = preferences.sleepingArrangement;
  const sleepingDetails = new NullableStringValue().setValue(
    preferences.sleepingDetails
  );
  const area = new NullableStringValue().setValue(preferences.area);
  const houseRules = new NullableStringValue().setValue(preferences.houseRules);
  const parking = new NullableBoolValue()
    .setValue(preferences.parking)
    .setIsNull(false);
  const parkingDetails = preferences.parkingDetails;
  const campingOk = new NullableBoolValue()
    .setValue(preferences.campingOk)
    .setIsNull(false);

  req
    .setMaxGuests(maxGuests)
    .setLastMinute(lastMinute)
    .setHasPets(hasPets)
    .setAcceptsPets(acceptsPets)
    .setPetDetails(petDetails)
    .setHasKids(hasKids)
    .setAcceptsKids(acceptsKids)
    .setKidDetails(kidDetails)
    .setHasHousemates(hasHousemates)
    .setHousemateDetails(housemateDetails)
    .setWheelchairAccessible(wheelchairAccessible)
    .setSmokingAllowed(smokingAllowed)
    .setSmokesAtHome(smokesAtHome)
    .setDrinkingAllowed(drinkingAllowed)
    .setDrinksAtHome(drinksAtHome)
    .setOtherHostInfo(otherHostInfo)
    .setSleepingArrangement(sleepingArrangement)
    .setSleepingDetails(sleepingDetails)
    .setArea(area)
    .setHouseRules(houseRules)
    .setParking(parking)
    .setParkingDetails(parkingDetails)
    .setCampingOk(campingOk);

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
  location,
  birthdate,
  gender,
  hostingStatus,
  acceptTOS,
}: SignupArguments) {
  const req = new CompleteSignupReq();
  req.setSignupToken(signupToken);
  req.setUsername(username);
  req.setName(name);
  req.setBirthdate(birthdate);
  req.setGender(gender);
  req.setHostingStatus(hostingStatus);
  req.setCity(city);
  req.setLat(location.lat);
  req.setLng(location.lng);
  req.setRadius(location.radius);
  req.setAcceptTos(acceptTOS);

  const res = await client.auth.completeSignup(req);
  const jailed = res.getJailed();
  return { jailed };
}

/**
 * Logout user
 */
export function logout() {
  return client.auth.deauthenticate(new Empty());
}

export interface ReportUserInput {
  description: string;
  reason: string;
  userId: number;
}

export function reportUser({ description, reason, userId }: ReportUserInput) {
  const req = new ReportReq();
  req.setDescription(description);
  req.setReason(reason);
  req.setReportedUserId(userId);

  return client.api.report(req);
}
