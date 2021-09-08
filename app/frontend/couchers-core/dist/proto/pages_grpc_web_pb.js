"use strict";
/**
 * @fileoverview gRPC-Web generated client stub for org.couchers.api.pages
 * @enhanceable
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck
var grpc = {};
grpc.web = require('grpc-web');
var google_protobuf_timestamp_pb = require('google-protobuf/google/protobuf/timestamp_pb.js');
var google_protobuf_wrappers_pb = require('google-protobuf/google/protobuf/wrappers_pb.js');
var annotations_pb = require('./annotations_pb.js');
var threads_pb = require('./threads_pb.js');
var proto = {};
proto.org = {};
proto.org.couchers = {};
proto.org.couchers.api = {};
proto.org.couchers.api.pages = require('./pages_pb.js');
/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.org.couchers.api.pages.PagesClient =
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
proto.org.couchers.api.pages.PagesPromiseClient =
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
 *   !proto.org.couchers.api.pages.CreatePlaceReq,
 *   !proto.org.couchers.api.pages.Page>}
 */
var methodDescriptor_Pages_CreatePlace = new grpc.web.MethodDescriptor('/org.couchers.api.pages.Pages/CreatePlace', grpc.web.MethodType.UNARY, proto.org.couchers.api.pages.CreatePlaceReq, proto.org.couchers.api.pages.Page, 
/**
 * @param {!proto.org.couchers.api.pages.CreatePlaceReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.pages.Page.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.pages.CreatePlaceReq,
 *   !proto.org.couchers.api.pages.Page>}
 */
var methodInfo_Pages_CreatePlace = new grpc.web.AbstractClientBase.MethodInfo(proto.org.couchers.api.pages.Page, 
/**
 * @param {!proto.org.couchers.api.pages.CreatePlaceReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.pages.Page.deserializeBinary);
/**
 * @param {!proto.org.couchers.api.pages.CreatePlaceReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.pages.Page)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.pages.Page>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.pages.PagesClient.prototype.createPlace =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.api.pages.Pages/CreatePlace', request, metadata || {}, methodDescriptor_Pages_CreatePlace, callback);
    };
/**
 * @param {!proto.org.couchers.api.pages.CreatePlaceReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.pages.Page>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.pages.PagesPromiseClient.prototype.createPlace =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.api.pages.Pages/CreatePlace', request, metadata || {}, methodDescriptor_Pages_CreatePlace);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.pages.CreateGuideReq,
 *   !proto.org.couchers.api.pages.Page>}
 */
var methodDescriptor_Pages_CreateGuide = new grpc.web.MethodDescriptor('/org.couchers.api.pages.Pages/CreateGuide', grpc.web.MethodType.UNARY, proto.org.couchers.api.pages.CreateGuideReq, proto.org.couchers.api.pages.Page, 
/**
 * @param {!proto.org.couchers.api.pages.CreateGuideReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.pages.Page.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.pages.CreateGuideReq,
 *   !proto.org.couchers.api.pages.Page>}
 */
var methodInfo_Pages_CreateGuide = new grpc.web.AbstractClientBase.MethodInfo(proto.org.couchers.api.pages.Page, 
/**
 * @param {!proto.org.couchers.api.pages.CreateGuideReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.pages.Page.deserializeBinary);
/**
 * @param {!proto.org.couchers.api.pages.CreateGuideReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.pages.Page)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.pages.Page>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.pages.PagesClient.prototype.createGuide =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.api.pages.Pages/CreateGuide', request, metadata || {}, methodDescriptor_Pages_CreateGuide, callback);
    };
/**
 * @param {!proto.org.couchers.api.pages.CreateGuideReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.pages.Page>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.pages.PagesPromiseClient.prototype.createGuide =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.api.pages.Pages/CreateGuide', request, metadata || {}, methodDescriptor_Pages_CreateGuide);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.pages.GetPageReq,
 *   !proto.org.couchers.api.pages.Page>}
 */
var methodDescriptor_Pages_GetPage = new grpc.web.MethodDescriptor('/org.couchers.api.pages.Pages/GetPage', grpc.web.MethodType.UNARY, proto.org.couchers.api.pages.GetPageReq, proto.org.couchers.api.pages.Page, 
/**
 * @param {!proto.org.couchers.api.pages.GetPageReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.pages.Page.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.pages.GetPageReq,
 *   !proto.org.couchers.api.pages.Page>}
 */
var methodInfo_Pages_GetPage = new grpc.web.AbstractClientBase.MethodInfo(proto.org.couchers.api.pages.Page, 
/**
 * @param {!proto.org.couchers.api.pages.GetPageReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.pages.Page.deserializeBinary);
/**
 * @param {!proto.org.couchers.api.pages.GetPageReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.pages.Page)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.pages.Page>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.pages.PagesClient.prototype.getPage =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.api.pages.Pages/GetPage', request, metadata || {}, methodDescriptor_Pages_GetPage, callback);
    };
/**
 * @param {!proto.org.couchers.api.pages.GetPageReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.pages.Page>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.pages.PagesPromiseClient.prototype.getPage =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.api.pages.Pages/GetPage', request, metadata || {}, methodDescriptor_Pages_GetPage);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.pages.UpdatePageReq,
 *   !proto.org.couchers.api.pages.Page>}
 */
var methodDescriptor_Pages_UpdatePage = new grpc.web.MethodDescriptor('/org.couchers.api.pages.Pages/UpdatePage', grpc.web.MethodType.UNARY, proto.org.couchers.api.pages.UpdatePageReq, proto.org.couchers.api.pages.Page, 
/**
 * @param {!proto.org.couchers.api.pages.UpdatePageReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.pages.Page.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.pages.UpdatePageReq,
 *   !proto.org.couchers.api.pages.Page>}
 */
var methodInfo_Pages_UpdatePage = new grpc.web.AbstractClientBase.MethodInfo(proto.org.couchers.api.pages.Page, 
/**
 * @param {!proto.org.couchers.api.pages.UpdatePageReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.pages.Page.deserializeBinary);
/**
 * @param {!proto.org.couchers.api.pages.UpdatePageReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.pages.Page)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.pages.Page>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.pages.PagesClient.prototype.updatePage =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.api.pages.Pages/UpdatePage', request, metadata || {}, methodDescriptor_Pages_UpdatePage, callback);
    };
/**
 * @param {!proto.org.couchers.api.pages.UpdatePageReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.pages.Page>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.pages.PagesPromiseClient.prototype.updatePage =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.api.pages.Pages/UpdatePage', request, metadata || {}, methodDescriptor_Pages_UpdatePage);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.pages.TransferPageReq,
 *   !proto.org.couchers.api.pages.Page>}
 */
var methodDescriptor_Pages_TransferPage = new grpc.web.MethodDescriptor('/org.couchers.api.pages.Pages/TransferPage', grpc.web.MethodType.UNARY, proto.org.couchers.api.pages.TransferPageReq, proto.org.couchers.api.pages.Page, 
/**
 * @param {!proto.org.couchers.api.pages.TransferPageReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.pages.Page.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.pages.TransferPageReq,
 *   !proto.org.couchers.api.pages.Page>}
 */
var methodInfo_Pages_TransferPage = new grpc.web.AbstractClientBase.MethodInfo(proto.org.couchers.api.pages.Page, 
/**
 * @param {!proto.org.couchers.api.pages.TransferPageReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.pages.Page.deserializeBinary);
/**
 * @param {!proto.org.couchers.api.pages.TransferPageReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.pages.Page)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.pages.Page>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.pages.PagesClient.prototype.transferPage =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.api.pages.Pages/TransferPage', request, metadata || {}, methodDescriptor_Pages_TransferPage, callback);
    };
/**
 * @param {!proto.org.couchers.api.pages.TransferPageReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.pages.Page>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.pages.PagesPromiseClient.prototype.transferPage =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.api.pages.Pages/TransferPage', request, metadata || {}, methodDescriptor_Pages_TransferPage);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.pages.ListUserPlacesReq,
 *   !proto.org.couchers.api.pages.ListUserPlacesRes>}
 */
var methodDescriptor_Pages_ListUserPlaces = new grpc.web.MethodDescriptor('/org.couchers.api.pages.Pages/ListUserPlaces', grpc.web.MethodType.UNARY, proto.org.couchers.api.pages.ListUserPlacesReq, proto.org.couchers.api.pages.ListUserPlacesRes, 
/**
 * @param {!proto.org.couchers.api.pages.ListUserPlacesReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.pages.ListUserPlacesRes.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.pages.ListUserPlacesReq,
 *   !proto.org.couchers.api.pages.ListUserPlacesRes>}
 */
var methodInfo_Pages_ListUserPlaces = new grpc.web.AbstractClientBase.MethodInfo(proto.org.couchers.api.pages.ListUserPlacesRes, 
/**
 * @param {!proto.org.couchers.api.pages.ListUserPlacesReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.pages.ListUserPlacesRes.deserializeBinary);
/**
 * @param {!proto.org.couchers.api.pages.ListUserPlacesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.pages.ListUserPlacesRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.pages.ListUserPlacesRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.pages.PagesClient.prototype.listUserPlaces =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.api.pages.Pages/ListUserPlaces', request, metadata || {}, methodDescriptor_Pages_ListUserPlaces, callback);
    };
/**
 * @param {!proto.org.couchers.api.pages.ListUserPlacesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.pages.ListUserPlacesRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.pages.PagesPromiseClient.prototype.listUserPlaces =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.api.pages.Pages/ListUserPlaces', request, metadata || {}, methodDescriptor_Pages_ListUserPlaces);
    };
/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.pages.ListUserGuidesReq,
 *   !proto.org.couchers.api.pages.ListUserGuidesRes>}
 */
var methodDescriptor_Pages_ListUserGuides = new grpc.web.MethodDescriptor('/org.couchers.api.pages.Pages/ListUserGuides', grpc.web.MethodType.UNARY, proto.org.couchers.api.pages.ListUserGuidesReq, proto.org.couchers.api.pages.ListUserGuidesRes, 
/**
 * @param {!proto.org.couchers.api.pages.ListUserGuidesReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.pages.ListUserGuidesRes.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.pages.ListUserGuidesReq,
 *   !proto.org.couchers.api.pages.ListUserGuidesRes>}
 */
var methodInfo_Pages_ListUserGuides = new grpc.web.AbstractClientBase.MethodInfo(proto.org.couchers.api.pages.ListUserGuidesRes, 
/**
 * @param {!proto.org.couchers.api.pages.ListUserGuidesReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.pages.ListUserGuidesRes.deserializeBinary);
/**
 * @param {!proto.org.couchers.api.pages.ListUserGuidesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.pages.ListUserGuidesRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.pages.ListUserGuidesRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.pages.PagesClient.prototype.listUserGuides =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.api.pages.Pages/ListUserGuides', request, metadata || {}, methodDescriptor_Pages_ListUserGuides, callback);
    };
/**
 * @param {!proto.org.couchers.api.pages.ListUserGuidesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.pages.ListUserGuidesRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.pages.PagesPromiseClient.prototype.listUserGuides =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.api.pages.Pages/ListUserGuides', request, metadata || {}, methodDescriptor_Pages_ListUserGuides);
    };
module.exports = proto.org.couchers.api.pages;
//# sourceMappingURL=pages_grpc_web_pb.js.map