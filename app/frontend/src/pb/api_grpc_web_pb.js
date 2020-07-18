/**
 * @fileoverview gRPC-Web generated client stub for api
 * @enhanceable
 * @public
 */

// GENERATED CODE -- DO NOT EDIT!


/* eslint-disable */
// @ts-nocheck



const grpc = {};
grpc.web = require('grpc-web');


var google_protobuf_timestamp_pb = require('google-protobuf/google/protobuf/timestamp_pb.js')

var google_protobuf_wrappers_pb = require('google-protobuf/google/protobuf/wrappers_pb.js')

var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js')
const proto = {};
proto.api = require('./api_pb.js');

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.api.APIClient =
    function(hostname, credentials, options) {
  if (!options) options = {};
  options['format'] = 'binary';

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
proto.api.APIPromiseClient =
    function(hostname, credentials, options) {
  if (!options) options = {};
  options['format'] = 'binary';

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
 *   !proto.api.PingReq,
 *   !proto.api.PingRes>}
 */
const methodDescriptor_API_Ping = new grpc.web.MethodDescriptor(
  '/api.API/Ping',
  grpc.web.MethodType.UNARY,
  proto.api.PingReq,
  proto.api.PingRes,
  /**
   * @param {!proto.api.PingReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.api.PingRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.api.PingReq,
 *   !proto.api.PingRes>}
 */
const methodInfo_API_Ping = new grpc.web.AbstractClientBase.MethodInfo(
  proto.api.PingRes,
  /**
   * @param {!proto.api.PingReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.api.PingRes.deserializeBinary
);


/**
 * @param {!proto.api.PingReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.api.PingRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.api.PingRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.api.APIClient.prototype.ping =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/api.API/Ping',
      request,
      metadata || {},
      methodDescriptor_API_Ping,
      callback);
};


/**
 * @param {!proto.api.PingReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.api.PingRes>}
 *     A native promise that resolves to the response
 */
proto.api.APIPromiseClient.prototype.ping =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/api.API/Ping',
      request,
      metadata || {},
      methodDescriptor_API_Ping);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.api.GetUserReq,
 *   !proto.api.User>}
 */
const methodDescriptor_API_GetUser = new grpc.web.MethodDescriptor(
  '/api.API/GetUser',
  grpc.web.MethodType.UNARY,
  proto.api.GetUserReq,
  proto.api.User,
  /**
   * @param {!proto.api.GetUserReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.api.User.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.api.GetUserReq,
 *   !proto.api.User>}
 */
const methodInfo_API_GetUser = new grpc.web.AbstractClientBase.MethodInfo(
  proto.api.User,
  /**
   * @param {!proto.api.GetUserReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.api.User.deserializeBinary
);


/**
 * @param {!proto.api.GetUserReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.api.User)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.api.User>|undefined}
 *     The XHR Node Readable Stream
 */
proto.api.APIClient.prototype.getUser =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/api.API/GetUser',
      request,
      metadata || {},
      methodDescriptor_API_GetUser,
      callback);
};


/**
 * @param {!proto.api.GetUserReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.api.User>}
 *     A native promise that resolves to the response
 */
proto.api.APIPromiseClient.prototype.getUser =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/api.API/GetUser',
      request,
      metadata || {},
      methodDescriptor_API_GetUser);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.api.UpdateProfileReq,
 *   !proto.api.UpdateProfileRes>}
 */
