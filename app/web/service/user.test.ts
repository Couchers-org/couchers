import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import client from "service/client";
import { updateHostingPreference, updateProfile } from "service/user";
import user from "test/fixtures/defaultUser.json";

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
    aboutMe: user.aboutMe,
    additionalInformation: user.additionalInformation,
    city: user.city,
    education: user.education,
    hometown: user.hometown,
    hostingStatus: user.hostingStatus,
    lat: user.lat,
    lng: user.lng,
    meetupStatus: user.meetupStatus,
    myTravels: user.myTravels,
    name: user.name,
    occupation: user.occupation,
    pronouns: user.pronouns,
    radius: user.radius,
    thingsILike: user.thingsILike,
    avatarKey: "",
  };

  it("updates the profile correctly when repeated value fields are empty", async () => {
    await updateProfile({
      ...nonEmptyUserValues,
      regionsLived: [],
      regionsVisited: [],
      languageAbilities: {
        valueList: [],
      },
    });
    expect(updateProfileMock).toHaveBeenCalledTimes(1);
    const callArg = updateProfileMock.mock.calls[0][0];
    expect(callArg.toObject()).toMatchObject({
      aboutMe: {
        isNull: false,
        value: nonEmptyUserValues.aboutMe,
      },
      city: {
        value: nonEmptyUserValues.city,
      },
      regionsLived: {
        valueList: [],
      },
      regionsVisited: {
        valueList: [],
      },
      languageAbilities: {
        valueList: [],
      },
      name: {
        value: nonEmptyUserValues.name,
      },
      occupation: {
        isNull: false,
        value: nonEmptyUserValues.occupation,
      },
    });
  });

  it("updates the profile correctly when repeated value fields exist", async () => {
    const { regionsLivedList, regionsVisitedList, languageAbilitiesList } =
      user;
    await updateProfile({
      ...nonEmptyUserValues,
      regionsLived: regionsLivedList,
      regionsVisited: regionsVisitedList,
      languageAbilities: {
        valueList: languageAbilitiesList,
      },
    });
    expect(updateProfileMock).toHaveBeenCalledTimes(1);
    const callArg = updateProfileMock.mock.calls[0][0];
    expect(callArg.toObject()).toMatchObject({
      regionsLived: {
        valueList: regionsLivedList,
      },
      regionsVisited: {
        valueList: regionsVisitedList,
      },
      languageAbilities: {
        valueList: languageAbilitiesList,
      },
    });
  });
});

describe("updateHostingPreference", () => {
  const nonClearablePreference = {
    aboutPlace: user.aboutPlace,
    acceptsKids: false,
    acceptsPets: false,
    area: "It's a nice area",
    avatarKey: "",
    campingOk: true,
    drinkingAllowed: true,
    drinksAtHome: false,
    hasHousemates: false,
    hasKids: false,
    hasPets: true,
    housemateDetails: "",
    houseRules: "I got a couch for ya in the living room",
    kidDetails: "",
    lastMinute: true,
    otherHostInfo: "",
    parking: true,
    parkingDetails: 1,
    petDetails: "1 bunny",
    sleepingArrangement: 1,
    sleepingDetails: "",
    smokesAtHome: false,
    smokingAllowed: 2,
    wheelchairAccessible: true,
  };

  it("updates preference correctly when max guests has been cleared", async () => {
    await updateHostingPreference({
      ...nonClearablePreference,
      maxGuests: null,
    });

    expect(updateProfileMock).toHaveBeenCalledTimes(1);
    const callArg = updateProfileMock.mock.calls[0][0];
    expect(callArg.toObject()).toMatchObject({
      aboutPlace: {
        isNull: false,
        value: nonClearablePreference.aboutPlace,
      },
      acceptsKids: {
        isNull: false,
        value: nonClearablePreference.acceptsKids,
      },
      acceptsPets: {
        isNull: false,
        value: nonClearablePreference.acceptsPets,
      },
      area: {
        isNull: false,
        value: nonClearablePreference.area,
      },
      houseRules: {
        isNull: false,
        value: nonClearablePreference.houseRules,
      },
      lastMinute: {
        isNull: false,
        value: nonClearablePreference.lastMinute,
      },
      maxGuests: {
        isNull: true,
      },
      sleepingArrangement: 1,
      smokingAllowed: nonClearablePreference.smokingAllowed,
      wheelchairAccessible: {
        isNull: false,
        value: nonClearablePreference.wheelchairAccessible,
      },
    });
  });

  it("updates preference correctly when max guests is provided", async () => {
    await updateHostingPreference({ ...nonClearablePreference, maxGuests: 3 });
    expect(updateProfileMock).toHaveBeenCalledTimes(1);
    const callArg = updateProfileMock.mock.calls[0][0];
    expect(callArg.toObject()).toMatchObject({
      maxGuests: {
        isNull: false,
        value: 3,
      },
    });
  });
});
