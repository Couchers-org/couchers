import * as grpcWeb from 'grpc-web';

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"
import * as donations_pb from './donations_pb'; // proto import: "donations.proto"


export class DonationsClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  initiateDonation(
    request: donations_pb.InitiateDonationReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: donations_pb.InitiateDonationRes) => void
  ): grpcWeb.ClientReadableStream<donations_pb.InitiateDonationRes>;

  getDonationPortalLink(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: donations_pb.GetDonationPortalLinkRes) => void
  ): grpcWeb.ClientReadableStream<donations_pb.GetDonationPortalLinkRes>;

}

export class DonationsPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  initiateDonation(
    request: donations_pb.InitiateDonationReq,
    metadata?: grpcWeb.Metadata
  ): Promise<donations_pb.InitiateDonationRes>;

  getDonationPortalLink(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<donations_pb.GetDonationPortalLinkRes>;

}

