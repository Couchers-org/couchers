"use strict";
/**
 * @fileoverview gRPC-Web generated client stub for org.couchers.api.core
 * @enhanceable
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck
var grpc = {};
grpc.web = require('grpc-web');
var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js');
var google_protobuf_timestamp_pb = require('google-protobuf/google/protobuf/timestamp_pb.js');
var google_protobuf_wrappers_pb = require('google-protobuf/google/protobuf/wrappers_pb.js');
var annotations_pb = require('./annotations_pb.js');
var proto = {};
proto.org = {};
proto.org.couchers = {};
proto.org.couchers.api = {};
proto.org.couchers.api.core = require('./api_pb.js');
/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.org.couchers.api.core.APIClient =
    function (hostname, credentials, options) {
        if (!options)
            options = {};
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
proto.org.couchers.api.core.APIPromiseClient =
    function (hostname, credentials, options) {
        if (!options)
            options = {};
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
 *   !proto.org.couchers.api.core.PingReq,
 *   !proto.org.couchers.api.core.PingRes>}
 */
var methodDescriptor_API_Ping = new grpc.web.MethodDescriptor('/org.couchers.api.core.API/Ping', grpc.web.MethodType.UNARY, proto.org.couchers.api.core.PingReq, proto.org.couchers.api.core.PingRes, 
/**
 * @param {!proto.org.couchers.api.core.PingReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.core.PingRes.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.core.PingReq,
 *   !proto.org.couchers.api.core.PingRes>}
 */
var methodInfo_API_Ping = new grpc.web.AbstractClientBase.MethodInfo(proto.org.couchers.api.core.PingRes, 
/**
 * @param {!proto.org.couchers.api.core.PingReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.core.PingRes.deserializeBinary);
/**
 * @param {!proto.org.couchers.api.core.PingReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.core.PingRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.core.PingRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.core.APIClient.prototype.ping =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.api.core.API/Ping', request, metadata || {}, methodDescriptor_API_Ping, callback);
    };
/**
 * @param {!proto.org.couchers.api.core.PingReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.core.PingRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.core.APIPromiseClient.prototype.ping =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.api.core.API/Ping', request, metadata || {}, methodDescriptor_API_Ping);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.core.GetUserReq,
 *   !proto.org.couchers.api.core.User>}
 */
var methodDescriptor_API_GetUser = new grpc.web.MethodDescriptor('/org.couchers.api.core.API/GetUser', grpc.web.MethodType.UNARY, proto.org.couchers.api.core.GetUserReq, proto.org.couchers.api.core.User, 
/**
 * @param {!proto.org.couchers.api.core.GetUserReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.core.User.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.core.GetUserReq,
 *   !proto.org.couchers.api.core.User>}
 */
var methodInfo_API_GetUser = new grpc.web.AbstractClientBase.MethodInfo(proto.org.couchers.api.core.User, 
/**
 * @param {!proto.org.couchers.api.core.GetUserReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.core.User.deserializeBinary);
/**
 * @param {!proto.org.couchers.api.core.GetUserReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.core.User)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.core.User>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.core.APIClient.prototype.getUser =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.api.core.API/GetUser', request, metadata || {}, methodDescriptor_API_GetUser, callback);
    };
/**
 * @param {!proto.org.couchers.api.core.GetUserReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.core.User>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.core.APIPromiseClient.prototype.getUser =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.api.core.API/GetUser', request, metadata || {}, methodDescriptor_API_GetUser);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.core.UpdateProfileReq,
 *   !proto.google.protobuf.Empty>}
 */
var methodDescriptor_API_UpdateProfile = new grpc.web.MethodDescriptor('/org.couchers.api.core.API/UpdateProfile', grpc.web.MethodType.UNARY, proto.org.couchers.api.core.UpdateProfileReq, google_protobuf_empty_pb.Empty, 
/**
 * @param {!proto.org.couchers.api.core.UpdateProfileReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, google_protobuf_empty_pb.Empty.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.core.UpdateProfileReq,
 *   !proto.google.protobuf.Empty>}
 */
var methodInfo_API_UpdateProfile = new grpc.web.AbstractClientBase.MethodInfo(google_protobuf_empty_pb.Empty, 
/**
 * @param {!proto.org.couchers.api.core.UpdateProfileReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, google_protobuf_empty_pb.Empty.deserializeBinary);
/**
 * @param {!proto.org.couchers.api.core.UpdateProfileReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.core.APIClient.prototype.updateProfile =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.api.core.API/UpdateProfile', request, metadata || {}, methodDescriptor_API_UpdateProfile, callback);
    };
/**
 * @param {!proto.org.couchers.api.core.UpdateProfileReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.core.APIPromiseClient.prototype.updateProfile =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.api.core.API/UpdateProfile', request, metadata || {}, methodDescriptor_API_UpdateProfile);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.core.SendFriendRequestReq,
 *   !proto.google.protobuf.Empty>}
 */
var methodDescriptor_API_SendFriendRequest = new grpc.web.MethodDescriptor('/org.couchers.api.core.API/SendFriendRequest', grpc.web.MethodType.UNARY, proto.org.couchers.api.core.SendFriendRequestReq, google_protobuf_empty_pb.Empty, 
/**
 * @param {!proto.org.couchers.api.core.SendFriendRequestReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, google_protobuf_empty_pb.Empty.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.core.SendFriendRequestReq,
 *   !proto.google.protobuf.Empty>}
 */
var methodInfo_API_SendFriendRequest = new grpc.web.AbstractClientBase.MethodInfo(google_protobuf_empty_pb.Empty, 
/**
 * @param {!proto.org.couchers.api.core.SendFriendRequestReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, google_protobuf_empty_pb.Empty.deserializeBinary);
/**
 * @param {!proto.org.couchers.api.core.SendFriendRequestReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.core.APIClient.prototype.sendFriendRequest =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.api.core.API/SendFriendRequest', request, metadata || {}, methodDescriptor_API_SendFriendRequest, callback);
    };
/**
 * @param {!proto.org.couchers.api.core.SendFriendRequestReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.core.APIPromiseClient.prototype.sendFriendRequest =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.api.core.API/SendFriendRequest', request, metadata || {}, methodDescriptor_API_SendFriendRequest);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.google.protobuf.Empty,
 *   !proto.org.couchers.api.core.ListFriendRequestsRes>}
 */
var methodDescriptor_API_ListFriendRequests = new grpc.web.MethodDescriptor('/org.couchers.api.core.API/ListFriendRequests', grpc.web.MethodType.UNARY, google_protobuf_empty_pb.Empty, proto.org.couchers.api.core.ListFriendRequestsRes, 
/**
 * @param {!proto.google.protobuf.Empty} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.core.ListFriendRequestsRes.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.google.protobuf.Empty,
 *   !proto.org.couchers.api.core.ListFriendRequestsRes>}
 */
var methodInfo_API_ListFriendRequests = new grpc.web.AbstractClientBase.MethodInfo(proto.org.couchers.api.core.ListFriendRequestsRes, 
/**
 * @param {!proto.google.protobuf.Empty} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.core.ListFriendRequestsRes.deserializeBinary);
/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.core.ListFriendRequestsRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.core.ListFriendRequestsRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.core.APIClient.prototype.listFriendRequests =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.api.core.API/ListFriendRequests', request, metadata || {}, methodDescriptor_API_ListFriendRequests, callback);
    };
/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.core.ListFriendRequestsRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.core.APIPromiseClient.prototype.listFriendRequests =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.api.core.API/ListFriendRequests', request, metadata || {}, methodDescriptor_API_ListFriendRequests);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.google.protobuf.Empty,
 *   !proto.org.couchers.api.core.ListFriendsRes>}
 */
var methodDescriptor_API_ListFriends = new grpc.web.MethodDescriptor('/org.couchers.api.core.API/ListFriends', grpc.web.MethodType.UNARY, google_protobuf_empty_pb.Empty, proto.org.couchers.api.core.ListFriendsRes, 
/**
 * @param {!proto.google.protobuf.Empty} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.core.ListFriendsRes.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.google.protobuf.Empty,
 *   !proto.org.couchers.api.core.ListFriendsRes>}
 */
var methodInfo_API_ListFriends = new grpc.web.AbstractClientBase.MethodInfo(proto.org.couchers.api.core.ListFriendsRes, 
/**
 * @param {!proto.google.protobuf.Empty} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.core.ListFriendsRes.deserializeBinary);
/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.core.ListFriendsRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.core.ListFriendsRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.core.APIClient.prototype.listFriends =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.api.core.API/ListFriends', request, metadata || {}, methodDescriptor_API_ListFriends, callback);
    };
/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.core.ListFriendsRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.core.APIPromiseClient.prototype.listFriends =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.api.core.API/ListFriends', request, metadata || {}, methodDescriptor_API_ListFriends);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.core.ListMutualFriendsReq,
 *   !proto.org.couchers.api.core.ListMutualFriendsRes>}
 */
var methodDescriptor_API_ListMutualFriends = new grpc.web.MethodDescriptor('/org.couchers.api.core.API/ListMutualFriends', grpc.web.MethodType.UNARY, proto.org.couchers.api.core.ListMutualFriendsReq, proto.org.couchers.api.core.ListMutualFriendsRes, 
/**
 * @param {!proto.org.couchers.api.core.ListMutualFriendsReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.core.ListMutualFriendsRes.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.core.ListMutualFriendsReq,
 *   !proto.org.couchers.api.core.ListMutualFriendsRes>}
 */
var methodInfo_API_ListMutualFriends = new grpc.web.AbstractClientBase.MethodInfo(proto.org.couchers.api.core.ListMutualFriendsRes, 
/**
 * @param {!proto.org.couchers.api.core.ListMutualFriendsReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.core.ListMutualFriendsRes.deserializeBinary);
/**
 * @param {!proto.org.couchers.api.core.ListMutualFriendsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.core.ListMutualFriendsRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.core.ListMutualFriendsRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.core.APIClient.prototype.listMutualFriends =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.api.core.API/ListMutualFriends', request, metadata || {}, methodDescriptor_API_ListMutualFriends, callback);
    };
/**
 * @param {!proto.org.couchers.api.core.ListMutualFriendsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.core.ListMutualFriendsRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.core.APIPromiseClient.prototype.listMutualFriends =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.api.core.API/ListMutualFriends', request, metadata || {}, methodDescriptor_API_ListMutualFriends);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.core.RespondFriendRequestReq,
 *   !proto.google.protobuf.Empty>}
 */
var methodDescriptor_API_RespondFriendRequest = new grpc.web.MethodDescriptor('/org.couchers.api.core.API/RespondFriendRequest', grpc.web.MethodType.UNARY, proto.org.couchers.api.core.RespondFriendRequestReq, google_protobuf_empty_pb.Empty, 
/**
 * @param {!proto.org.couchers.api.core.RespondFriendRequestReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, google_protobuf_empty_pb.Empty.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.core.RespondFriendRequestReq,
 *   !proto.google.protobuf.Empty>}
 */
var methodInfo_API_RespondFriendRequest = new grpc.web.AbstractClientBase.MethodInfo(google_protobuf_empty_pb.Empty, 
/**
 * @param {!proto.org.couchers.api.core.RespondFriendRequestReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, google_protobuf_empty_pb.Empty.deserializeBinary);
/**
 * @param {!proto.org.couchers.api.core.RespondFriendRequestReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.core.APIClient.prototype.respondFriendRequest =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.api.core.API/RespondFriendRequest', request, metadata || {}, methodDescriptor_API_RespondFriendRequest, callback);
    };
/**
 * @param {!proto.org.couchers.api.core.RespondFriendRequestReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.core.APIPromiseClient.prototype.respondFriendRequest =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.api.core.API/RespondFriendRequest', request, metadata || {}, methodDescriptor_API_RespondFriendRequest);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.core.CancelFriendRequestReq,
 *   !proto.google.protobuf.Empty>}
 */
var methodDescriptor_API_CancelFriendRequest = new grpc.web.MethodDescriptor('/org.couchers.api.core.API/CancelFriendRequest', grpc.web.MethodType.UNARY, proto.org.couchers.api.core.CancelFriendRequestReq, google_protobuf_empty_pb.Empty, 
/**
 * @param {!proto.org.couchers.api.core.CancelFriendRequestReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, google_protobuf_empty_pb.Empty.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.core.CancelFriendRequestReq,
 *   !proto.google.protobuf.Empty>}
 */
var methodInfo_API_CancelFriendRequest = new grpc.web.AbstractClientBase.MethodInfo(google_protobuf_empty_pb.Empty, 
/**
 * @param {!proto.org.couchers.api.core.CancelFriendRequestReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, google_protobuf_empty_pb.Empty.deserializeBinary);
/**
 * @param {!proto.org.couchers.api.core.CancelFriendRequestReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.core.APIClient.prototype.cancelFriendRequest =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.api.core.API/CancelFriendRequest', request, metadata || {}, methodDescriptor_API_CancelFriendRequest, callback);
    };
/**
 * @param {!proto.org.couchers.api.core.CancelFriendRequestReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.core.APIPromiseClient.prototype.cancelFriendRequest =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.api.core.API/CancelFriendRequest', request, metadata || {}, methodDescriptor_API_CancelFriendRequest);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.google.protobuf.Empty,
 *   !proto.org.couchers.api.core.InitiateMediaUploadRes>}
 */
var methodDescriptor_API_InitiateMediaUpload = new grpc.web.MethodDescriptor('/org.couchers.api.core.API/InitiateMediaUpload', grpc.web.MethodType.UNARY, google_protobuf_empty_pb.Empty, proto.org.couchers.api.core.InitiateMediaUploadRes, 
/**
 * @param {!proto.google.protobuf.Empty} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.core.InitiateMediaUploadRes.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.google.protobuf.Empty,
 *   !proto.org.couchers.api.core.InitiateMediaUploadRes>}
 */
var methodInfo_API_InitiateMediaUpload = new grpc.web.AbstractClientBase.MethodInfo(proto.org.couchers.api.core.InitiateMediaUploadRes, 
/**
 * @param {!proto.google.protobuf.Empty} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.core.InitiateMediaUploadRes.deserializeBinary);
/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.core.InitiateMediaUploadRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.core.InitiateMediaUploadRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.core.APIClient.prototype.initiateMediaUpload =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.api.core.API/InitiateMediaUpload', request, metadata || {}, methodDescriptor_API_InitiateMediaUpload, callback);
    };
/**
 * @param {!proto.google.protobuf.Empty} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.core.InitiateMediaUploadRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.core.APIPromiseClient.prototype.initiateMediaUpload =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.api.core.API/InitiateMediaUpload', request, metadata || {}, methodDescriptor_API_InitiateMediaUpload);
    };
module.exports = proto.org.couchers.api.core;
//# sourceMappingURL=api_grpc_web_pb.js.map