import * as grpcWeb from 'grpc-web';

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';
import * as pb_auth_pb from '../pb/auth_pb';


export class AuthClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  signup(
    request: pb_auth_pb.SignupReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_auth_pb.SignupRes) => void
  ): grpcWeb.ClientReadableStream<pb_auth_pb.SignupRes>;

  usernameValid(
    request: pb_auth_pb.UsernameValidReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_auth_pb.UsernameValidRes) => void
  ): grpcWeb.ClientReadableStream<pb_auth_pb.UsernameValidRes>;

  signupTokenInfo(
    request: pb_auth_pb.SignupTokenInfoReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_auth_pb.SignupTokenInfoRes) => void
  ): grpcWeb.ClientReadableStream<pb_auth_pb.SignupTokenInfoRes>;

  completeSignup(
    request: pb_auth_pb.CompleteSignupReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_auth_pb.AuthRes) => void
  ): grpcWeb.ClientReadableStream<pb_auth_pb.AuthRes>;

  login(
    request: pb_auth_pb.LoginReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_auth_pb.LoginRes) => void
  ): grpcWeb.ClientReadableStream<pb_auth_pb.LoginRes>;

  completeTokenLogin(
    request: pb_auth_pb.CompleteTokenLoginReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_auth_pb.AuthRes) => void
  ): grpcWeb.ClientReadableStream<pb_auth_pb.AuthRes>;

  authenticate(
    request: pb_auth_pb.AuthReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_auth_pb.AuthRes) => void
  ): grpcWeb.ClientReadableStream<pb_auth_pb.AuthRes>;

  deauthenticate(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  resetPassword(
    request: pb_auth_pb.ResetPasswordReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  completePasswordReset(
    request: pb_auth_pb.CompletePasswordResetReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  completeChangeEmail(
    request: pb_auth_pb.CompleteChangeEmailReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

}

export class AuthPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  signup(
    request: pb_auth_pb.SignupReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_auth_pb.SignupRes>;

  usernameValid(
    request: pb_auth_pb.UsernameValidReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_auth_pb.UsernameValidRes>;

  signupTokenInfo(
    request: pb_auth_pb.SignupTokenInfoReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_auth_pb.SignupTokenInfoRes>;

  completeSignup(
    request: pb_auth_pb.CompleteSignupReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_auth_pb.AuthRes>;

  login(
    request: pb_auth_pb.LoginReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_auth_pb.LoginRes>;

  completeTokenLogin(
    request: pb_auth_pb.CompleteTokenLoginReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_auth_pb.AuthRes>;

  authenticate(
    request: pb_auth_pb.AuthReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_auth_pb.AuthRes>;

  deauthenticate(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  resetPassword(
    request: pb_auth_pb.ResetPasswordReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  completePasswordReset(
    request: pb_auth_pb.CompletePasswordResetReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  completeChangeEmail(
    request: pb_auth_pb.CompleteChangeEmailReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

}

