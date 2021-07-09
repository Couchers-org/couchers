/**
 * @fileoverview gRPC-Web generated client stub for org.couchers.jail
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
proto.org.couchers.jail = require("./jail_pb.js");

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.org.couchers.jail.JailClient = function (hostname, credentials, options) {
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
proto.org.couchers.jail.JailPromiseClient = function (
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
 *   !proto.org.couchers.jail.JailInfoRes>}
 */
const methodDescriptor_Jail_JailInfo = new grpc.web.MethodDescriptor(
  "/org.couchers.jail.Jail/JailInfo",
  grpc.web.MethodType.UNARY,
  google_protobuf_empty_pb.Empty,
  proto.org.couchers.jail.JailInfoRes,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  proto.org.couchers.jail.JailInfoRes.deserializeBinary
);

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.google.protobuf.Empty,
 *   !proto.org.couchers.jail.JailInfoRes>}
 */
const methodInfo_Jail_JailInfo = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.jail.JailInfoRes,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  proto.org.couchers.jail.JailInfoRes.deserializeBinary
);

/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.jail.JailInfoRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.jail.JailInfoRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.jail.JailClient.prototype.jailInfo = function (
  request,
  metadata,
  callback
) {
  return this.client_.rpcCall(
    this.hostname_ + "/org.couchers.jail.Jail/JailInfo",
    request,
    metadata || {},
    methodDescriptor_Jail_JailInfo,
    callback
  );
};

/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.jail.JailInfoRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.jail.JailPromiseClient.prototype.jailInfo = function (
  request,
  metadata
) {
  return this.client_.unaryCall(
    this.hostname_ + "/org.couchers.jail.Jail/JailInfo",
    request,
    metadata || {},
    methodDescriptor_Jail_JailInfo
  );
};

/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.jail.AcceptTOSReq,
 *   !proto.org.couchers.jail.JailInfoRes>}
 */
const methodDescriptor_Jail_AcceptTOS = new grpc.web.MethodDescriptor(
  "/org.couchers.jail.Jail/AcceptTOS",
  grpc.web.MethodType.UNARY,
  proto.org.couchers.jail.AcceptTOSReq,
  proto.org.couchers.jail.JailInfoRes,
  /**
   * @param {!proto.org.couchers.jail.AcceptTOSReq} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  proto.org.couchers.jail.JailInfoRes.deserializeBinary
);

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.jail.AcceptTOSReq,
 *   !proto.org.couchers.jail.JailInfoRes>}
 */
const methodInfo_Jail_AcceptTOS = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.jail.JailInfoRes,
  /**
   * @param {!proto.org.couchers.jail.AcceptTOSReq} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  proto.org.couchers.jail.JailInfoRes.deserializeBinary
);

/**
 * @param {!proto.org.couchers.jail.AcceptTOSReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.jail.JailInfoRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.jail.JailInfoRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.jail.JailClient.prototype.acceptTOS = function (
  request,
  metadata,
  callback
) {
  return this.client_.rpcCall(
    this.hostname_ + "/org.couchers.jail.Jail/AcceptTOS",
    request,
    metadata || {},
    methodDescriptor_Jail_AcceptTOS,
    callback
  );
};

/**
 * @param {!proto.org.couchers.jail.AcceptTOSReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.jail.JailInfoRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.jail.JailPromiseClient.prototype.acceptTOS = function (
  request,
  metadata
) {
  return this.client_.unaryCall(
    this.hostname_ + "/org.couchers.jail.Jail/AcceptTOS",
    request,
    metadata || {},
    methodDescriptor_Jail_AcceptTOS
  );
};

/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.jail.SetLocationReq,
 *   !proto.org.couchers.jail.JailInfoRes>}
 */
const methodDescriptor_Jail_SetLocation = new grpc.web.MethodDescriptor(
  "/org.couchers.jail.Jail/SetLocation",
  grpc.web.MethodType.UNARY,
  proto.org.couchers.jail.SetLocationReq,
  proto.org.couchers.jail.JailInfoRes,
  /**
   * @param {!proto.org.couchers.jail.SetLocationReq} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  proto.org.couchers.jail.JailInfoRes.deserializeBinary
);

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.jail.SetLocationReq,
 *   !proto.org.couchers.jail.JailInfoRes>}
 */
const methodInfo_Jail_SetLocation = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.jail.JailInfoRes,
  /**
   * @param {!proto.org.couchers.jail.SetLocationReq} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  proto.org.couchers.jail.JailInfoRes.deserializeBinary
);

/**
 * @param {!proto.org.couchers.jail.SetLocationReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.jail.JailInfoRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.jail.JailInfoRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.jail.JailClient.prototype.setLocation = function (
  request,
  metadata,
  callback
) {
  return this.client_.rpcCall(
    this.hostname_ + "/org.couchers.jail.Jail/SetLocation",
    request,
    metadata || {},
    methodDescriptor_Jail_SetLocation,
    callback
  );
};

/**
 * @param {!proto.org.couchers.jail.SetLocationReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.jail.JailInfoRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.jail.JailPromiseClient.prototype.setLocation = function (
  request,
  metadata
) {
  return this.client_.unaryCall(
    this.hostname_ + "/org.couchers.jail.Jail/SetLocation",
    request,
    metadata || {},
    methodDescriptor_Jail_SetLocation
  );
};

module.exports = proto.org.couchers.jail;