const methodDescriptor_API_UpdateProfile = new grpc.web.MethodDescriptor(
  '/api.API/UpdateProfile',
  grpc.web.MethodType.UNARY,
  proto.api.UpdateProfileReq,
  proto.api.UpdateProfileRes,
  /**
   * @param {!proto.api.UpdateProfileReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.api.UpdateProfileRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.api.UpdateProfileReq,
 *   !proto.api.UpdateProfileRes>}
 */
const methodInfo_API_UpdateProfile = new grpc.web.AbstractClientBase.MethodInfo(
  proto.api.UpdateProfileRes,
  /**
   * @param {!proto.api.UpdateProfileReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.api.UpdateProfileRes.deserializeBinary
);


/**
 * @param {!proto.api.UpdateProfileReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.api.UpdateProfileRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.api.UpdateProfileRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.api.APIClient.prototype.updateProfile =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/api.API/UpdateProfile',
      request,
      metadata || {},
      methodDescriptor_API_UpdateProfile,
      callback);
};


/**
 * @param {!proto.api.UpdateProfileReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.api.UpdateProfileRes>}
 *     A native promise that resolves to the response
 */
proto.api.APIPromiseClient.prototype.updateProfile =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/api.API/UpdateProfile',
      request,
      metadata || {},
      methodDescriptor_API_UpdateProfile);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.api.SendFriendRequestReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_API_SendFriendRequest = new grpc.web.MethodDescriptor(
  '/api.API/SendFriendRequest',
  grpc.web.MethodType.UNARY,
  proto.api.SendFriendRequestReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.api.SendFriendRequestReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.api.SendFriendRequestReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_API_SendFriendRequest = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.api.SendFriendRequestReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.api.SendFriendRequestReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.api.APIClient.prototype.sendFriendRequest =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/api.API/SendFriendRequest',
      request,
      metadata || {},
      methodDescriptor_API_SendFriendRequest,
      callback);
};


/**
 * @param {!proto.api.SendFriendRequestReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.api.APIPromiseClient.prototype.sendFriendRequest =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/api.API/SendFriendRequest',
      request,
      metadata || {},
      methodDescriptor_API_SendFriendRequest);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.google.protobuf.Empty,
 *   !proto.api.ListFriendRequestsRes>}
 */
const methodDescriptor_API_ListFriendRequests = new grpc.web.MethodDescriptor(
  '/api.API/ListFriendRequests',
  grpc.web.MethodType.UNARY,
  google_protobuf_empty_pb.Empty,
  proto.api.ListFriendRequestsRes,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.api.ListFriendRequestsRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.google.protobuf.Empty,
 *   !proto.api.ListFriendRequestsRes>}
 */
const methodInfo_API_ListFriendRequests = new grpc.web.AbstractClientBase.MethodInfo(
  proto.api.ListFriendRequestsRes,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.api.ListFriendRequestsRes.deserializeBinary
);


/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.api.ListFriendRequestsRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.api.ListFriendRequestsRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.api.APIClient.prototype.listFriendRequests =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/api.API/ListFriendRequests',
      request,
      metadata || {},
      methodDescriptor_API_ListFriendRequests,
      callback);
};


/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.api.ListFriendRequestsRes>}
 *     A native promise that resolves to the response
 */
proto.api.APIPromiseClient.prototype.listFriendRequests =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/api.API/ListFriendRequests',
      request,
      metadata || {},
      methodDescriptor_API_ListFriendRequests);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.google.protobuf.Empty,
 *   !proto.api.ListFriendsRes>}
 */
const methodDescriptor_API_ListFriends = new grpc.web.MethodDescriptor(
  '/api.API/ListFriends',
  grpc.web.MethodType.UNARY,
  google_protobuf_empty_pb.Empty,
  proto.api.ListFriendsRes,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.api.ListFriendsRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.google.protobuf.Empty,
 *   !proto.api.ListFriendsRes>}
 */
const methodInfo_API_ListFriends = new grpc.web.AbstractClientBase.MethodInfo(
  proto.api.ListFriendsRes,
  /**
   * @param {!proto.google.protobuf.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.api.ListFriendsRes.deserializeBinary
);


/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.api.ListFriendsRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.api.ListFriendsRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.api.APIClient.prototype.listFriends =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/api.API/ListFriends',
      request,
      metadata || {},
      methodDescriptor_API_ListFriends,
      callback);
};


/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.api.ListFriendsRes>}
 *     A native promise that resolves to the response
 */
proto.api.APIPromiseClient.prototype.listFriends =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/api.API/ListFriends',
      request,
      metadata || {},
      methodDescriptor_API_ListFriends);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.api.RespondFriendRequestReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_API_RespondFriendRequest = new grpc.web.MethodDescriptor(
  '/api.API/RespondFriendRequest',
  grpc.web.MethodType.UNARY,
  proto.api.RespondFriendRequestReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.api.RespondFriendRequestReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.api.RespondFriendRequestReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_API_RespondFriendRequest = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.api.RespondFriendRequestReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.api.RespondFriendRequestReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.api.APIClient.prototype.respondFriendRequest =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/api.API/RespondFriendRequest',
      request,
      metadata || {},
      methodDescriptor_API_RespondFriendRequest,
      callback);
};


