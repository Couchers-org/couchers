/**
 * @fileoverview gRPC-Web generated client stub for org.couchers.api.requests
 * @enhanceable
 * @public
 */

// GENERATED CODE -- DO NOT EDIT!

/* eslint-disable */
// @ts-nocheck

const grpc = {};
grpc.web = require("grpc-web");

var google_protobuf_timestamp_pb = require("google-protobuf/google/protobuf/timestamp_pb.js");

var google_protobuf_empty_pb = require("google-protobuf/google/protobuf/empty_pb.js");

var pb_conversations_pb = require("../pb/conversations_pb.js");
const proto = {};
proto.org = {};
proto.org.couchers = {};
proto.org.couchers.api = {};
proto.org.couchers.api.requests = require("./requests_pb.js");

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.org.couchers.api.requests.RequestsClient = function (
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
proto.org.couchers.api.requests.RequestsPromiseClient = function (
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
 *   !proto.org.couchers.api.requests.CreateHostRequestReq,
 *   !proto.org.couchers.api.requests.CreateHostRequestRes>}
 */
const methodDescriptor_Requests_CreateHostRequest =
  new grpc.web.MethodDescriptor(
    "/org.couchers.api.requests.Requests/CreateHostRequest",
    grpc.web.MethodType.UNARY,
    proto.org.couchers.api.requests.CreateHostRequestReq,
    proto.org.couchers.api.requests.CreateHostRequestRes,
    /**
     * @param {!proto.org.couchers.api.requests.CreateHostRequestReq} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    proto.org.couchers.api.requests.CreateHostRequestRes.deserializeBinary
  );

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.requests.CreateHostRequestReq,
 *   !proto.org.couchers.api.requests.CreateHostRequestRes>}
 */
const methodInfo_Requests_CreateHostRequest =
  new grpc.web.AbstractClientBase.MethodInfo(
    proto.org.couchers.api.requests.CreateHostRequestRes,
    /**
     * @param {!proto.org.couchers.api.requests.CreateHostRequestReq} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    proto.org.couchers.api.requests.CreateHostRequestRes.deserializeBinary
  );

/**
 * @param {!proto.org.couchers.api.requests.CreateHostRequestReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.requests.CreateHostRequestRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.requests.CreateHostRequestRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.requests.RequestsClient.prototype.createHostRequest =
  function (request, metadata, callback) {
    return this.client_.rpcCall(
      this.hostname_ + "/org.couchers.api.requests.Requests/CreateHostRequest",
      request,
      metadata || {},
      methodDescriptor_Requests_CreateHostRequest,
      callback
    );
  };

/**
 * @param {!proto.org.couchers.api.requests.CreateHostRequestReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.requests.CreateHostRequestRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.requests.RequestsPromiseClient.prototype.createHostRequest =
  function (request, metadata) {
    return this.client_.unaryCall(
      this.hostname_ + "/org.couchers.api.requests.Requests/CreateHostRequest",
      request,
      metadata || {},
      methodDescriptor_Requests_CreateHostRequest
    );
  };

/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.requests.GetHostRequestReq,
 *   !proto.org.couchers.api.requests.HostRequest>}
 */
const methodDescriptor_Requests_GetHostRequest = new grpc.web.MethodDescriptor(
  "/org.couchers.api.requests.Requests/GetHostRequest",
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.requests.GetHostRequestReq,
  proto.org.couchers.api.requests.HostRequest,
  /**
   * @param {!proto.org.couchers.api.requests.GetHostRequestReq} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.requests.HostRequest.deserializeBinary
);

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.requests.GetHostRequestReq,
 *   !proto.org.couchers.api.requests.HostRequest>}
 */
const methodInfo_Requests_GetHostRequest =
  new grpc.web.AbstractClientBase.MethodInfo(
    proto.org.couchers.api.requests.HostRequest,
    /**
     * @param {!proto.org.couchers.api.requests.GetHostRequestReq} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    proto.org.couchers.api.requests.HostRequest.deserializeBinary
  );

/**
 * @param {!proto.org.couchers.api.requests.GetHostRequestReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.requests.HostRequest)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.requests.HostRequest>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.requests.RequestsClient.prototype.getHostRequest =
  function (request, metadata, callback) {
    return this.client_.rpcCall(
      this.hostname_ + "/org.couchers.api.requests.Requests/GetHostRequest",
      request,
      metadata || {},
      methodDescriptor_Requests_GetHostRequest,
      callback
    );
  };

/**
 * @param {!proto.org.couchers.api.requests.GetHostRequestReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.requests.HostRequest>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.requests.RequestsPromiseClient.prototype.getHostRequest =
  function (request, metadata) {
    return this.client_.unaryCall(
      this.hostname_ + "/org.couchers.api.requests.Requests/GetHostRequest",
      request,
      metadata || {},
      methodDescriptor_Requests_GetHostRequest
    );
  };

/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.requests.RespondHostRequestReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Requests_RespondHostRequest =
  new grpc.web.MethodDescriptor(
    "/org.couchers.api.requests.Requests/RespondHostRequest",
    grpc.web.MethodType.UNARY,
    proto.org.couchers.api.requests.RespondHostRequestReq,
    google_protobuf_empty_pb.Empty,
    /**
     * @param {!proto.org.couchers.api.requests.RespondHostRequestReq} request
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
 *   !proto.org.couchers.api.requests.RespondHostRequestReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Requests_RespondHostRequest =
  new grpc.web.AbstractClientBase.MethodInfo(
    google_protobuf_empty_pb.Empty,
    /**
     * @param {!proto.org.couchers.api.requests.RespondHostRequestReq} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    google_protobuf_empty_pb.Empty.deserializeBinary
  );

/**
 * @param {!proto.org.couchers.api.requests.RespondHostRequestReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.requests.RequestsClient.prototype.respondHostRequest =
  function (request, metadata, callback) {
    return this.client_.rpcCall(
      this.hostname_ + "/org.couchers.api.requests.Requests/RespondHostRequest",
      request,
      metadata || {},
      methodDescriptor_Requests_RespondHostRequest,
      callback
    );
  };

/**
 * @param {!proto.org.couchers.api.requests.RespondHostRequestReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.requests.RequestsPromiseClient.prototype.respondHostRequest =
  function (request, metadata) {
    return this.client_.unaryCall(
      this.hostname_ + "/org.couchers.api.requests.Requests/RespondHostRequest",
      request,
      metadata || {},
      methodDescriptor_Requests_RespondHostRequest
    );
  };

/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.requests.ListHostRequestsReq,
 *   !proto.org.couchers.api.requests.ListHostRequestsRes>}
 */
const methodDescriptor_Requests_ListHostRequests =
  new grpc.web.MethodDescriptor(
    "/org.couchers.api.requests.Requests/ListHostRequests",
    grpc.web.MethodType.UNARY,
    proto.org.couchers.api.requests.ListHostRequestsReq,
    proto.org.couchers.api.requests.ListHostRequestsRes,
    /**
     * @param {!proto.org.couchers.api.requests.ListHostRequestsReq} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    proto.org.couchers.api.requests.ListHostRequestsRes.deserializeBinary
  );

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.requests.ListHostRequestsReq,
 *   !proto.org.couchers.api.requests.ListHostRequestsRes>}
 */
const methodInfo_Requests_ListHostRequests =
  new grpc.web.AbstractClientBase.MethodInfo(
    proto.org.couchers.api.requests.ListHostRequestsRes,
    /**
     * @param {!proto.org.couchers.api.requests.ListHostRequestsReq} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    proto.org.couchers.api.requests.ListHostRequestsRes.deserializeBinary
  );

/**
 * @param {!proto.org.couchers.api.requests.ListHostRequestsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.requests.ListHostRequestsRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.requests.ListHostRequestsRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.requests.RequestsClient.prototype.listHostRequests =
  function (request, metadata, callback) {
    return this.client_.rpcCall(
      this.hostname_ + "/org.couchers.api.requests.Requests/ListHostRequests",
      request,
      metadata || {},
      methodDescriptor_Requests_ListHostRequests,
      callback
    );
  };

/**
 * @param {!proto.org.couchers.api.requests.ListHostRequestsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.requests.ListHostRequestsRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.requests.RequestsPromiseClient.prototype.listHostRequests =
  function (request, metadata) {
    return this.client_.unaryCall(
      this.hostname_ + "/org.couchers.api.requests.Requests/ListHostRequests",
      request,
      metadata || {},
      methodDescriptor_Requests_ListHostRequests
    );
  };

/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.requests.GetHostRequestMessagesReq,
 *   !proto.org.couchers.api.requests.GetHostRequestMessagesRes>}
 */
const methodDescriptor_Requests_GetHostRequestMessages =
  new grpc.web.MethodDescriptor(
    "/org.couchers.api.requests.Requests/GetHostRequestMessages",
    grpc.web.MethodType.UNARY,
    proto.org.couchers.api.requests.GetHostRequestMessagesReq,
    proto.org.couchers.api.requests.GetHostRequestMessagesRes,
    /**
     * @param {!proto.org.couchers.api.requests.GetHostRequestMessagesReq} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    proto.org.couchers.api.requests.GetHostRequestMessagesRes.deserializeBinary
  );

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.requests.GetHostRequestMessagesReq,
 *   !proto.org.couchers.api.requests.GetHostRequestMessagesRes>}
 */
const methodInfo_Requests_GetHostRequestMessages =
  new grpc.web.AbstractClientBase.MethodInfo(
    proto.org.couchers.api.requests.GetHostRequestMessagesRes,
    /**
     * @param {!proto.org.couchers.api.requests.GetHostRequestMessagesReq} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    proto.org.couchers.api.requests.GetHostRequestMessagesRes.deserializeBinary
  );

/**
 * @param {!proto.org.couchers.api.requests.GetHostRequestMessagesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.requests.GetHostRequestMessagesRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.requests.GetHostRequestMessagesRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.requests.RequestsClient.prototype.getHostRequestMessages =
  function (request, metadata, callback) {
    return this.client_.rpcCall(
      this.hostname_ +
        "/org.couchers.api.requests.Requests/GetHostRequestMessages",
      request,
      metadata || {},
      methodDescriptor_Requests_GetHostRequestMessages,
      callback
    );
  };

/**
 * @param {!proto.org.couchers.api.requests.GetHostRequestMessagesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.requests.GetHostRequestMessagesRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.requests.RequestsPromiseClient.prototype.getHostRequestMessages =
  function (request, metadata) {
    return this.client_.unaryCall(
      this.hostname_ +
        "/org.couchers.api.requests.Requests/GetHostRequestMessages",
      request,
      metadata || {},
      methodDescriptor_Requests_GetHostRequestMessages
    );
  };

/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.requests.SendHostRequestMessageReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Requests_SendHostRequestMessage =
  new grpc.web.MethodDescriptor(
    "/org.couchers.api.requests.Requests/SendHostRequestMessage",
    grpc.web.MethodType.UNARY,
    proto.org.couchers.api.requests.SendHostRequestMessageReq,
    google_protobuf_empty_pb.Empty,
    /**
     * @param {!proto.org.couchers.api.requests.SendHostRequestMessageReq} request
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
 *   !proto.org.couchers.api.requests.SendHostRequestMessageReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Requests_SendHostRequestMessage =
  new grpc.web.AbstractClientBase.MethodInfo(
    google_protobuf_empty_pb.Empty,
    /**
     * @param {!proto.org.couchers.api.requests.SendHostRequestMessageReq} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    google_protobuf_empty_pb.Empty.deserializeBinary
  );

/**
 * @param {!proto.org.couchers.api.requests.SendHostRequestMessageReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.requests.RequestsClient.prototype.sendHostRequestMessage =
  function (request, metadata, callback) {
    return this.client_.rpcCall(
      this.hostname_ +
        "/org.couchers.api.requests.Requests/SendHostRequestMessage",
      request,
      metadata || {},
      methodDescriptor_Requests_SendHostRequestMessage,
      callback
    );
  };

/**
 * @param {!proto.org.couchers.api.requests.SendHostRequestMessageReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.requests.RequestsPromiseClient.prototype.sendHostRequestMessage =
  function (request, metadata) {
    return this.client_.unaryCall(
      this.hostname_ +
        "/org.couchers.api.requests.Requests/SendHostRequestMessage",
      request,
      metadata || {},
      methodDescriptor_Requests_SendHostRequestMessage
    );
  };

/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.requests.GetHostRequestUpdatesReq,
 *   !proto.org.couchers.api.requests.GetHostRequestUpdatesRes>}
 */
const methodDescriptor_Requests_GetHostRequestUpdates =
  new grpc.web.MethodDescriptor(
    "/org.couchers.api.requests.Requests/GetHostRequestUpdates",
    grpc.web.MethodType.UNARY,
    proto.org.couchers.api.requests.GetHostRequestUpdatesReq,
    proto.org.couchers.api.requests.GetHostRequestUpdatesRes,
    /**
     * @param {!proto.org.couchers.api.requests.GetHostRequestUpdatesReq} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    proto.org.couchers.api.requests.GetHostRequestUpdatesRes.deserializeBinary
  );

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.requests.GetHostRequestUpdatesReq,
 *   !proto.org.couchers.api.requests.GetHostRequestUpdatesRes>}
 */
const methodInfo_Requests_GetHostRequestUpdates =
  new grpc.web.AbstractClientBase.MethodInfo(
    proto.org.couchers.api.requests.GetHostRequestUpdatesRes,
    /**
     * @param {!proto.org.couchers.api.requests.GetHostRequestUpdatesReq} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    proto.org.couchers.api.requests.GetHostRequestUpdatesRes.deserializeBinary
  );

/**
 * @param {!proto.org.couchers.api.requests.GetHostRequestUpdatesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.requests.GetHostRequestUpdatesRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.requests.GetHostRequestUpdatesRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.requests.RequestsClient.prototype.getHostRequestUpdates =
  function (request, metadata, callback) {
    return this.client_.rpcCall(
      this.hostname_ +
        "/org.couchers.api.requests.Requests/GetHostRequestUpdates",
      request,
      metadata || {},
      methodDescriptor_Requests_GetHostRequestUpdates,
      callback
    );
  };

/**
 * @param {!proto.org.couchers.api.requests.GetHostRequestUpdatesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.requests.GetHostRequestUpdatesRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.requests.RequestsPromiseClient.prototype.getHostRequestUpdates =
  function (request, metadata) {
    return this.client_.unaryCall(
      this.hostname_ +
        "/org.couchers.api.requests.Requests/GetHostRequestUpdates",
      request,
      metadata || {},
      methodDescriptor_Requests_GetHostRequestUpdates
    );
  };

/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.requests.MarkLastSeenHostRequestReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Requests_MarkLastSeenHostRequest =
  new grpc.web.MethodDescriptor(
    "/org.couchers.api.requests.Requests/MarkLastSeenHostRequest",
    grpc.web.MethodType.UNARY,
    proto.org.couchers.api.requests.MarkLastSeenHostRequestReq,
    google_protobuf_empty_pb.Empty,
    /**
     * @param {!proto.org.couchers.api.requests.MarkLastSeenHostRequestReq} request
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
 *   !proto.org.couchers.api.requests.MarkLastSeenHostRequestReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Requests_MarkLastSeenHostRequest =
  new grpc.web.AbstractClientBase.MethodInfo(
    google_protobuf_empty_pb.Empty,
    /**
     * @param {!proto.org.couchers.api.requests.MarkLastSeenHostRequestReq} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    google_protobuf_empty_pb.Empty.deserializeBinary
  );

/**
 * @param {!proto.org.couchers.api.requests.MarkLastSeenHostRequestReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.requests.RequestsClient.prototype.markLastSeenHostRequest =
  function (request, metadata, callback) {
    return this.client_.rpcCall(
      this.hostname_ +
        "/org.couchers.api.requests.Requests/MarkLastSeenHostRequest",
      request,
      metadata || {},
      methodDescriptor_Requests_MarkLastSeenHostRequest,
      callback
    );
  };

/**
 * @param {!proto.org.couchers.api.requests.MarkLastSeenHostRequestReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.requests.RequestsPromiseClient.prototype.markLastSeenHostRequest =
  function (request, metadata) {
    return this.client_.unaryCall(
      this.hostname_ +
        "/org.couchers.api.requests.Requests/MarkLastSeenHostRequest",
      request,
      metadata || {},
      methodDescriptor_Requests_MarkLastSeenHostRequest
    );
  };

module.exports = proto.org.couchers.api.requests;
