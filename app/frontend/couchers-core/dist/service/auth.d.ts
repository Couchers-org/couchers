import { HostingStatus } from "proto/api_pb";
import { ContributorForm as ContributorFormPb } from "proto/auth_pb";
export declare function checkUsername(username: string): Promise<import("proto/auth_pb").LoginRes.LoginStep>;
export declare function startSignup(name: string, email: string): Promise<import("proto/auth_pb").SignupFlowRes.AsObject>;
interface AccountSignupData {
    flowToken: string;
    username: string;
    password?: string;
    birthdate: string;
    gender: string;
    acceptTOS: boolean;
    hostingStatus: HostingStatus;
    city: string;
    lat: number;
    lng: number;
    radius: number;
}
export declare function signupFlowAccount({ flowToken, username, password, birthdate, gender, acceptTOS, hostingStatus, city, lat, lng, radius, }: AccountSignupData): Promise<import("proto/auth_pb").SignupFlowRes.AsObject>;
export declare function contributorFormFromObject(form: ContributorFormPb.AsObject): ContributorFormPb;
export declare function signupFlowFeedback(flowToken: string, form: ContributorFormPb.AsObject): Promise<import("proto/auth_pb").SignupFlowRes.AsObject>;
export declare function signupFlowEmailToken(emailToken: string): Promise<import("proto/auth_pb").SignupFlowRes.AsObject>;
export declare function signupFlowCommunityGuidelines(flowToken: string, accept: boolean): Promise<import("proto/auth_pb").SignupFlowRes.AsObject>;
export declare function validateUsername(username: string): Promise<boolean>;
export {};
//# sourceMappingURL=auth.d.ts.map