/**
 * @param {!proto.api.RespondFriendRequestReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.api.APIPromiseClient.prototype.respondFriendRequest =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/api.API/RespondFriendRequest',
      request,
      metadata || {},
      methodDescriptor_API_RespondFriendRequest);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.api.CancelFriendRequestReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_API_CancelFriendRequest = new grpc.web.MethodDescriptor(
  '/api.API/CancelFriendRequest',
  grpc.web.MethodType.UNARY,
  proto.api.CancelFriendRequestReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.api.CancelFriendRequestReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.api.CancelFriendRequestReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_API_CancelFriendRequest = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.api.CancelFriendRequestReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.api.CancelFriendRequestReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.api.APIClient.prototype.cancelFriendRequest =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/api.API/CancelFriendRequest',
      request,
      metadata || {},
      methodDescriptor_API_CancelFriendRequest,
      callback);
};


/**
 * @param {!proto.api.CancelFriendRequestReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.api.APIPromiseClient.prototype.cancelFriendRequest =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/api.API/CancelFriendRequest',
      request,
      metadata || {},
      methodDescriptor_API_CancelFriendRequest);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.api.SSOReq,
 *   !proto.api.SSORes>}
 */
const methodDescriptor_API_SSO = new grpc.web.MethodDescriptor(
  '/api.API/SSO',
  grpc.web.MethodType.UNARY,
  proto.api.SSOReq,
  proto.api.SSORes,
  /**
   * @param {!proto.api.SSOReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.api.SSORes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.api.SSOReq,
 *   !proto.api.SSORes>}
 */
const methodInfo_API_SSO = new grpc.web.AbstractClientBase.MethodInfo(
  proto.api.SSORes,
  /**
   * @param {!proto.api.SSOReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.api.SSORes.deserializeBinary
);


/**
 * @param {!proto.api.SSOReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.api.SSORes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.api.SSORes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.api.APIClient.prototype.sSO =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/api.API/SSO',
      request,
      metadata || {},
      methodDescriptor_API_SSO,
      callback);
};


/**
 * @param {!proto.api.SSOReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.api.SSORes>}
 *     A native promise that resolves to the response
 */
proto.api.APIPromiseClient.prototype.sSO =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/api.API/SSO',
      request,
      metadata || {},
      methodDescriptor_API_SSO);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.api.SearchReq,
 *   !proto.api.SearchRes>}
 */
const methodDescriptor_API_Search = new grpc.web.MethodDescriptor(
  '/api.API/Search',
  grpc.web.MethodType.UNARY,
  proto.api.SearchReq,
  proto.api.SearchRes,
  /**
   * @param {!proto.api.SearchReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.api.SearchRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.api.SearchReq,
 *   !proto.api.SearchRes>}
 */
const methodInfo_API_Search = new grpc.web.AbstractClientBase.MethodInfo(
  proto.api.SearchRes,
  /**
   * @param {!proto.api.SearchReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.api.SearchRes.deserializeBinary
);


/**
 * @param {!proto.api.SearchReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.api.SearchRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.api.SearchRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.api.APIClient.prototype.search =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/api.API/Search',
      request,
      metadata || {},
      methodDescriptor_API_Search,
      callback);
};


/**
 * @param {!proto.api.SearchReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.api.SearchRes>}
 *     A native promise that resolves to the response
 */
proto.api.APIPromiseClient.prototype.search =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/api.API/Search',
      request,
      metadata || {},
      methodDescriptor_API_Search);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.api.ListMessageThreadsReq,
 *   !proto.api.ListMessageThreadsRes>}
 */
