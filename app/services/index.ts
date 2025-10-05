export * from "./authInterceptor";
export * from "./client";
export * from "./generated";
export * from "./constants";

export type Timestamp = {
  seconds: bigint;
  nanos: number;
};

export type Duration = Timestamp;

export type Any = {
  typeUrl: string;
  value: Uint8Array;
};

export type HttpBody = {
  contentType: string;
  data: Uint8Array;
  extensions: Any[];
};
