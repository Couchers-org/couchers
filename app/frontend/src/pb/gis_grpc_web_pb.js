/**
 * @fileoverview gRPC-Web generated client stub for org.couchers.json
 * @enhanceable
 * @public
 */

// GENERATED CODE -- DO NOT EDIT!

/* eslint-disable */
// @ts-nocheck

const grpc = {};
grpc.web = require("grpc-web");

var google_protobuf_empty_pb = require("google-protobuf/google/protobuf/empty_pb.js");

var pb_google_api_annotations_pb = require("../pb/google/api/annotations_pb.js");

var pb_google_api_httpbody_pb = require("../pb/google/api/httpbody_pb.js");
const proto = {};
proto.org = {};
proto.org.couchers = {};
proto.org.couchers.json = require("./gis_pb.js");

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.org.couchers.json.GISClient = function (hostname, credentials, options) {
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
proto.org.couchers.json.GISPromiseClient = function (
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
 *   !proto.google.api.HttpBody>}
 */
const methodDescriptor_GIS_GetUsers = new grpc.web.MethodDescriptor(
  "/org.couchers.json.GIS/GetUsers",
  grpc.web.MethodType.UNARY,
  google_protobuf_empty_pb.Empty,
  pb_google_api_httpbody_pb.HttpBody,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  pb_google_api_httpbody_pb.HttpBody.deserializeBinary
);

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.google.protobuf.Empty,
 *   !proto.google.api.HttpBody>}
 */
const methodInfo_GIS_GetUsers = new grpc.web.AbstractClientBase.MethodInfo(
  pb_google_api_httpbody_pb.HttpBody,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  pb_google_api_httpbody_pb.HttpBody.deserializeBinary
);

/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.api.HttpBody)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.api.HttpBody>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.json.GISClient.prototype.getUsers = function (
  request,
  metadata,
  callback
) {
  return this.client_.rpcCall(
    this.hostname_ + "/org.couchers.json.GIS/GetUsers",
    request,
    metadata || {},
    methodDescriptor_GIS_GetUsers,
    callback
  );
};

/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.api.HttpBody>}
 *     Promise that resolves to the response
 */
proto.org.couchers.json.GISPromiseClient.prototype.getUsers = function (
  request,
  metadata
) {
  return this.client_.unaryCall(
    this.hostname_ + "/org.couchers.json.GIS/GetUsers",
    request,
    metadata || {},
    methodDescriptor_GIS_GetUsers
  );
};

/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.google.protobuf.Empty,
 *   !proto.google.api.HttpBody>}
 */
const methodDescriptor_GIS_GetCommunities = new grpc.web.MethodDescriptor(
  "/org.couchers.json.GIS/GetCommunities",
  grpc.web.MethodType.UNARY,
  google_protobuf_empty_pb.Empty,
  pb_google_api_httpbody_pb.HttpBody,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  pb_google_api_httpbody_pb.HttpBody.deserializeBinary
);

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.google.protobuf.Empty,
 *   !proto.google.api.HttpBody>}
 */
const methodInfo_GIS_GetCommunities =
  new grpc.web.AbstractClientBase.MethodInfo(
    pb_google_api_httpbody_pb.HttpBody,
    /**
     * @param {!proto.google.protobuf.Empty} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    pb_google_api_httpbody_pb.HttpBody.deserializeBinary
  );

/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.api.HttpBody)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.api.HttpBody>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.json.GISClient.prototype.getCommunities = function (
  request,
  metadata,
  callback
) {
  return this.client_.rpcCall(
    this.hostname_ + "/org.couchers.json.GIS/GetCommunities",
    request,
    metadata || {},
    methodDescriptor_GIS_GetCommunities,
    callback
  );
};

/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.api.HttpBody>}
 *     Promise that resolves to the response
 */
proto.org.couchers.json.GISPromiseClient.prototype.getCommunities = function (
  request,
  metadata
) {
  return this.client_.unaryCall(
    this.hostname_ + "/org.couchers.json.GIS/GetCommunities",
    request,
    metadata || {},
    methodDescriptor_GIS_GetCommunities
  );
};

/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.google.protobuf.Empty,
 *   !proto.google.api.HttpBody>}
 */
const methodDescriptor_GIS_GetPlaces = new grpc.web.MethodDescriptor(
  "/org.couchers.json.GIS/GetPlaces",
  grpc.web.MethodType.UNARY,
  google_protobuf_empty_pb.Empty,
  pb_google_api_httpbody_pb.HttpBody,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  pb_google_api_httpbody_pb.HttpBody.deserializeBinary
);

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.google.protobuf.Empty,
 *   !proto.google.api.HttpBody>}
 */
const methodInfo_GIS_GetPlaces = new grpc.web.AbstractClientBase.MethodInfo(
  pb_google_api_httpbody_pb.HttpBody,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  pb_google_api_httpbody_pb.HttpBody.deserializeBinary
);

/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.api.HttpBody)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.api.HttpBody>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.json.GISClient.prototype.getPlaces = function (
  request,
  metadata,
  callback
) {
  return this.client_.rpcCall(
    this.hostname_ + "/org.couchers.json.GIS/GetPlaces",
    request,
    metadata || {},
    methodDescriptor_GIS_GetPlaces,
    callback
  );
};

/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.api.HttpBody>}
 *     Promise that resolves to the response
 */
proto.org.couchers.json.GISPromiseClient.prototype.getPlaces = function (
  request,
  metadata
) {
  return this.client_.unaryCall(
    this.hostname_ + "/org.couchers.json.GIS/GetPlaces",
    request,
    metadata || {},
    methodDescriptor_GIS_GetPlaces
  );
};

/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.google.protobuf.Empty,
 *   !proto.google.api.HttpBody>}
 */
const methodDescriptor_GIS_GetGuides = new grpc.web.MethodDescriptor(
  "/org.couchers.json.GIS/GetGuides",
  grpc.web.MethodType.UNARY,
  google_protobuf_empty_pb.Empty,
  pb_google_api_httpbody_pb.HttpBody,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  pb_google_api_httpbody_pb.HttpBody.deserializeBinary
);

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.google.protobuf.Empty,
 *   !proto.google.api.HttpBody>}
 */
const methodInfo_GIS_GetGuides = new grpc.web.AbstractClientBase.MethodInfo(
  pb_google_api_httpbody_pb.HttpBody,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  pb_google_api_httpbody_pb.HttpBody.deserializeBinary
);

/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.api.HttpBody)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.api.HttpBody>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.json.GISClient.prototype.getGuides = function (
  request,
  metadata,
  callback
) {
  return this.client_.rpcCall(
    this.hostname_ + "/org.couchers.json.GIS/GetGuides",
    request,
    metadata || {},
    methodDescriptor_GIS_GetGuides,
    callback
  );
};

/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.api.HttpBody>}
 *     Promise that resolves to the response
 */
proto.org.couchers.json.GISPromiseClient.prototype.getGuides = function (
  request,
  metadata
) {
  return this.client_.unaryCall(
    this.hostname_ + "/org.couchers.json.GIS/GetGuides",
    request,
    metadata || {},
    methodDescriptor_GIS_GetGuides
  );
};

module.exports = proto.org.couchers.json;