const methodDescriptor_API_ListMessageThreads = new grpc.web.MethodDescriptor(
  '/api.API/ListMessageThreads',
  grpc.web.MethodType.UNARY,
  proto.api.ListMessageThreadsReq,
  proto.api.ListMessageThreadsRes,
  /**
   * @param {!proto.api.ListMessageThreadsReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.api.ListMessageThreadsRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.api.ListMessageThreadsReq,
 *   !proto.api.ListMessageThreadsRes>}
 */
const methodInfo_API_ListMessageThreads = new grpc.web.AbstractClientBase.MethodInfo(
  proto.api.ListMessageThreadsRes,
  /**
   * @param {!proto.api.ListMessageThreadsReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.api.ListMessageThreadsRes.deserializeBinary
);


/**
 * @param {!proto.api.ListMessageThreadsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.api.ListMessageThreadsRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.api.ListMessageThreadsRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.api.APIClient.prototype.listMessageThreads =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/api.API/ListMessageThreads',
      request,
      metadata || {},
      methodDescriptor_API_ListMessageThreads,
      callback);
};


/**
 * @param {!proto.api.ListMessageThreadsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.api.ListMessageThreadsRes>}
 *     A native promise that resolves to the response
 */
proto.api.APIPromiseClient.prototype.listMessageThreads =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/api.API/ListMessageThreads',
      request,
      metadata || {},
      methodDescriptor_API_ListMessageThreads);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.api.EditMessageThreadStatusReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_API_EditMessageThreadStatus = new grpc.web.MethodDescriptor(
  '/api.API/EditMessageThreadStatus',
  grpc.web.MethodType.UNARY,
  proto.api.EditMessageThreadStatusReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.api.EditMessageThreadStatusReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.api.EditMessageThreadStatusReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_API_EditMessageThreadStatus = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.api.EditMessageThreadStatusReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.api.EditMessageThreadStatusReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.api.APIClient.prototype.editMessageThreadStatus =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/api.API/EditMessageThreadStatus',
      request,
      metadata || {},
      methodDescriptor_API_EditMessageThreadStatus,
      callback);
};


/**
 * @param {!proto.api.EditMessageThreadStatusReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.api.APIPromiseClient.prototype.editMessageThreadStatus =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/api.API/EditMessageThreadStatus',
      request,
      metadata || {},
      methodDescriptor_API_EditMessageThreadStatus);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.api.GetMessageThreadReq,
 *   !proto.api.GetMessageThreadRes>}
 */
const methodDescriptor_API_GetMessageThread = new grpc.web.MethodDescriptor(
  '/api.API/GetMessageThread',
  grpc.web.MethodType.UNARY,
  proto.api.GetMessageThreadReq,
  proto.api.GetMessageThreadRes,
  /**
   * @param {!proto.api.GetMessageThreadReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.api.GetMessageThreadRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.api.GetMessageThreadReq,
 *   !proto.api.GetMessageThreadRes>}
 */
const methodInfo_API_GetMessageThread = new grpc.web.AbstractClientBase.MethodInfo(
  proto.api.GetMessageThreadRes,
  /**
   * @param {!proto.api.GetMessageThreadReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.api.GetMessageThreadRes.deserializeBinary
);


/**
 * @param {!proto.api.GetMessageThreadReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.api.GetMessageThreadRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.api.GetMessageThreadRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.api.APIClient.prototype.getMessageThread =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/api.API/GetMessageThread',
      request,
      metadata || {},
      methodDescriptor_API_GetMessageThread,
      callback);
};


/**
 * @param {!proto.api.GetMessageThreadReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.api.GetMessageThreadRes>}
 *     A native promise that resolves to the response
 */
proto.api.APIPromiseClient.prototype.getMessageThread =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/api.API/GetMessageThread',
      request,
      metadata || {},
      methodDescriptor_API_GetMessageThread);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.api.GetMessageThreadInfoReq,
 *   !proto.api.GetMessageThreadInfoRes>}
 */
const methodDescriptor_API_GetMessageThreadInfo = new grpc.web.MethodDescriptor(
  '/api.API/GetMessageThreadInfo',
  grpc.web.MethodType.UNARY,
  proto.api.GetMessageThreadInfoReq,
  proto.api.GetMessageThreadInfoRes,
  /**
   * @param {!proto.api.GetMessageThreadInfoReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.api.GetMessageThreadInfoRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.api.GetMessageThreadInfoReq,
 *   !proto.api.GetMessageThreadInfoRes>}
 */
const methodInfo_API_GetMessageThreadInfo = new grpc.web.AbstractClientBase.MethodInfo(
  proto.api.GetMessageThreadInfoRes,
  /**
   * @param {!proto.api.GetMessageThreadInfoReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.api.GetMessageThreadInfoRes.deserializeBinary
);


/**
 * @param {!proto.api.GetMessageThreadInfoReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.api.GetMessageThreadInfoRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.api.GetMessageThreadInfoRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.api.APIClient.prototype.getMessageThreadInfo =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/api.API/GetMessageThreadInfo',
      request,
      metadata || {},
      methodDescriptor_API_GetMessageThreadInfo,
      callback);
};


/**
 * @param {!proto.api.GetMessageThreadInfoReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.api.GetMessageThreadInfoRes>}
 *     A native promise that resolves to the response
 */
proto.api.APIPromiseClient.prototype.getMessageThreadInfo =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/api.API/GetMessageThreadInfo',
      request,
      metadata || {},
      methodDescriptor_API_GetMessageThreadInfo);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.api.CreateMessageThreadReq,
 *   !proto.api.CreateMessageThreadRes>}
 */
