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
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: string; });

  signup(
    request: SignupReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: SignupRes) => void
  ): grpcWeb.ClientReadableStream<SignupRes>;

  usernameValid(
    request: UsernameValidReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: UsernameValidRes) => void
  ): grpcWeb.ClientReadableStream<UsernameValidRes>;

  signupTokenInfo(
    request: SignupTokenInfoReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: SignupTokenInfoRes) => void
  ): grpcWeb.ClientReadableStream<SignupTokenInfoRes>;

  completeSignup(
    request: CompleteSignupReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: AuthRes) => void
  ): grpcWeb.ClientReadableStream<AuthRes>;

  login(
    request: LoginReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: LoginRes) => void
  ): grpcWeb.ClientReadableStream<LoginRes>;

  completeTokenLogin(
    request: CompleteTokenLoginReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: AuthRes) => void
  ): grpcWeb.ClientReadableStream<AuthRes>;

  authenticate(
    request: AuthReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: AuthRes) => void
  ): grpcWeb.ClientReadableStream<AuthRes>;

  deauthenticate(
    request: DeAuthReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: DeAuthRes) => void
  ): grpcWeb.ClientReadableStream<DeAuthRes>;

}

export class AuthPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: string; });

  signup(
    request: SignupReq,
    metadata?: grpcWeb.Metadata
  ): Promise<SignupRes>;

  usernameValid(
    request: UsernameValidReq,
    metadata?: grpcWeb.Metadata
  ): Promise<UsernameValidRes>;

  signupTokenInfo(
    request: SignupTokenInfoReq,
    metadata?: grpcWeb.Metadata
  ): Promise<SignupTokenInfoRes>;

  completeSignup(
    request: CompleteSignupReq,
    metadata?: grpcWeb.Metadata
  ): Promise<AuthRes>;

  login(
    request: LoginReq,
    metadata?: grpcWeb.Metadata
  ): Promise<LoginRes>;

  completeTokenLogin(
    request: CompleteTokenLoginReq,
    metadata?: grpcWeb.Metadata
  ): Promise<AuthRes>;

  authenticate(
    request: AuthReq,
    metadata?: grpcWeb.Metadata
  ): Promise<AuthRes>;

  deauthenticate(
    request: DeAuthReq,
    metadata?: grpcWeb.Metadata
  ): Promise<DeAuthRes>;

}

