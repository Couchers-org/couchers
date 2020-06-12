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
  AuthRequest,
  AuthResponse,
  CompleteSignupReq,
  CompleteTokenLoginReq,
  DeauthRequest,
  DeauthResponse,
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
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
    LoginResponse,
    (request: LoginRequest) => {
      return request.serializeBinary();
    },
    LoginResponse.deserializeBinary
  );

  login(
    request: LoginRequest,
    metadata: grpcWeb.Metadata | null): Promise<LoginResponse>;

  login(
    request: LoginRequest,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: LoginResponse) => void): grpcWeb.ClientReadableStream<LoginResponse>;

  login(
    request: LoginRequest,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: LoginResponse) => void) {
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
    SignupResponse,
    (request: SignupRequest) => {
      return request.serializeBinary();
    },
    SignupResponse.deserializeBinary
  );

  signup(
    request: SignupRequest,
    metadata: grpcWeb.Metadata | null): Promise<SignupResponse>;

  signup(
    request: SignupRequest,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: SignupResponse) => void): grpcWeb.ClientReadableStream<SignupResponse>;

  signup(
    request: SignupRequest,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: SignupResponse) => void) {
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
    AuthResponse,
    (request: CompleteTokenLoginReq) => {
      return request.serializeBinary();
    },
    AuthResponse.deserializeBinary
  );

  completeTokenLogin(
    request: CompleteTokenLoginReq,
    metadata: grpcWeb.Metadata | null): Promise<AuthResponse>;

  completeTokenLogin(
    request: CompleteTokenLoginReq,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: AuthResponse) => void): grpcWeb.ClientReadableStream<AuthResponse>;

  completeTokenLogin(
    request: CompleteTokenLoginReq,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: AuthResponse) => void) {
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
    AuthResponse,
    (request: CompleteSignupReq) => {
      return request.serializeBinary();
    },
    AuthResponse.deserializeBinary
  );

  completeSignup(
    request: CompleteSignupReq,
    metadata: grpcWeb.Metadata | null): Promise<AuthResponse>;

  completeSignup(
    request: CompleteSignupReq,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: AuthResponse) => void): grpcWeb.ClientReadableStream<AuthResponse>;

  completeSignup(
    request: CompleteSignupReq,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: AuthResponse) => void) {
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
    AuthResponse,
    (request: AuthRequest) => {
      return request.serializeBinary();
    },
    AuthResponse.deserializeBinary
  );

  authenticate(
    request: AuthRequest,
    metadata: grpcWeb.Metadata | null): Promise<AuthResponse>;

  authenticate(
    request: AuthRequest,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: AuthResponse) => void): grpcWeb.ClientReadableStream<AuthResponse>;

  authenticate(
    request: AuthRequest,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: AuthResponse) => void) {
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
    DeauthResponse,
    (request: DeauthRequest) => {
      return request.serializeBinary();
    },
    DeauthResponse.deserializeBinary
  );

  deauthenticate(
    request: DeauthRequest,
    metadata: grpcWeb.Metadata | null): Promise<DeauthResponse>;

  deauthenticate(
    request: DeauthRequest,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: DeauthResponse) => void): grpcWeb.ClientReadableStream<DeauthResponse>;

  deauthenticate(
    request: DeauthRequest,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: DeauthResponse) => void) {
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

