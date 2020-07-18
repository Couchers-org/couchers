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
 *   !proto.api.ListMutualFriendsReq,
 *   !proto.api.ListMutualFriendsRes>}
 */
const methodDescriptor_API_ListMutualFriends = new grpc.web.MethodDescriptor(
  '/api.API/ListMutualFriends',
  grpc.web.MethodType.UNARY,
  proto.api.ListMutualFriendsReq,
  proto.api.ListMutualFriendsRes,
  /**
   * @param {!proto.api.ListMutualFriendsReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.api.ListMutualFriendsRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.api.ListMutualFriendsReq,
 *   !proto.api.ListMutualFriendsRes>}
 */
const methodInfo_API_ListMutualFriends = new grpc.web.AbstractClientBase.MethodInfo(
  proto.api.ListMutualFriendsRes,
  /**
   * @param {!proto.api.ListMutualFriendsReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.api.ListMutualFriendsRes.deserializeBinary
);


/**
 * @param {!proto.api.ListMutualFriendsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.api.ListMutualFriendsRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.api.ListMutualFriendsRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.api.APIClient.prototype.listMutualFriends =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/api.API/ListMutualFriends',
      request,
      metadata || {},
      methodDescriptor_API_ListMutualFriends,
      callback);
};


/**
 * @param {!proto.api.ListMutualFriendsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.api.ListMutualFriendsRes>}
 *     A native promise that resolves to the response
 */
proto.api.APIPromiseClient.prototype.listMutualFriends =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/api.API/ListMutualFriends',
      request,
      metadata || {},
      methodDescriptor_API_ListMutualFriends);
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


module.exports = proto.api;

