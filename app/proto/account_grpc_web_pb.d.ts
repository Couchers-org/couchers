import * as grpcWeb from 'grpc-web';

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"
import * as account_pb from './account_pb'; // proto import: "account.proto"


export class AccountClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  getAccountInfo(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: account_pb.GetAccountInfoRes) => void
  ): grpcWeb.ClientReadableStream<account_pb.GetAccountInfoRes>;

  changePasswordV2(
    request: account_pb.ChangePasswordV2Req,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  changeEmailV2(
    request: account_pb.ChangeEmailV2Req,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  getContributorFormInfo(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: account_pb.GetContributorFormInfoRes) => void
  ): grpcWeb.ClientReadableStream<account_pb.GetContributorFormInfoRes>;

  fillContributorForm(
    request: account_pb.FillContributorFormReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  changeLanguagePreference(
    request: account_pb.ChangeLanguagePreferenceReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  changePhone(
    request: account_pb.ChangePhoneReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  verifyPhone(
    request: account_pb.VerifyPhoneReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  initiateStrongVerification(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: account_pb.InitiateStrongVerificationRes) => void
  ): grpcWeb.ClientReadableStream<account_pb.InitiateStrongVerificationRes>;

  getStrongVerificationAttemptStatus(
    request: account_pb.GetStrongVerificationAttemptStatusReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: account_pb.GetStrongVerificationAttemptStatusRes) => void
  ): grpcWeb.ClientReadableStream<account_pb.GetStrongVerificationAttemptStatusRes>;

  deleteStrongVerificationData(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  deleteAccount(
    request: account_pb.DeleteAccountReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  listModNotes(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: account_pb.ListModNotesRes) => void
  ): grpcWeb.ClientReadableStream<account_pb.ListModNotesRes>;

  listActiveSessions(
    request: account_pb.ListActiveSessionsReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: account_pb.ListActiveSessionsRes) => void
  ): grpcWeb.ClientReadableStream<account_pb.ListActiveSessionsRes>;

  logOutSession(
    request: account_pb.LogOutSessionReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  logOutOtherSessions(
    request: account_pb.LogOutOtherSessionsReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  setProfilePublicVisibility(
    request: account_pb.SetProfilePublicVisibilityReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

}

export class AccountPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  getAccountInfo(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<account_pb.GetAccountInfoRes>;

  changePasswordV2(
    request: account_pb.ChangePasswordV2Req,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  changeEmailV2(
    request: account_pb.ChangeEmailV2Req,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  getContributorFormInfo(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<account_pb.GetContributorFormInfoRes>;

  fillContributorForm(
    request: account_pb.FillContributorFormReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  changeLanguagePreference(
    request: account_pb.ChangeLanguagePreferenceReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  changePhone(
    request: account_pb.ChangePhoneReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  verifyPhone(
    request: account_pb.VerifyPhoneReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  initiateStrongVerification(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<account_pb.InitiateStrongVerificationRes>;

  getStrongVerificationAttemptStatus(
    request: account_pb.GetStrongVerificationAttemptStatusReq,
    metadata?: grpcWeb.Metadata
  ): Promise<account_pb.GetStrongVerificationAttemptStatusRes>;

  deleteStrongVerificationData(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  deleteAccount(
    request: account_pb.DeleteAccountReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  listModNotes(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<account_pb.ListModNotesRes>;

  listActiveSessions(
    request: account_pb.ListActiveSessionsReq,
    metadata?: grpcWeb.Metadata
  ): Promise<account_pb.ListActiveSessionsRes>;

  logOutSession(
    request: account_pb.LogOutSessionReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  logOutOtherSessions(
    request: account_pb.LogOutOtherSessionsReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  setProfilePublicVisibility(
    request: account_pb.SetProfilePublicVisibilityReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

}

