import * as grpcWeb from 'grpc-web';

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"
import * as auth_pb from './auth_pb'; // proto import: "auth.proto"


export class AuthClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  signupFlow(
    request: auth_pb.SignupFlowReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: auth_pb.SignupFlowRes) => void
  ): grpcWeb.ClientReadableStream<auth_pb.SignupFlowRes>;

  usernameValid(
    request: auth_pb.UsernameValidReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: auth_pb.UsernameValidRes) => void
  ): grpcWeb.ClientReadableStream<auth_pb.UsernameValidRes>;

  authenticate(
    request: auth_pb.AuthReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: auth_pb.AuthRes) => void
  ): grpcWeb.ClientReadableStream<auth_pb.AuthRes>;

  getAuthState(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: auth_pb.GetAuthStateRes) => void
  ): grpcWeb.ClientReadableStream<auth_pb.GetAuthStateRes>;

  deauthenticate(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  resetPassword(
    request: auth_pb.ResetPasswordReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  completePasswordResetV2(
    request: auth_pb.CompletePasswordResetV2Req,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: auth_pb.AuthRes) => void
  ): grpcWeb.ClientReadableStream<auth_pb.AuthRes>;

  confirmChangeEmailV2(
    request: auth_pb.ConfirmChangeEmailV2Req,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  confirmDeleteAccount(
    request: auth_pb.ConfirmDeleteAccountReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  recoverAccount(
    request: auth_pb.RecoverAccountReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  unsubscribe(
    request: auth_pb.UnsubscribeReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: auth_pb.UnsubscribeRes) => void
  ): grpcWeb.ClientReadableStream<auth_pb.UnsubscribeRes>;

}

export class AuthPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  signupFlow(
    request: auth_pb.SignupFlowReq,
    metadata?: grpcWeb.Metadata
  ): Promise<auth_pb.SignupFlowRes>;

  usernameValid(
    request: auth_pb.UsernameValidReq,
    metadata?: grpcWeb.Metadata
  ): Promise<auth_pb.UsernameValidRes>;

  authenticate(
    request: auth_pb.AuthReq,
    metadata?: grpcWeb.Metadata
  ): Promise<auth_pb.AuthRes>;

  getAuthState(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<auth_pb.GetAuthStateRes>;

  deauthenticate(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  resetPassword(
    request: auth_pb.ResetPasswordReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  completePasswordResetV2(
    request: auth_pb.CompletePasswordResetV2Req,
    metadata?: grpcWeb.Metadata
  ): Promise<auth_pb.AuthRes>;

  confirmChangeEmailV2(
    request: auth_pb.ConfirmChangeEmailV2Req,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  confirmDeleteAccount(
    request: auth_pb.ConfirmDeleteAccountReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  recoverAccount(
    request: auth_pb.RecoverAccountReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  unsubscribe(
    request: auth_pb.UnsubscribeReq,
    metadata?: grpcWeb.Metadata
  ): Promise<auth_pb.UnsubscribeRes>;

}

