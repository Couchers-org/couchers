import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';
import * as grpcWeb from 'grpc-web';

import * as pb_bugs_pb from '../pb/bugs_pb';


export class BugsClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  version(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_bugs_pb.VersionInfo) => void
  ): grpcWeb.ClientReadableStream<pb_bugs_pb.VersionInfo>;

  reportBug(
    request: pb_bugs_pb.ReportBugReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_bugs_pb.ReportBugRes) => void
  ): grpcWeb.ClientReadableStream<pb_bugs_pb.ReportBugRes>;

}

export class BugsPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  version(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_bugs_pb.VersionInfo>;

  reportBug(
    request: pb_bugs_pb.ReportBugReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_bugs_pb.ReportBugRes>;

}

