export declare function getIsJailed(): Promise<{
    isJailed: false;
    user: import("../proto/api_pb").User.AsObject;
} | {
    isJailed: true;
    user: null;
}>;
export declare function getJailInfo(): Promise<import("proto/jail_pb").JailInfoRes.AsObject>;
export declare function acceptTOS(): Promise<{
    isJailed: boolean;
}>;
export declare function setLocation(city: string, lat: number, lng: number, radius: number): Promise<{
    isJailed: boolean;
}>;
export declare function setAcceptedCommunityGuidelines(accepted: boolean): Promise<{
    isJailed: boolean;
}>;
//# sourceMappingURL=jail.d.ts.map