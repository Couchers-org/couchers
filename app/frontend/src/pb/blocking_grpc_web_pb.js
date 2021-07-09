/**
 * @fileoverview gRPC-Web generated client stub for org.couchers.blocking
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
proto.org.couchers.blocking = require("./blocking_pb.js");

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.org.couchers.blocking.BlockingClient = function (
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
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.org.couchers.blocking.BlockingPromiseClient = function (
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
 *   !proto.org.couchers.blocking.BlockUserReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Blocking_BlockUser = new grpc.web.MethodDescriptor(
  "/org.couchers.blocking.Blocking/BlockUser",
  grpc.web.MethodType.UNARY,
  proto.org.couchers.blocking.BlockUserReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.org.couchers.blocking.BlockUserReq} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.blocking.BlockUserReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Blocking_BlockUser =
  new grpc.web.AbstractClientBase.MethodInfo(
    google_protobuf_empty_pb.Empty,
    /**
     * @param {!proto.org.couchers.blocking.BlockUserReq} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    google_protobuf_empty_pb.Empty.deserializeBinary
  );

/**
 * @param {!proto.org.couchers.blocking.BlockUserReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.blocking.BlockingClient.prototype.blockUser = function (
  request,
  metadata,
  callback
) {
  return this.client_.rpcCall(
    this.hostname_ + "/org.couchers.blocking.Blocking/BlockUser",
    request,
    metadata || {},
    methodDescriptor_Blocking_BlockUser,
    callback
  );
};

/**
 * @param {!proto.org.couchers.blocking.BlockUserReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.org.couchers.blocking.BlockingPromiseClient.prototype.blockUser =
  function (request, metadata) {
    return this.client_.unaryCall(
      this.hostname_ + "/org.couchers.blocking.Blocking/BlockUser",
      request,
      metadata || {},
      methodDescriptor_Blocking_BlockUser
    );
  };

/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.blocking.UnblockUserReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Blocking_UnblockUser = new grpc.web.MethodDescriptor(
  "/org.couchers.blocking.Blocking/UnblockUser",
  grpc.web.MethodType.UNARY,
  proto.org.couchers.blocking.UnblockUserReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.org.couchers.blocking.UnblockUserReq} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.blocking.UnblockUserReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Blocking_UnblockUser =
  new grpc.web.AbstractClientBase.MethodInfo(
    google_protobuf_empty_pb.Empty,
    /**
     * @param {!proto.org.couchers.blocking.UnblockUserReq} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    google_protobuf_empty_pb.Empty.deserializeBinary
  );

/**
 * @param {!proto.org.couchers.blocking.UnblockUserReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.blocking.BlockingClient.prototype.unblockUser = function (
  request,
  metadata,
  callback
) {
  return this.client_.rpcCall(
    this.hostname_ + "/org.couchers.blocking.Blocking/UnblockUser",
    request,
    metadata || {},
    methodDescriptor_Blocking_UnblockUser,
    callback
  );
};

/**
 * @param {!proto.org.couchers.blocking.UnblockUserReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.org.couchers.blocking.BlockingPromiseClient.prototype.unblockUser =
  function (request, metadata) {
    return this.client_.unaryCall(
      this.hostname_ + "/org.couchers.blocking.Blocking/UnblockUser",
      request,
      metadata || {},
      methodDescriptor_Blocking_UnblockUser
    );
  };

/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.google.protobuf.Empty,
 *   !proto.org.couchers.blocking.GetBlockedUsersRes>}
 */
const methodDescriptor_Blocking_GetBlockedUsers = new grpc.web.MethodDescriptor(
  "/org.couchers.blocking.Blocking/GetBlockedUsers",
  grpc.web.MethodType.UNARY,
  google_protobuf_empty_pb.Empty,
  proto.org.couchers.blocking.GetBlockedUsersRes,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  proto.org.couchers.blocking.GetBlockedUsersRes.deserializeBinary
);

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.google.protobuf.Empty,
 *   !proto.org.couchers.blocking.GetBlockedUsersRes>}
 */
const methodInfo_Blocking_GetBlockedUsers =
  new grpc.web.AbstractClientBase.MethodInfo(
    proto.org.couchers.blocking.GetBlockedUsersRes,
    /**
     * @param {!proto.google.protobuf.Empty} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    proto.org.couchers.blocking.GetBlockedUsersRes.deserializeBinary
  );

/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.blocking.GetBlockedUsersRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.blocking.GetBlockedUsersRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.blocking.BlockingClient.prototype.getBlockedUsers =
  function (request, metadata, callback) {
    return this.client_.rpcCall(
      this.hostname_ + "/org.couchers.blocking.Blocking/GetBlockedUsers",
      request,
      metadata || {},
      methodDescriptor_Blocking_GetBlockedUsers,
      callback
    );
  };

/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.blocking.GetBlockedUsersRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.blocking.BlockingPromiseClient.prototype.getBlockedUsers =
  function (request, metadata) {
    return this.client_.unaryCall(
      this.hostname_ + "/org.couchers.blocking.Blocking/GetBlockedUsers",
      request,
      metadata || {},
      methodDescriptor_Blocking_GetBlockedUsers
    );
  };

module.exports = proto.org.couchers.blocking;
