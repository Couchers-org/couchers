var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import wrappers from "google-protobuf/google/protobuf/wrappers_pb";
import { GetUserReq, LanguageAbility, NullableBoolValue, NullableStringValue, NullableUInt32Value, PingReq, RepeatedLanguageAbilityValue, RepeatedStringValue, UpdateProfileReq, } from "proto/api_pb";
import { AuthReq, CompleteTokenLoginReq } from "proto/auth_pb";
import client from "service/client";
/**
 * Login user using password
 */
export function passwordLogin(username, password) {
    return __awaiter(this, void 0, void 0, function () {
        var req, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new AuthReq();
                    req.setUser(username);
                    req.setPassword(password);
                    return [4 /*yield*/, client.auth.authenticate(req)];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, res.toObject()];
            }
        });
    });
}
/**
 * Login user using a login token
 */
export function tokenLogin(loginToken) {
    return __awaiter(this, void 0, void 0, function () {
        var req, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new CompleteTokenLoginReq();
                    req.setLoginToken(loginToken);
                    return [4 /*yield*/, client.auth.completeTokenLogin(req)];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, res.toObject()];
            }
        });
    });
}
/**
 * Returns User record of logged in user
 *
 * @returns {Promise<User.AsObject>}
 */
export function getCurrentUser() {
    return __awaiter(this, void 0, void 0, function () {
        var req, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new PingReq();
                    return [4 /*yield*/, client.api.ping(req)];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.getUser().toObject()];
            }
        });
    });
}
/**
 * Returns User record by Username or id
 *
 * @param {string} user
 * @returns {Promise<User.AsObject>}
 */
export function getUser(user) {
    return __awaiter(this, void 0, void 0, function () {
        var userReq, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    userReq = new GetUserReq();
                    userReq.setUser(user || "");
                    return [4 /*yield*/, client.api.getUser(userReq)];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.toObject()];
            }
        });
    });
}
/**
 * Updates user profile
 */
