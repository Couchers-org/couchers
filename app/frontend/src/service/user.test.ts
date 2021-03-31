import { Empty } from "google-protobuf/google/protobuf/empty_pb";

import user from "../test/fixtures/defaultUser.json";
import client from "./client";
import { updateHostingPreference, updateProfile } from "./user";

jest.mock("./client");

const updateProfileMock = client.api.updateProfile as jest.Mock<
  ReturnType<typeof client.api.updateProfile>,
  Parameters<typeof client.api.updateProfile>
>;

beforeEach(() => {
  updateProfileMock.mockResolvedValue(new Empty());
});

describe("updateProfile", () => {
  const nonEmptyUserValues = {
    name: user.name,
    city: user.city,
    hometown: user.hometown,
    lat: user.lat,
    lng: user.lng,
    radius: user.radius,
    gender: user.gender,
    pronouns: user.pronouns,
    occupation: user.occupation,
    education: user.education,
    aboutMe: user.aboutMe,
    thingsILike: user.thinksILike,
    myTravels: user.myTravels,
    aboutPlace: user.aboutPlace,
    additionalInformation: user.additionalInformation,
    hostingStatus: user.hostingStatus,
    meetupStatus: user.meetupStatus,
  };
  it("updates the profile correctly when repeated value fields are empty", async () => {
    await updateProfile({
      ...nonEmptyUserValues,
      languages: [],
      regionsLived: [],
      regionsVisited: [],
    });

    expect(updateProfileMock).toHaveBeenCalledTimes(1);
    const callArg = updateProfileMock.mock.calls[0][0];
    expect(callArg.toObject()).toMatchObject({
      name: { value: nonEmptyUserValues.name },
      city: { value: nonEmptyUserValues.city },
      gender: { value: nonEmptyUserValues.gender },
      occupation: { isNull: false, value: nonEmptyUserValues.occupation },
      languages: { exists: true, valueList: [] },
      aboutMe: { isNull: false, value: nonEmptyUserValues.aboutMe },
      aboutPlace: { isNull: false, value: nonEmptyUserValues.aboutPlace },
      regionsVisited: { exists: true, valueList: [] },
      regionsLived: { exists: true, valueList: [] },
    });
  });

  it("updates the profile correctly when repeated value fields exist", async () => {
    const {
      languagesList: languages,
      regionsLivedList: regionsLived,
      regionsVisitedList: regionsVisited,
    } = user;
    await updateProfile({
      ...nonEmptyUserValues,
      languages,
      regionsLived,
      regionsVisited,
    });

    expect(updateProfileMock).toHaveBeenCalledTimes(1);
    const callArg = updateProfileMock.mock.calls[0][0];
    expect(callArg.toObject()).toMatchObject({
      languages: { exists: true, valueList: languages },
      regionsVisited: { exists: true, valueList: regionsVisited },
      regionsLived: { exists: true, valueList: regionsLived },
    });
  });
});

describe("updateHostingPreference", () => {
  const nonClearablePreference = {
    area: "It's a nice area",
    houseRules: "I got a couch for ya in the living room",
    acceptsKids: false,
    hasKids: false,
    kidDetails: "",
    acceptsPets: false,
    hasPets: true,
    petDetails: "1 bunny",
    hasHousemates: false,
    housemateDetails: "",
    lastMinute: true,
    wheelchairAccessible: true,
    smokingAllowed: 2,
    smokesAtHome: false,
    drinkingAllowed: true,
    drinksAtHome: false,
    sleepingArrangement: 1,
    sleepingDetails: "",
    parking: true,
    parkingDetails: 1,
    campingOk: true,
    otherHostInfo: "",
  };

  it("updates preference correctly when max guests has been cleared", async () => {
    await updateHostingPreference({
      ...nonClearablePreference,
      maxGuests: null,
    });

    expect(updateProfileMock).toHaveBeenCalledTimes(1);
    const callArg = updateProfileMock.mock.calls[0][0];
    expect(callArg.toObject()).toMatchObject({
      maxGuests: { isNull: true },
      area: { isNull: false, value: nonClearablePreference.area },
      houseRules: { isNull: false, value: nonClearablePreference.houseRules },
      acceptsKids: { isNull: false, value: nonClearablePreference.acceptsKids },
      acceptsPets: { isNull: false, value: nonClearablePreference.acceptsPets },
      lastMinute: { isNull: false, value: nonClearablePreference.lastMinute },
      wheelchairAccessible: {
        isNull: false,
        value: nonClearablePreference.wheelchairAccessible,
      },
      smokingAllowed: nonClearablePreference.smokingAllowed,
      sleepingArrangement: 1,
    });
  });

  it("updates preference correctly when max guests is provided", async () => {
    await updateHostingPreference({
      ...nonClearablePreference,
      maxGuests: 3,
    });

    expect(updateProfileMock).toHaveBeenCalledTimes(1);
    const callArg = updateProfileMock.mock.calls[0][0];
    expect(callArg.toObject()).toMatchObject({
      maxGuests: { isNull: false, value: 3 },
    });
  });
});
