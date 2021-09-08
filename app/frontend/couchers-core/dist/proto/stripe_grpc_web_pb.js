"use strict";
/**
 * @fileoverview gRPC-Web generated client stub for org.couchers.stripe
 * @enhanceable
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck
var grpc = {};
grpc.web = require('grpc-web');
var google_api_annotations_pb = require('./google/api/annotations_pb.js');
var google_api_httpbody_pb = require('./google/api/httpbody_pb.js');
var annotations_pb = require('./annotations_pb.js');
var proto = {};
proto.org = {};
proto.org.couchers = {};
proto.org.couchers.stripe = require('./stripe_pb.js');
/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.org.couchers.stripe.StripeClient =
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
proto.org.couchers.stripe.StripePromiseClient =
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
 *   !proto.google.api.HttpBody,
 *   !proto.google.api.HttpBody>}
 */
var methodDescriptor_Stripe_Webhook = new grpc.web.MethodDescriptor('/org.couchers.stripe.Stripe/Webhook', grpc.web.MethodType.UNARY, google_api_httpbody_pb.HttpBody, google_api_httpbody_pb.HttpBody, 
/**
 * @param {!proto.google.api.HttpBody} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, google_api_httpbody_pb.HttpBody.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.google.api.HttpBody,
 *   !proto.google.api.HttpBody>}
 */
var methodInfo_Stripe_Webhook = new grpc.web.AbstractClientBase.MethodInfo(google_api_httpbody_pb.HttpBody, 
/**
 * @param {!proto.google.api.HttpBody} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, google_api_httpbody_pb.HttpBody.deserializeBinary);
/**
 * @param {!proto.google.api.HttpBody} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.api.HttpBody)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.api.HttpBody>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.stripe.StripeClient.prototype.webhook =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.stripe.Stripe/Webhook', request, metadata || {}, methodDescriptor_Stripe_Webhook, callback);
    };
/**
 * @param {!proto.google.api.HttpBody} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.api.HttpBody>}
 *     Promise that resolves to the response
 */
proto.org.couchers.stripe.StripePromiseClient.prototype.webhook =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.stripe.Stripe/Webhook', request, metadata || {}, methodDescriptor_Stripe_Webhook);
    };
module.exports = proto.org.couchers.stripe;
//# sourceMappingURL=stripe_grpc_web_pb.js.map