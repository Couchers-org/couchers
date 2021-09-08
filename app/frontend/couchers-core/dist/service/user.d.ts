import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { UpdateProfileReq, User } from "proto/api_pb";
import { ProtoToJsTypes } from "utils/types";
declare type RequiredUpdateProfileReq = Required<UpdateProfileReq.AsObject>;
declare type ProfileFormData = {
    [K in keyof RequiredUpdateProfileReq]: ProtoToJsTypes<RequiredUpdateProfileReq[K]>;
};
export declare type UpdateUserProfileData = Pick<ProfileFormData, "name" | "city" | "hometown" | "lat" | "lng" | "radius" | "pronouns" | "occupation" | "education" | "aboutMe" | "myTravels" | "thingsILike" | "hostingStatus" | "meetupStatus" | "languageAbilities" | "regionsVisited" | "regionsLived" | "additionalInformation" | "avatarKey">;
export declare type HostingPreferenceData = Omit<ProfileFormData, keyof UpdateUserProfileData | "gender">;
/**
 * Login user using password
 */
export declare function passwordLogin(username: string, password: string): Promise<import("proto/auth_pb").AuthRes.AsObject>;
/**
 * Login user using a login token
 */
export declare function tokenLogin(loginToken: string): Promise<import("proto/auth_pb").AuthRes.AsObject>;
/**
 * Returns User record of logged in user
 *
 * @returns {Promise<User.AsObject>}
 */
export declare function getCurrentUser(): Promise<User.AsObject>;
/**
 * Returns User record by Username or id
 *
 * @param {string} user
 * @returns {Promise<User.AsObject>}
 */
export declare function getUser(user: string): Promise<User.AsObject>;
/**
 * Updates user profile
 */
export declare function updateProfile(profile: UpdateUserProfileData): Promise<Empty>;
export declare function updateAvatar(avatarKey: string): Promise<Empty>;
export declare function updateHostingPreference(preferences: HostingPreferenceData): Promise<Empty>;
/**
 * Logout user
 */
export declare function logout(): Promise<Empty>;
export {};
//# sourceMappingURL=user.d.ts.map