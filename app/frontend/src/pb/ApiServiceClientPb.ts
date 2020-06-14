/**
 * @fileoverview gRPC-Web generated client stub for api
 * @enhanceable
 * @public
 */

// GENERATED CODE -- DO NOT EDIT!


/* eslint-disable */
// @ts-nocheck


import * as grpcWeb from 'grpc-web';

import {
  GetUserByIdReq,
  PingReq,
  PingRes,
  User} from './api_pb';

export class APIClient {
  client_: grpcWeb.AbstractClientBase;
  hostname_: string;
  credentials_: null | { [index: string]: string; };
  options_: null | { [index: string]: string; };

  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: string; }) {
    if (!options) options = {};
    if (!credentials) credentials = {};
    options['format'] = 'binary';

    this.client_ = new grpcWeb.GrpcWebClientBase(options);
    this.hostname_ = hostname;
    this.credentials_ = credentials;
    this.options_ = options;
  }

  methodInfoPing = new grpcWeb.AbstractClientBase.MethodInfo(
    PingRes,
    (request: PingReq) => {
      return request.serializeBinary();
    },
    PingRes.deserializeBinary
  );

  ping(
    request: PingReq,
    metadata: grpcWeb.Metadata | null): Promise<PingRes>;

  ping(
    request: PingReq,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: PingRes) => void): grpcWeb.ClientReadableStream<PingRes>;

  ping(
    request: PingReq,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: PingRes) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/api.API/Ping',
        request,
        metadata || {},
        this.methodInfoPing,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/api.API/Ping',
    request,
    metadata || {},
    this.methodInfoPing);
  }

  methodInfoGetUserById = new grpcWeb.AbstractClientBase.MethodInfo(
    User,
    (request: GetUserByIdReq) => {
      return request.serializeBinary();
    },
    User.deserializeBinary
  );

  getUserById(
    request: GetUserByIdReq,
    metadata: grpcWeb.Metadata | null): Promise<User>;

  getUserById(
    request: GetUserByIdReq,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: User) => void): grpcWeb.ClientReadableStream<User>;

  getUserById(
    request: GetUserByIdReq,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: User) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/api.API/GetUserById',
        request,
        metadata || {},
        this.methodInfoGetUserById,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/api.API/GetUserById',
    request,
    metadata || {},
    this.methodInfoGetUserById);
  }

}

