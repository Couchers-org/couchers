/**
 * @fileoverview gRPC-Web generated client stub for auth
 * @enhanceable
 * @public
 */

// GENERATED CODE -- DO NOT EDIT!


/* eslint-disable */
// @ts-nocheck


import * as grpcWeb from 'grpc-web';

import {
  AuthReq,
  AuthRes,
  CompleteSignupReq,
  CompleteTokenLoginReq,
  DeAuthReq,
  DeAuthRes,
  LoginReq,
  LoginRes,
  SignupReq,
  SignupRes,
  SignupTokenInfoReq,
  SignupTokenInfoRes,
  UsernameValidReq,
  UsernameValidRes} from './auth_pb';

export class AuthClient {
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

  methodInfoLogin = new grpcWeb.AbstractClientBase.MethodInfo(
    LoginRes,
    (request: LoginReq) => {
      return request.serializeBinary();
    },
    LoginRes.deserializeBinary
  );

  login(
    request: LoginReq,
    metadata: grpcWeb.Metadata | null): Promise<LoginRes>;

  login(
    request: LoginReq,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: LoginRes) => void): grpcWeb.ClientReadableStream<LoginRes>;

  login(
    request: LoginReq,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: LoginRes) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/auth.Auth/Login',
        request,
        metadata || {},
        this.methodInfoLogin,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/auth.Auth/Login',
    request,
    metadata || {},
    this.methodInfoLogin);
  }

  methodInfoSignup = new grpcWeb.AbstractClientBase.MethodInfo(
    SignupRes,
    (request: SignupReq) => {
      return request.serializeBinary();
    },
    SignupRes.deserializeBinary
  );

  signup(
    request: SignupReq,
    metadata: grpcWeb.Metadata | null): Promise<SignupRes>;

  signup(
    request: SignupReq,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: SignupRes) => void): grpcWeb.ClientReadableStream<SignupRes>;

  signup(
    request: SignupReq,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: SignupRes) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/auth.Auth/Signup',
        request,
        metadata || {},
        this.methodInfoSignup,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/auth.Auth/Signup',
    request,
    metadata || {},
    this.methodInfoSignup);
  }

  methodInfoCompleteTokenLogin = new grpcWeb.AbstractClientBase.MethodInfo(
    AuthRes,
    (request: CompleteTokenLoginReq) => {
      return request.serializeBinary();
    },
    AuthRes.deserializeBinary
  );

  completeTokenLogin(
    request: CompleteTokenLoginReq,
    metadata: grpcWeb.Metadata | null): Promise<AuthRes>;

  completeTokenLogin(
    request: CompleteTokenLoginReq,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: AuthRes) => void): grpcWeb.ClientReadableStream<AuthRes>;

  completeTokenLogin(
    request: CompleteTokenLoginReq,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: AuthRes) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/auth.Auth/CompleteTokenLogin',
        request,
        metadata || {},
        this.methodInfoCompleteTokenLogin,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/auth.Auth/CompleteTokenLogin',
    request,
    metadata || {},
    this.methodInfoCompleteTokenLogin);
  }

  methodInfoUsernameValid = new grpcWeb.AbstractClientBase.MethodInfo(
    UsernameValidRes,
    (request: UsernameValidReq) => {
      return request.serializeBinary();
    },
    UsernameValidRes.deserializeBinary
  );

  usernameValid(
    request: UsernameValidReq,
    metadata: grpcWeb.Metadata | null): Promise<UsernameValidRes>;

  usernameValid(
    request: UsernameValidReq,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: UsernameValidRes) => void): grpcWeb.ClientReadableStream<UsernameValidRes>;

  usernameValid(
    request: UsernameValidReq,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: UsernameValidRes) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/auth.Auth/UsernameValid',
        request,
        metadata || {},
        this.methodInfoUsernameValid,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/auth.Auth/UsernameValid',
    request,
    metadata || {},
    this.methodInfoUsernameValid);
  }

  methodInfoSignupTokenInfo = new grpcWeb.AbstractClientBase.MethodInfo(
    SignupTokenInfoRes,
    (request: SignupTokenInfoReq) => {
      return request.serializeBinary();
    },
    SignupTokenInfoRes.deserializeBinary
  );

  signupTokenInfo(
    request: SignupTokenInfoReq,
    metadata: grpcWeb.Metadata | null): Promise<SignupTokenInfoRes>;

  signupTokenInfo(
    request: SignupTokenInfoReq,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: SignupTokenInfoRes) => void): grpcWeb.ClientReadableStream<SignupTokenInfoRes>;

  signupTokenInfo(
    request: SignupTokenInfoReq,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: SignupTokenInfoRes) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/auth.Auth/SignupTokenInfo',
        request,
        metadata || {},
        this.methodInfoSignupTokenInfo,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/auth.Auth/SignupTokenInfo',
    request,
    metadata || {},
    this.methodInfoSignupTokenInfo);
  }

  methodInfoCompleteSignup = new grpcWeb.AbstractClientBase.MethodInfo(
    AuthRes,
    (request: CompleteSignupReq) => {
      return request.serializeBinary();
    },
    AuthRes.deserializeBinary
  );

  completeSignup(
    request: CompleteSignupReq,
    metadata: grpcWeb.Metadata | null): Promise<AuthRes>;

  completeSignup(
    request: CompleteSignupReq,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: AuthRes) => void): grpcWeb.ClientReadableStream<AuthRes>;

  completeSignup(
    request: CompleteSignupReq,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: AuthRes) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/auth.Auth/CompleteSignup',
        request,
        metadata || {},
        this.methodInfoCompleteSignup,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/auth.Auth/CompleteSignup',
    request,
    metadata || {},
    this.methodInfoCompleteSignup);
  }

  methodInfoAuthenticate = new grpcWeb.AbstractClientBase.MethodInfo(
    AuthRes,
    (request: AuthReq) => {
      return request.serializeBinary();
    },
    AuthRes.deserializeBinary
  );

  authenticate(
    request: AuthReq,
    metadata: grpcWeb.Metadata | null): Promise<AuthRes>;

  authenticate(
    request: AuthReq,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: AuthRes) => void): grpcWeb.ClientReadableStream<AuthRes>;

  authenticate(
    request: AuthReq,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: AuthRes) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/auth.Auth/Authenticate',
        request,
        metadata || {},
        this.methodInfoAuthenticate,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/auth.Auth/Authenticate',
    request,
    metadata || {},
    this.methodInfoAuthenticate);
  }

  methodInfoDeauthenticate = new grpcWeb.AbstractClientBase.MethodInfo(
    DeAuthRes,
    (request: DeAuthReq) => {
      return request.serializeBinary();
    },
    DeAuthRes.deserializeBinary
  );

  deauthenticate(
    request: DeAuthReq,
    metadata: grpcWeb.Metadata | null): Promise<DeAuthRes>;

  deauthenticate(
    request: DeAuthReq,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: DeAuthRes) => void): grpcWeb.ClientReadableStream<DeAuthRes>;

  deauthenticate(
    request: DeAuthReq,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: DeAuthRes) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/auth.Auth/Deauthenticate',
        request,
        metadata || {},
        this.methodInfoDeauthenticate,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/auth.Auth/Deauthenticate',
    request,
    metadata || {},
    this.methodInfoDeauthenticate);
  }

}

