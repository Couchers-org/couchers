/**
 * @fileoverview gRPC-Web generated client stub for org.couchers.resources
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
proto.org.couchers.resources = require("./resources_pb.js");

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.org.couchers.resources.ResourcesClient = function (
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
proto.org.couchers.resources.ResourcesPromiseClient = function (
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
 *   !proto.org.couchers.resources.GetTermsOfServiceRes>}
 */
const methodDescriptor_Resources_GetTermsOfService =
  new grpc.web.MethodDescriptor(
    "/org.couchers.resources.Resources/GetTermsOfService",
    grpc.web.MethodType.UNARY,
    google_protobuf_empty_pb.Empty,
    proto.org.couchers.resources.GetTermsOfServiceRes,
    /**
     * @param {!proto.google.protobuf.Empty} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    proto.org.couchers.resources.GetTermsOfServiceRes.deserializeBinary
  );

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.google.protobuf.Empty,
 *   !proto.org.couchers.resources.GetTermsOfServiceRes>}
 */
const methodInfo_Resources_GetTermsOfService =
  new grpc.web.AbstractClientBase.MethodInfo(
    proto.org.couchers.resources.GetTermsOfServiceRes,
    /**
     * @param {!proto.google.protobuf.Empty} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    proto.org.couchers.resources.GetTermsOfServiceRes.deserializeBinary
  );

/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.resources.GetTermsOfServiceRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.resources.GetTermsOfServiceRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.resources.ResourcesClient.prototype.getTermsOfService =
  function (request, metadata, callback) {
    return this.client_.rpcCall(
      this.hostname_ + "/org.couchers.resources.Resources/GetTermsOfService",
      request,
      metadata || {},
      methodDescriptor_Resources_GetTermsOfService,
      callback
    );
  };

/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.resources.GetTermsOfServiceRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.resources.ResourcesPromiseClient.prototype.getTermsOfService =
  function (request, metadata) {
    return this.client_.unaryCall(
      this.hostname_ + "/org.couchers.resources.Resources/GetTermsOfService",
      request,
      metadata || {},
      methodDescriptor_Resources_GetTermsOfService
    );
  };

/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.google.protobuf.Empty,
 *   !proto.org.couchers.resources.GetRegionsRes>}
 */
const methodDescriptor_Resources_GetRegions = new grpc.web.MethodDescriptor(
  "/org.couchers.resources.Resources/GetRegions",
  grpc.web.MethodType.UNARY,
  google_protobuf_empty_pb.Empty,
  proto.org.couchers.resources.GetRegionsRes,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  proto.org.couchers.resources.GetRegionsRes.deserializeBinary
);

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.google.protobuf.Empty,
 *   !proto.org.couchers.resources.GetRegionsRes>}
 */
const methodInfo_Resources_GetRegions =
  new grpc.web.AbstractClientBase.MethodInfo(
    proto.org.couchers.resources.GetRegionsRes,
    /**
     * @param {!proto.google.protobuf.Empty} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    proto.org.couchers.resources.GetRegionsRes.deserializeBinary
  );

/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.resources.GetRegionsRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.resources.GetRegionsRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.resources.ResourcesClient.prototype.getRegions = function (
  request,
  metadata,
  callback
) {
  return this.client_.rpcCall(
    this.hostname_ + "/org.couchers.resources.Resources/GetRegions",
    request,
    metadata || {},
    methodDescriptor_Resources_GetRegions,
    callback
  );
};

/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.resources.GetRegionsRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.resources.ResourcesPromiseClient.prototype.getRegions =
  function (request, metadata) {
    return this.client_.unaryCall(
      this.hostname_ + "/org.couchers.resources.Resources/GetRegions",
      request,
      metadata || {},
      methodDescriptor_Resources_GetRegions
    );
  };

/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.google.protobuf.Empty,
 *   !proto.org.couchers.resources.GetLanguagesRes>}
 */
const methodDescriptor_Resources_GetLanguages = new grpc.web.MethodDescriptor(
  "/org.couchers.resources.Resources/GetLanguages",
  grpc.web.MethodType.UNARY,
  google_protobuf_empty_pb.Empty,
  proto.org.couchers.resources.GetLanguagesRes,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  proto.org.couchers.resources.GetLanguagesRes.deserializeBinary
);

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.google.protobuf.Empty,
 *   !proto.org.couchers.resources.GetLanguagesRes>}
 */
const methodInfo_Resources_GetLanguages =
  new grpc.web.AbstractClientBase.MethodInfo(
    proto.org.couchers.resources.GetLanguagesRes,
    /**
     * @param {!proto.google.protobuf.Empty} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    proto.org.couchers.resources.GetLanguagesRes.deserializeBinary
  );

/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.resources.GetLanguagesRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.resources.GetLanguagesRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.resources.ResourcesClient.prototype.getLanguages = function (
  request,
  metadata,
  callback
) {
  return this.client_.rpcCall(
    this.hostname_ + "/org.couchers.resources.Resources/GetLanguages",
    request,
    metadata || {},
    methodDescriptor_Resources_GetLanguages,
    callback
  );
};

/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.resources.GetLanguagesRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.resources.ResourcesPromiseClient.prototype.getLanguages =
  function (request, metadata) {
    return this.client_.unaryCall(
      this.hostname_ + "/org.couchers.resources.Resources/GetLanguages",
      request,
      metadata || {},
      methodDescriptor_Resources_GetLanguages
    );
  };

module.exports = proto.org.couchers.resources;
