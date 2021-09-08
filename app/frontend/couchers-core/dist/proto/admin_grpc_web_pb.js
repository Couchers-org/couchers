"use strict";
/**
 * @fileoverview gRPC-Web generated client stub for org.couchers.admin
 * @enhanceable
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck
var grpc = {};
grpc.web = require('grpc-web');
var annotations_pb = require('./annotations_pb.js');
var communities_pb = require('./communities_pb.js');
var proto = {};
proto.org = {};
proto.org.couchers = {};
proto.org.couchers.admin = require('./admin_pb.js');
/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.org.couchers.admin.AdminClient =
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
proto.org.couchers.admin.AdminPromiseClient =
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
 *   !proto.org.couchers.admin.GetUserDetailsReq,
 *   !proto.org.couchers.admin.UserDetails>}
 */
var methodDescriptor_Admin_GetUserDetails = new grpc.web.MethodDescriptor('/org.couchers.admin.Admin/GetUserDetails', grpc.web.MethodType.UNARY, proto.org.couchers.admin.GetUserDetailsReq, proto.org.couchers.admin.UserDetails, 
/**
 * @param {!proto.org.couchers.admin.GetUserDetailsReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.admin.UserDetails.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.admin.GetUserDetailsReq,
 *   !proto.org.couchers.admin.UserDetails>}
 */
var methodInfo_Admin_GetUserDetails = new grpc.web.AbstractClientBase.MethodInfo(proto.org.couchers.admin.UserDetails, 
/**
 * @param {!proto.org.couchers.admin.GetUserDetailsReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.admin.UserDetails.deserializeBinary);
/**
 * @param {!proto.org.couchers.admin.GetUserDetailsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.admin.UserDetails)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.admin.UserDetails>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.admin.AdminClient.prototype.getUserDetails =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.admin.Admin/GetUserDetails', request, metadata || {}, methodDescriptor_Admin_GetUserDetails, callback);
    };
/**
 * @param {!proto.org.couchers.admin.GetUserDetailsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.admin.UserDetails>}
 *     Promise that resolves to the response
 */
proto.org.couchers.admin.AdminPromiseClient.prototype.getUserDetails =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.admin.Admin/GetUserDetails', request, metadata || {}, methodDescriptor_Admin_GetUserDetails);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.admin.ChangeUserGenderReq,
 *   !proto.org.couchers.admin.UserDetails>}
 */
var methodDescriptor_Admin_ChangeUserGender = new grpc.web.MethodDescriptor('/org.couchers.admin.Admin/ChangeUserGender', grpc.web.MethodType.UNARY, proto.org.couchers.admin.ChangeUserGenderReq, proto.org.couchers.admin.UserDetails, 
/**
 * @param {!proto.org.couchers.admin.ChangeUserGenderReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.admin.UserDetails.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.admin.ChangeUserGenderReq,
 *   !proto.org.couchers.admin.UserDetails>}
 */
var methodInfo_Admin_ChangeUserGender = new grpc.web.AbstractClientBase.MethodInfo(proto.org.couchers.admin.UserDetails, 
/**
 * @param {!proto.org.couchers.admin.ChangeUserGenderReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.admin.UserDetails.deserializeBinary);
/**
 * @param {!proto.org.couchers.admin.ChangeUserGenderReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.admin.UserDetails)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.admin.UserDetails>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.admin.AdminClient.prototype.changeUserGender =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.admin.Admin/ChangeUserGender', request, metadata || {}, methodDescriptor_Admin_ChangeUserGender, callback);
    };
/**
 * @param {!proto.org.couchers.admin.ChangeUserGenderReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.admin.UserDetails>}
 *     Promise that resolves to the response
 */
proto.org.couchers.admin.AdminPromiseClient.prototype.changeUserGender =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.admin.Admin/ChangeUserGender', request, metadata || {}, methodDescriptor_Admin_ChangeUserGender);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.admin.ChangeUserBirthdateReq,
 *   !proto.org.couchers.admin.UserDetails>}
 */
var methodDescriptor_Admin_ChangeUserBirthdate = new grpc.web.MethodDescriptor('/org.couchers.admin.Admin/ChangeUserBirthdate', grpc.web.MethodType.UNARY, proto.org.couchers.admin.ChangeUserBirthdateReq, proto.org.couchers.admin.UserDetails, 
/**
 * @param {!proto.org.couchers.admin.ChangeUserBirthdateReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.admin.UserDetails.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.admin.ChangeUserBirthdateReq,
 *   !proto.org.couchers.admin.UserDetails>}
 */
var methodInfo_Admin_ChangeUserBirthdate = new grpc.web.AbstractClientBase.MethodInfo(proto.org.couchers.admin.UserDetails, 
/**
 * @param {!proto.org.couchers.admin.ChangeUserBirthdateReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.admin.UserDetails.deserializeBinary);
/**
 * @param {!proto.org.couchers.admin.ChangeUserBirthdateReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.admin.UserDetails)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.admin.UserDetails>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.admin.AdminClient.prototype.changeUserBirthdate =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.admin.Admin/ChangeUserBirthdate', request, metadata || {}, methodDescriptor_Admin_ChangeUserBirthdate, callback);
    };
/**
 * @param {!proto.org.couchers.admin.ChangeUserBirthdateReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.admin.UserDetails>}
 *     Promise that resolves to the response
 */
proto.org.couchers.admin.AdminPromiseClient.prototype.changeUserBirthdate =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.admin.Admin/ChangeUserBirthdate', request, metadata || {}, methodDescriptor_Admin_ChangeUserBirthdate);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.admin.BanUserReq,
 *   !proto.org.couchers.admin.UserDetails>}
 */
var methodDescriptor_Admin_BanUser = new grpc.web.MethodDescriptor('/org.couchers.admin.Admin/BanUser', grpc.web.MethodType.UNARY, proto.org.couchers.admin.BanUserReq, proto.org.couchers.admin.UserDetails, 
/**
 * @param {!proto.org.couchers.admin.BanUserReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.admin.UserDetails.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.admin.BanUserReq,
 *   !proto.org.couchers.admin.UserDetails>}
 */
var methodInfo_Admin_BanUser = new grpc.web.AbstractClientBase.MethodInfo(proto.org.couchers.admin.UserDetails, 
/**
 * @param {!proto.org.couchers.admin.BanUserReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.admin.UserDetails.deserializeBinary);
/**
 * @param {!proto.org.couchers.admin.BanUserReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.admin.UserDetails)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.admin.UserDetails>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.admin.AdminClient.prototype.banUser =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.admin.Admin/BanUser', request, metadata || {}, methodDescriptor_Admin_BanUser, callback);
    };
/**
 * @param {!proto.org.couchers.admin.BanUserReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.admin.UserDetails>}
 *     Promise that resolves to the response
 */
proto.org.couchers.admin.AdminPromiseClient.prototype.banUser =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.admin.Admin/BanUser', request, metadata || {}, methodDescriptor_Admin_BanUser);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.admin.DeleteUserReq,
 *   !proto.org.couchers.admin.UserDetails>}
 */
var methodDescriptor_Admin_DeleteUser = new grpc.web.MethodDescriptor('/org.couchers.admin.Admin/DeleteUser', grpc.web.MethodType.UNARY, proto.org.couchers.admin.DeleteUserReq, proto.org.couchers.admin.UserDetails, 
/**
 * @param {!proto.org.couchers.admin.DeleteUserReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.admin.UserDetails.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.admin.DeleteUserReq,
 *   !proto.org.couchers.admin.UserDetails>}
 */
var methodInfo_Admin_DeleteUser = new grpc.web.AbstractClientBase.MethodInfo(proto.org.couchers.admin.UserDetails, 
/**
 * @param {!proto.org.couchers.admin.DeleteUserReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.admin.UserDetails.deserializeBinary);
/**
 * @param {!proto.org.couchers.admin.DeleteUserReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.admin.UserDetails)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.admin.UserDetails>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.admin.AdminClient.prototype.deleteUser =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.admin.Admin/DeleteUser', request, metadata || {}, methodDescriptor_Admin_DeleteUser, callback);
    };
/**
 * @param {!proto.org.couchers.admin.DeleteUserReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.admin.UserDetails>}
 *     Promise that resolves to the response
 */
proto.org.couchers.admin.AdminPromiseClient.prototype.deleteUser =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.admin.Admin/DeleteUser', request, metadata || {}, methodDescriptor_Admin_DeleteUser);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.admin.CreateApiKeyReq,
 *   !proto.org.couchers.admin.CreateApiKeyRes>}
 */
var methodDescriptor_Admin_CreateApiKey = new grpc.web.MethodDescriptor('/org.couchers.admin.Admin/CreateApiKey', grpc.web.MethodType.UNARY, proto.org.couchers.admin.CreateApiKeyReq, proto.org.couchers.admin.CreateApiKeyRes, 
/**
 * @param {!proto.org.couchers.admin.CreateApiKeyReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.admin.CreateApiKeyRes.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.admin.CreateApiKeyReq,
 *   !proto.org.couchers.admin.CreateApiKeyRes>}
 */
var methodInfo_Admin_CreateApiKey = new grpc.web.AbstractClientBase.MethodInfo(proto.org.couchers.admin.CreateApiKeyRes, 
/**
 * @param {!proto.org.couchers.admin.CreateApiKeyReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.admin.CreateApiKeyRes.deserializeBinary);
/**
 * @param {!proto.org.couchers.admin.CreateApiKeyReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.admin.CreateApiKeyRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.admin.CreateApiKeyRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.admin.AdminClient.prototype.createApiKey =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.admin.Admin/CreateApiKey', request, metadata || {}, methodDescriptor_Admin_CreateApiKey, callback);
    };
/**
 * @param {!proto.org.couchers.admin.CreateApiKeyReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.admin.CreateApiKeyRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.admin.AdminPromiseClient.prototype.createApiKey =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.admin.Admin/CreateApiKey', request, metadata || {}, methodDescriptor_Admin_CreateApiKey);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.admin.CreateCommunityReq,
 *   !proto.org.couchers.api.communities.Community>}
 */
var methodDescriptor_Admin_CreateCommunity = new grpc.web.MethodDescriptor('/org.couchers.admin.Admin/CreateCommunity', grpc.web.MethodType.UNARY, proto.org.couchers.admin.CreateCommunityReq, communities_pb.Community, 
/**
 * @param {!proto.org.couchers.admin.CreateCommunityReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, communities_pb.Community.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.admin.CreateCommunityReq,
 *   !proto.org.couchers.api.communities.Community>}
 */
var methodInfo_Admin_CreateCommunity = new grpc.web.AbstractClientBase.MethodInfo(communities_pb.Community, 
/**
 * @param {!proto.org.couchers.admin.CreateCommunityReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, communities_pb.Community.deserializeBinary);
/**
 * @param {!proto.org.couchers.admin.CreateCommunityReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.communities.Community)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.communities.Community>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.admin.AdminClient.prototype.createCommunity =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.admin.Admin/CreateCommunity', request, metadata || {}, methodDescriptor_Admin_CreateCommunity, callback);
    };
/**
 * @param {!proto.org.couchers.admin.CreateCommunityReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.communities.Community>}
 *     Promise that resolves to the response
 */
proto.org.couchers.admin.AdminPromiseClient.prototype.createCommunity =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.admin.Admin/CreateCommunity', request, metadata || {}, methodDescriptor_Admin_CreateCommunity);
    };
module.exports = proto.org.couchers.admin;
//# sourceMappingURL=admin_grpc_web_pb.js.map