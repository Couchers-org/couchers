export * from "./authInterceptor";
export * from "./client";
export * from "./generated";
export * from "./constants";
export * from "./types";

export type Timestamp = {
  seconds: number;
  nanos: number;
};

export type Duration = Timestamp;