const methodDescriptor_API_CreateMessageThread = new grpc.web.MethodDescriptor(
  '/api.API/CreateMessageThread',
  grpc.web.MethodType.UNARY,
  proto.api.CreateMessageThreadReq,
  proto.api.CreateMessageThreadRes,
  /**
   * @param {!proto.api.CreateMessageThreadReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.api.CreateMessageThreadRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.api.CreateMessageThreadReq,
 *   !proto.api.CreateMessageThreadRes>}
 */
const methodInfo_API_CreateMessageThread = new grpc.web.AbstractClientBase.MethodInfo(
  proto.api.CreateMessageThreadRes,
  /**
   * @param {!proto.api.CreateMessageThreadReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.api.CreateMessageThreadRes.deserializeBinary
);


/**
 * @param {!proto.api.CreateMessageThreadReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.api.CreateMessageThreadRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.api.CreateMessageThreadRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.api.APIClient.prototype.createMessageThread =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/api.API/CreateMessageThread',
      request,
      metadata || {},
      methodDescriptor_API_CreateMessageThread,
      callback);
};


/**
 * @param {!proto.api.CreateMessageThreadReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.api.CreateMessageThreadRes>}
 *     A native promise that resolves to the response
 */
proto.api.APIPromiseClient.prototype.createMessageThread =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/api.API/CreateMessageThread',
      request,
      metadata || {},
      methodDescriptor_API_CreateMessageThread);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.api.EditMessageThreadReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_API_EditMessageThread = new grpc.web.MethodDescriptor(
  '/api.API/EditMessageThread',
  grpc.web.MethodType.UNARY,
  proto.api.EditMessageThreadReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.api.EditMessageThreadReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.api.EditMessageThreadReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_API_EditMessageThread = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.api.EditMessageThreadReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.api.EditMessageThreadReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.api.APIClient.prototype.editMessageThread =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/api.API/EditMessageThread',
      request,
      metadata || {},
      methodDescriptor_API_EditMessageThread,
      callback);
};


