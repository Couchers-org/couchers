"use strict";
/**
 * @fileoverview gRPC-Web generated client stub for org.couchers.api.donations
 * @enhanceable
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck
var grpc = {};
grpc.web = require('grpc-web');
var annotations_pb = require('./annotations_pb.js');
var proto = {};
proto.org = {};
proto.org.couchers = {};
proto.org.couchers.api = {};
proto.org.couchers.api.donations = require('./donations_pb.js');
/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.org.couchers.api.donations.DonationsClient =
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
proto.org.couchers.api.donations.DonationsPromiseClient =
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
 *   !proto.org.couchers.api.donations.InitiateDonationReq,
 *   !proto.org.couchers.api.donations.InitiateDonationRes>}
 */
var methodDescriptor_Donations_InitiateDonation = new grpc.web.MethodDescriptor('/org.couchers.api.donations.Donations/InitiateDonation', grpc.web.MethodType.UNARY, proto.org.couchers.api.donations.InitiateDonationReq, proto.org.couchers.api.donations.InitiateDonationRes, 
/**
 * @param {!proto.org.couchers.api.donations.InitiateDonationReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.donations.InitiateDonationRes.deserializeBinary);
/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.donations.InitiateDonationReq,
 *   !proto.org.couchers.api.donations.InitiateDonationRes>}
 */
var methodInfo_Donations_InitiateDonation = new grpc.web.AbstractClientBase.MethodInfo(proto.org.couchers.api.donations.InitiateDonationRes, 
/**
 * @param {!proto.org.couchers.api.donations.InitiateDonationReq} request
 * @return {!Uint8Array}
 */
function (request) {
    return request.serializeBinary();
}, proto.org.couchers.api.donations.InitiateDonationRes.deserializeBinary);
/**
 * @param {!proto.org.couchers.api.donations.InitiateDonationReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.donations.InitiateDonationRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.donations.InitiateDonationRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.donations.DonationsClient.prototype.initiateDonation =
    function (request, metadata, callback) {
        return this.client_.rpcCall(this.hostname_ +
            '/org.couchers.api.donations.Donations/InitiateDonation', request, metadata || {}, methodDescriptor_Donations_InitiateDonation, callback);
    };
/**
 * @param {!proto.org.couchers.api.donations.InitiateDonationReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.donations.InitiateDonationRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.donations.DonationsPromiseClient.prototype.initiateDonation =
    function (request, metadata) {
        return this.client_.unaryCall(this.hostname_ +
            '/org.couchers.api.donations.Donations/InitiateDonation', request, metadata || {}, methodDescriptor_Donations_InitiateDonation);
    };
module.exports = proto.org.couchers.api.donations;
//# sourceMappingURL=donations_grpc_web_pb.js.map