/**
 * @fileoverview gRPC-Web generated client stub for org.couchers.api.threads
 * @enhanceable
 * @public
 */

// GENERATED CODE -- DO NOT EDIT!

/* eslint-disable */
// @ts-nocheck

const grpc = {};
grpc.web = require("grpc-web");

var google_protobuf_timestamp_pb = require("google-protobuf/google/protobuf/timestamp_pb.js");
const proto = {};
proto.org = {};
proto.org.couchers = {};
proto.org.couchers.api = {};
proto.org.couchers.api.threads = require("./threads_pb.js");

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.org.couchers.api.threads.ThreadsClient = function (
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
proto.org.couchers.api.threads.ThreadsPromiseClient = function (
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
 *   !proto.org.couchers.api.threads.GetThreadReq,
 *   !proto.org.couchers.api.threads.GetThreadRes>}
 */
const methodDescriptor_Threads_GetThread = new grpc.web.MethodDescriptor(
  "/org.couchers.api.threads.Threads/GetThread",
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.threads.GetThreadReq,
  proto.org.couchers.api.threads.GetThreadRes,
  /**
   * @param {!proto.org.couchers.api.threads.GetThreadReq} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.threads.GetThreadRes.deserializeBinary
);

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.threads.GetThreadReq,
 *   !proto.org.couchers.api.threads.GetThreadRes>}
 */
const methodInfo_Threads_GetThread = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.threads.GetThreadRes,
  /**
   * @param {!proto.org.couchers.api.threads.GetThreadReq} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.threads.GetThreadRes.deserializeBinary
);

/**
 * @param {!proto.org.couchers.api.threads.GetThreadReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.threads.GetThreadRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.threads.GetThreadRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.threads.ThreadsClient.prototype.getThread = function (
  request,
  metadata,
  callback
) {
  return this.client_.rpcCall(
    this.hostname_ + "/org.couchers.api.threads.Threads/GetThread",
    request,
    metadata || {},
    methodDescriptor_Threads_GetThread,
    callback
  );
};

/**
 * @param {!proto.org.couchers.api.threads.GetThreadReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.threads.GetThreadRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.threads.ThreadsPromiseClient.prototype.getThread =
  function (request, metadata) {
    return this.client_.unaryCall(
      this.hostname_ + "/org.couchers.api.threads.Threads/GetThread",
      request,
      metadata || {},
      methodDescriptor_Threads_GetThread
    );
  };

/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.threads.PostReplyReq,
 *   !proto.org.couchers.api.threads.PostReplyRes>}
 */
const methodDescriptor_Threads_PostReply = new grpc.web.MethodDescriptor(
  "/org.couchers.api.threads.Threads/PostReply",
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.threads.PostReplyReq,
  proto.org.couchers.api.threads.PostReplyRes,
  /**
   * @param {!proto.org.couchers.api.threads.PostReplyReq} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.threads.PostReplyRes.deserializeBinary
);

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.threads.PostReplyReq,
 *   !proto.org.couchers.api.threads.PostReplyRes>}
 */
const methodInfo_Threads_PostReply = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.threads.PostReplyRes,
  /**
   * @param {!proto.org.couchers.api.threads.PostReplyReq} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.threads.PostReplyRes.deserializeBinary
);

/**
 * @param {!proto.org.couchers.api.threads.PostReplyReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.threads.PostReplyRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.threads.PostReplyRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.threads.ThreadsClient.prototype.postReply = function (
  request,
  metadata,
  callback
) {
  return this.client_.rpcCall(
    this.hostname_ + "/org.couchers.api.threads.Threads/PostReply",
    request,
    metadata || {},
    methodDescriptor_Threads_PostReply,
    callback
  );
};

/**
 * @param {!proto.org.couchers.api.threads.PostReplyReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.threads.PostReplyRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.threads.ThreadsPromiseClient.prototype.postReply =
  function (request, metadata) {
    return this.client_.unaryCall(
      this.hostname_ + "/org.couchers.api.threads.Threads/PostReply",
      request,
      metadata || {},
      methodDescriptor_Threads_PostReply
    );
  };

module.exports = proto.org.couchers.api.threads;
