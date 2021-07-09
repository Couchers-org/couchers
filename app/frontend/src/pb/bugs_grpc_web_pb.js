/**
 * @fileoverview gRPC-Web generated client stub for org.couchers.bugs
 * @enhanceable
 * @public
 */

// GENERATED CODE -- DO NOT EDIT!

/* eslint-disable */
// @ts-nocheck

const grpc = {};
grpc.web = require("grpc-web");

var google_protobuf_empty_pb = require("google-protobuf/google/protobuf/empty_pb.js");
const proto = {};
proto.org = {};
proto.org.couchers = {};
proto.org.couchers.bugs = require("./bugs_pb.js");

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.org.couchers.bugs.BugsClient = function (hostname, credentials, options) {
  if (!options) options = {};
  options["format"] = "binary";

  /**
   * @private @const {!grpc.web.GrpcWebClientBase} The client
   */
  this.client_ = new grpc.web.GrpcWebClientBase(options);

  /**
   * @private @const {string} The hostname
   */
  this.hostname_ = hostname;
};

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.org.couchers.bugs.BugsPromiseClient = function (
  hostname,
  credentials,
  options
) {
  if (!options) options = {};
  options["format"] = "binary";

  /**
   * @private @const {!grpc.web.GrpcWebClientBase} The client
   */
  this.client_ = new grpc.web.GrpcWebClientBase(options);

  /**
   * @private @const {string} The hostname
   */
  this.hostname_ = hostname;
};

/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.google.protobuf.Empty,
 *   !proto.org.couchers.bugs.VersionInfo>}
 */
const methodDescriptor_Bugs_Version = new grpc.web.MethodDescriptor(
  "/org.couchers.bugs.Bugs/Version",
  grpc.web.MethodType.UNARY,
  google_protobuf_empty_pb.Empty,
  proto.org.couchers.bugs.VersionInfo,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  proto.org.couchers.bugs.VersionInfo.deserializeBinary
);

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.google.protobuf.Empty,
 *   !proto.org.couchers.bugs.VersionInfo>}
 */
const methodInfo_Bugs_Version = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.bugs.VersionInfo,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  proto.org.couchers.bugs.VersionInfo.deserializeBinary
);

/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.bugs.VersionInfo)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.bugs.VersionInfo>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.bugs.BugsClient.prototype.version = function (
  request,
  metadata,
  callback
) {
  return this.client_.rpcCall(
    this.hostname_ + "/org.couchers.bugs.Bugs/Version",
    request,
    metadata || {},
    methodDescriptor_Bugs_Version,
    callback
  );
};

/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.bugs.VersionInfo>}
 *     Promise that resolves to the response
 */
proto.org.couchers.bugs.BugsPromiseClient.prototype.version = function (
  request,
  metadata
) {
  return this.client_.unaryCall(
    this.hostname_ + "/org.couchers.bugs.Bugs/Version",
    request,
    metadata || {},
    methodDescriptor_Bugs_Version
  );
};

/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.bugs.ReportBugReq,
 *   !proto.org.couchers.bugs.ReportBugRes>}
 */
const methodDescriptor_Bugs_ReportBug = new grpc.web.MethodDescriptor(
  "/org.couchers.bugs.Bugs/ReportBug",
  grpc.web.MethodType.UNARY,
  proto.org.couchers.bugs.ReportBugReq,
  proto.org.couchers.bugs.ReportBugRes,
  /**
   * @param {!proto.org.couchers.bugs.ReportBugReq} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  proto.org.couchers.bugs.ReportBugRes.deserializeBinary
);

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.bugs.ReportBugReq,
 *   !proto.org.couchers.bugs.ReportBugRes>}
 */
const methodInfo_Bugs_ReportBug = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.bugs.ReportBugRes,
  /**
   * @param {!proto.org.couchers.bugs.ReportBugReq} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  proto.org.couchers.bugs.ReportBugRes.deserializeBinary
);

/**
 * @param {!proto.org.couchers.bugs.ReportBugReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.bugs.ReportBugRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.bugs.ReportBugRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.bugs.BugsClient.prototype.reportBug = function (
  request,
  metadata,
  callback
) {
  return this.client_.rpcCall(
    this.hostname_ + "/org.couchers.bugs.Bugs/ReportBug",
    request,
    metadata || {},
    methodDescriptor_Bugs_ReportBug,
    callback
  );
};

/**
 * @param {!proto.org.couchers.bugs.ReportBugReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.bugs.ReportBugRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.bugs.BugsPromiseClient.prototype.reportBug = function (
  request,
  metadata
) {
  return this.client_.unaryCall(
    this.hostname_ + "/org.couchers.bugs.Bugs/ReportBug",
    request,
    metadata || {},
    methodDescriptor_Bugs_ReportBug
  );
};

module.exports = proto.org.couchers.bugs;
