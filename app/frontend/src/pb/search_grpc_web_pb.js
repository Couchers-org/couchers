/**
 * @fileoverview gRPC-Web generated client stub for org.couchers.api.search
 * @enhanceable
 * @public
 */

// GENERATED CODE -- DO NOT EDIT!

/* eslint-disable */
// @ts-nocheck

const grpc = {};
grpc.web = require("grpc-web");

var google_protobuf_timestamp_pb = require("google-protobuf/google/protobuf/timestamp_pb.js");

var google_protobuf_wrappers_pb = require("google-protobuf/google/protobuf/wrappers_pb.js");

var pb_api_pb = require("../pb/api_pb.js");

var pb_communities_pb = require("../pb/communities_pb.js");

var pb_groups_pb = require("../pb/groups_pb.js");

var pb_pages_pb = require("../pb/pages_pb.js");
const proto = {};
proto.org = {};
proto.org.couchers = {};
proto.org.couchers.api = {};
proto.org.couchers.api.search = require("./search_pb.js");

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.org.couchers.api.search.SearchClient = function (
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
proto.org.couchers.api.search.SearchPromiseClient = function (
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
 *   !proto.org.couchers.api.search.SearchReq,
 *   !proto.org.couchers.api.search.SearchRes>}
 */
const methodDescriptor_Search_Search = new grpc.web.MethodDescriptor(
  "/org.couchers.api.search.Search/Search",
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.search.SearchReq,
  proto.org.couchers.api.search.SearchRes,
  /**
   * @param {!proto.org.couchers.api.search.SearchReq} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.search.SearchRes.deserializeBinary
);

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.search.SearchReq,
 *   !proto.org.couchers.api.search.SearchRes>}
 */
const methodInfo_Search_Search = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.search.SearchRes,
  /**
   * @param {!proto.org.couchers.api.search.SearchReq} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.search.SearchRes.deserializeBinary
);

/**
 * @param {!proto.org.couchers.api.search.SearchReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.search.SearchRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.search.SearchRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.search.SearchClient.prototype.search = function (
  request,
  metadata,
  callback
) {
  return this.client_.rpcCall(
    this.hostname_ + "/org.couchers.api.search.Search/Search",
    request,
    metadata || {},
    methodDescriptor_Search_Search,
    callback
  );
};

/**
 * @param {!proto.org.couchers.api.search.SearchReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.search.SearchRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.search.SearchPromiseClient.prototype.search = function (
  request,
  metadata
) {
  return this.client_.unaryCall(
    this.hostname_ + "/org.couchers.api.search.Search/Search",
    request,
    metadata || {},
    methodDescriptor_Search_Search
  );
};

/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.search.UserSearchReq,
 *   !proto.org.couchers.api.search.UserSearchRes>}
 */
const methodDescriptor_Search_UserSearch = new grpc.web.MethodDescriptor(
  "/org.couchers.api.search.Search/UserSearch",
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.search.UserSearchReq,
  proto.org.couchers.api.search.UserSearchRes,
  /**
   * @param {!proto.org.couchers.api.search.UserSearchReq} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.search.UserSearchRes.deserializeBinary
);

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.search.UserSearchReq,
 *   !proto.org.couchers.api.search.UserSearchRes>}
 */
const methodInfo_Search_UserSearch = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.search.UserSearchRes,
  /**
   * @param {!proto.org.couchers.api.search.UserSearchReq} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.search.UserSearchRes.deserializeBinary
);

/**
 * @param {!proto.org.couchers.api.search.UserSearchReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.search.UserSearchRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.search.UserSearchRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.search.SearchClient.prototype.userSearch = function (
  request,
  metadata,
  callback
) {
  return this.client_.rpcCall(
    this.hostname_ + "/org.couchers.api.search.Search/UserSearch",
    request,
    metadata || {},
    methodDescriptor_Search_UserSearch,
    callback
  );
};

/**
 * @param {!proto.org.couchers.api.search.UserSearchReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.search.UserSearchRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.search.SearchPromiseClient.prototype.userSearch =
  function (request, metadata) {
    return this.client_.unaryCall(
      this.hostname_ + "/org.couchers.api.search.Search/UserSearch",
      request,
      metadata || {},
      methodDescriptor_Search_UserSearch
    );
  };

module.exports = proto.org.couchers.api.search;