export function updateProfile(profile) {
    return __awaiter(this, void 0, void 0, function () {
        var req, avatarKey, name, city, hometown, lat, lng, radius, pronouns, occupation, education, aboutMe, myTravels, thingsILike, hostingStatus, meetupStatus, regionsVisited, regionsLived, additionalInformation, languageAbilities;
        return __generator(this, function (_a) {
            req = new UpdateProfileReq();
            avatarKey = profile.avatarKey
                ? new NullableStringValue().setValue(profile.avatarKey)
                : undefined;
            name = new wrappers.StringValue().setValue(profile.name);
            city = new wrappers.StringValue().setValue(profile.city);
            hometown = new NullableStringValue().setValue(profile.hometown);
            lat = new wrappers.DoubleValue().setValue(profile.lat);
            lng = new wrappers.DoubleValue().setValue(profile.lng);
            radius = new wrappers.DoubleValue().setValue(profile.radius);
            pronouns = new NullableStringValue().setValue(profile.pronouns);
            occupation = new NullableStringValue().setValue(profile.occupation);
            education = new NullableStringValue().setValue(profile.education);
            aboutMe = new NullableStringValue().setValue(profile.aboutMe);
            myTravels = new NullableStringValue().setValue(profile.myTravels);
            thingsILike = new NullableStringValue().setValue(profile.thingsILike);
            hostingStatus = profile.hostingStatus;
            meetupStatus = profile.meetupStatus;
            regionsVisited = new RepeatedStringValue().setValueList(profile.regionsVisited);
            regionsLived = new RepeatedStringValue().setValueList(profile.regionsLived);
            additionalInformation = new NullableStringValue().setValue(profile.additionalInformation);
            languageAbilities = new RepeatedLanguageAbilityValue().setValueList(profile.languageAbilities.valueList.map(function (languageAbility) {
                return new LanguageAbility()
                    .setCode(languageAbility.code)
                    .setFluency(languageAbility.fluency);
            }));
            req
                .setAvatarKey(avatarKey)
                .setName(name)
                .setCity(city)
                .setHometown(hometown)
                .setLat(lat)
                .setLng(lng)
                .setRadius(radius)
                .setPronouns(pronouns)
                .setOccupation(occupation)
                .setEducation(education)
                .setLanguageAbilities(languageAbilities)
                .setAboutMe(aboutMe)
                .setMyTravels(myTravels)
                .setThingsILike(thingsILike)
                .setHostingStatus(hostingStatus)
                .setMeetupStatus(meetupStatus)
                .setRegionsVisited(regionsVisited)
                .setRegionsLived(regionsLived)
                .setAdditionalInformation(additionalInformation);
            return [2 /*return*/, client.api.updateProfile(req)];
        });
    });
}
export function updateAvatar(avatarKey) {
    var req = new UpdateProfileReq();
    req.setAvatarKey(new NullableStringValue().setValue(avatarKey));
    return client.api.updateProfile(req);
}
export function updateHostingPreference(preferences) {
    var req = new UpdateProfileReq();
    var maxGuests = preferences.maxGuests !== null
        ? new NullableUInt32Value()
            .setValue(preferences.maxGuests)
            .setIsNull(false)
        : new NullableUInt32Value().setIsNull(true);
    var lastMinute = new NullableBoolValue()
        .setValue(preferences.lastMinute)
        .setIsNull(false);
    var hasPets = new NullableBoolValue()
        .setValue(preferences.hasPets)
        .setIsNull(false);
    var acceptsPets = new NullableBoolValue()
        .setValue(preferences.acceptsPets)
        .setIsNull(false);
    var petDetails = new NullableStringValue().setValue(preferences.petDetails);
    var hasKids = new NullableBoolValue()
        .setValue(preferences.hasKids)
        .setIsNull(false);
    var acceptsKids = new NullableBoolValue()
        .setValue(preferences.acceptsKids)
        .setIsNull(false);
    var kidDetails = new NullableStringValue().setValue(preferences.kidDetails);
    var hasHousemates = new NullableBoolValue()
        .setValue(preferences.hasHousemates)
        .setIsNull(false);
    var housemateDetails = new NullableStringValue().setValue(preferences.housemateDetails);
    var wheelchairAccessible = new NullableBoolValue()
        .setValue(preferences.wheelchairAccessible)
        .setIsNull(false);
    var smokingAllowed = preferences.smokingAllowed;
    var smokesAtHome = new NullableBoolValue()
        .setValue(preferences.smokesAtHome)
        .setIsNull(false);
    var drinkingAllowed = new NullableBoolValue()
        .setValue(preferences.drinkingAllowed)
        .setIsNull(false);
    var drinksAtHome = new NullableBoolValue()
        .setValue(preferences.drinksAtHome)
        .setIsNull(false);
    var otherHostInfo = new NullableStringValue().setValue(preferences.otherHostInfo);
    var sleepingArrangement = preferences.sleepingArrangement;
    var sleepingDetails = new NullableStringValue().setValue(preferences.sleepingDetails);
    var area = new NullableStringValue().setValue(preferences.area);
    var houseRules = new NullableStringValue().setValue(preferences.houseRules);
    var parking = new NullableBoolValue()
        .setValue(preferences.parking)
        .setIsNull(false);
    var parkingDetails = preferences.parkingDetails;
    var campingOk = new NullableBoolValue()
        .setValue(preferences.campingOk)
        .setIsNull(false);
    var aboutPlace = new NullableStringValue().setValue(preferences.aboutPlace);
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
        .setCampingOk(campingOk)
        .setAboutPlace(aboutPlace);
    return client.api.updateProfile(req);
}
/**
 * Logout user
 */
export function logout() {
    return client.auth.deauthenticate(new Empty());
}
//# sourceMappingURL=user.js.map