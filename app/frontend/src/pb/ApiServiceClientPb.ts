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
  GetUserByIdRequest,
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

  methodInfoGetUserById = new grpcWeb.AbstractClientBase.MethodInfo(
    User,
    (request: GetUserByIdRequest) => {
      return request.serializeBinary();
    },
    User.deserializeBinary
  );

  getUserById(
    request: GetUserByIdRequest,
    metadata: grpcWeb.Metadata | null): Promise<User>;

  getUserById(
    request: GetUserByIdRequest,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: User) => void): grpcWeb.ClientReadableStream<User>;

  getUserById(
    request: GetUserByIdRequest,
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