/**
 * @param {!proto.api.EditMessageThreadReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.api.APIPromiseClient.prototype.editMessageThread =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/api.API/EditMessageThread',
      request,
      metadata || {},
      methodDescriptor_API_EditMessageThread);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.api.ThreadUserReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_API_MakeMessageThreadAdmin = new grpc.web.MethodDescriptor(
  '/api.API/MakeMessageThreadAdmin',
  grpc.web.MethodType.UNARY,
  proto.api.ThreadUserReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.api.ThreadUserReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.api.ThreadUserReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_API_MakeMessageThreadAdmin = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.api.ThreadUserReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.api.ThreadUserReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.api.APIClient.prototype.makeMessageThreadAdmin =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/api.API/MakeMessageThreadAdmin',
      request,
      metadata || {},
      methodDescriptor_API_MakeMessageThreadAdmin,
      callback);
};


/**
 * @param {!proto.api.ThreadUserReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.api.APIPromiseClient.prototype.makeMessageThreadAdmin =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/api.API/MakeMessageThreadAdmin',
      request,
      metadata || {},
      methodDescriptor_API_MakeMessageThreadAdmin);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.api.ThreadUserReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_API_RemoveMessageThreadAdmin = new grpc.web.MethodDescriptor(
  '/api.API/RemoveMessageThreadAdmin',
  grpc.web.MethodType.UNARY,
  proto.api.ThreadUserReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.api.ThreadUserReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.api.ThreadUserReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_API_RemoveMessageThreadAdmin = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.api.ThreadUserReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.api.ThreadUserReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.api.APIClient.prototype.removeMessageThreadAdmin =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/api.API/RemoveMessageThreadAdmin',
      request,
      metadata || {},
      methodDescriptor_API_RemoveMessageThreadAdmin,
      callback);
};


/**
 * @param {!proto.api.ThreadUserReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.api.APIPromiseClient.prototype.removeMessageThreadAdmin =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/api.API/RemoveMessageThreadAdmin',
      request,
      metadata || {},
      methodDescriptor_API_RemoveMessageThreadAdmin);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.api.SendMessageReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_API_SendMessage = new grpc.web.MethodDescriptor(
  '/api.API/SendMessage',
  grpc.web.MethodType.UNARY,
  proto.api.SendMessageReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.api.SendMessageReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.api.SendMessageReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_API_SendMessage = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.api.SendMessageReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.api.SendMessageReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.api.APIClient.prototype.sendMessage =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/api.API/SendMessage',
      request,
      metadata || {},
      methodDescriptor_API_SendMessage,
      callback);
};


/**
 * @param {!proto.api.SendMessageReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.api.APIPromiseClient.prototype.sendMessage =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/api.API/SendMessage',
      request,
      metadata || {},
      methodDescriptor_API_SendMessage);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.api.LeaveMessageThreadReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_API_LeaveMessageThread = new grpc.web.MethodDescriptor(
  '/api.API/LeaveMessageThread',
  grpc.web.MethodType.UNARY,
  proto.api.LeaveMessageThreadReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.api.LeaveMessageThreadReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.api.LeaveMessageThreadReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_API_LeaveMessageThread = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.api.LeaveMessageThreadReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.api.LeaveMessageThreadReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.api.APIClient.prototype.leaveMessageThread =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/api.API/LeaveMessageThread',
      request,
      metadata || {},
      methodDescriptor_API_LeaveMessageThread,
      callback);
};


/**
 * @param {!proto.api.LeaveMessageThreadReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.api.APIPromiseClient.prototype.leaveMessageThread =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/api.API/LeaveMessageThread',
      request,
      metadata || {},
      methodDescriptor_API_LeaveMessageThread);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.api.ThreadUserReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_API_InviteToMessageThread = new grpc.web.MethodDescriptor(
  '/api.API/InviteToMessageThread',
  grpc.web.MethodType.UNARY,
  proto.api.ThreadUserReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.api.ThreadUserReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.api.ThreadUserReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_API_InviteToMessageThread = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.api.ThreadUserReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.api.ThreadUserReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.api.APIClient.prototype.inviteToMessageThread =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/api.API/InviteToMessageThread',
      request,
      metadata || {},
      methodDescriptor_API_InviteToMessageThread,
      callback);
};


/**
 * @param {!proto.api.ThreadUserReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     A native promise that resolves to the response
 */
proto.api.APIPromiseClient.prototype.inviteToMessageThread =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/api.API/InviteToMessageThread',
      request,
      metadata || {},
      methodDescriptor_API_InviteToMessageThread);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.api.SearchMessagesReq,
 *   !proto.api.SearchMessagesRes>}
 */
const methodDescriptor_API_SearchMessages = new grpc.web.MethodDescriptor(
  '/api.API/SearchMessages',
  grpc.web.MethodType.UNARY,
  proto.api.SearchMessagesReq,
  proto.api.SearchMessagesRes,
  /**
   * @param {!proto.api.SearchMessagesReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.api.SearchMessagesRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.api.SearchMessagesReq,
 *   !proto.api.SearchMessagesRes>}
 */
const methodInfo_API_SearchMessages = new grpc.web.AbstractClientBase.MethodInfo(
  proto.api.SearchMessagesRes,
  /**
   * @param {!proto.api.SearchMessagesReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.api.SearchMessagesRes.deserializeBinary
);


/**
 * @param {!proto.api.SearchMessagesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.api.SearchMessagesRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.api.SearchMessagesRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.api.APIClient.prototype.searchMessages =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/api.API/SearchMessages',
      request,
      metadata || {},
      methodDescriptor_API_SearchMessages,
      callback);
};


/**
 * @param {!proto.api.SearchMessagesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.api.SearchMessagesRes>}
 *     A native promise that resolves to the response
 */
proto.api.APIPromiseClient.prototype.searchMessages =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/api.API/SearchMessages',
      request,
      metadata || {},
      methodDescriptor_API_SearchMessages);
};


module.exports = proto.api;

