/**
 * @fileoverview gRPC-Web generated client stub for org.couchers.api.communities
 * @enhanceable
 * @public
 */

// GENERATED CODE -- DO NOT EDIT!

/* eslint-disable */
// @ts-nocheck

const grpc = {};
grpc.web = require("grpc-web");

var google_protobuf_empty_pb = require("google-protobuf/google/protobuf/empty_pb.js");

var google_protobuf_timestamp_pb = require("google-protobuf/google/protobuf/timestamp_pb.js");

var pb_discussions_pb = require("../pb/discussions_pb.js");

var pb_groups_pb = require("../pb/groups_pb.js");

var pb_pages_pb = require("../pb/pages_pb.js");
const proto = {};
proto.org = {};
proto.org.couchers = {};
proto.org.couchers.api = {};
proto.org.couchers.api.communities = require("./communities_pb.js");

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.org.couchers.api.communities.CommunitiesClient = function (
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
proto.org.couchers.api.communities.CommunitiesPromiseClient = function (
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
 *   !proto.org.couchers.api.communities.GetCommunityReq,
 *   !proto.org.couchers.api.communities.Community>}
 */
const methodDescriptor_Communities_GetCommunity = new grpc.web.MethodDescriptor(
  "/org.couchers.api.communities.Communities/GetCommunity",
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.communities.GetCommunityReq,
  proto.org.couchers.api.communities.Community,
  /**
   * @param {!proto.org.couchers.api.communities.GetCommunityReq} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.communities.Community.deserializeBinary
);

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.communities.GetCommunityReq,
 *   !proto.org.couchers.api.communities.Community>}
 */
const methodInfo_Communities_GetCommunity =
  new grpc.web.AbstractClientBase.MethodInfo(
    proto.org.couchers.api.communities.Community,
    /**
     * @param {!proto.org.couchers.api.communities.GetCommunityReq} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    proto.org.couchers.api.communities.Community.deserializeBinary
  );

/**
 * @param {!proto.org.couchers.api.communities.GetCommunityReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.communities.Community)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.communities.Community>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.communities.CommunitiesClient.prototype.getCommunity =
  function (request, metadata, callback) {
    return this.client_.rpcCall(
      this.hostname_ + "/org.couchers.api.communities.Communities/GetCommunity",
      request,
      metadata || {},
      methodDescriptor_Communities_GetCommunity,
      callback
    );
  };

/**
 * @param {!proto.org.couchers.api.communities.GetCommunityReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.communities.Community>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.communities.CommunitiesPromiseClient.prototype.getCommunity =
  function (request, metadata) {
    return this.client_.unaryCall(
      this.hostname_ + "/org.couchers.api.communities.Communities/GetCommunity",
      request,
      metadata || {},
      methodDescriptor_Communities_GetCommunity
    );
  };

/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.communities.ListCommunitiesReq,
 *   !proto.org.couchers.api.communities.ListCommunitiesRes>}
 */
const methodDescriptor_Communities_ListCommunities =
  new grpc.web.MethodDescriptor(
    "/org.couchers.api.communities.Communities/ListCommunities",
    grpc.web.MethodType.UNARY,
    proto.org.couchers.api.communities.ListCommunitiesReq,
    proto.org.couchers.api.communities.ListCommunitiesRes,
    /**
     * @param {!proto.org.couchers.api.communities.ListCommunitiesReq} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    proto.org.couchers.api.communities.ListCommunitiesRes.deserializeBinary
  );

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.communities.ListCommunitiesReq,
 *   !proto.org.couchers.api.communities.ListCommunitiesRes>}
 */
const methodInfo_Communities_ListCommunities =
  new grpc.web.AbstractClientBase.MethodInfo(
    proto.org.couchers.api.communities.ListCommunitiesRes,
    /**
     * @param {!proto.org.couchers.api.communities.ListCommunitiesReq} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    proto.org.couchers.api.communities.ListCommunitiesRes.deserializeBinary
  );

/**
 * @param {!proto.org.couchers.api.communities.ListCommunitiesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.communities.ListCommunitiesRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.communities.ListCommunitiesRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.communities.CommunitiesClient.prototype.listCommunities =
  function (request, metadata, callback) {
    return this.client_.rpcCall(
      this.hostname_ +
        "/org.couchers.api.communities.Communities/ListCommunities",
      request,
      metadata || {},
      methodDescriptor_Communities_ListCommunities,
      callback
    );
  };

/**
 * @param {!proto.org.couchers.api.communities.ListCommunitiesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.communities.ListCommunitiesRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.communities.CommunitiesPromiseClient.prototype.listCommunities =
  function (request, metadata) {
    return this.client_.unaryCall(
      this.hostname_ +
        "/org.couchers.api.communities.Communities/ListCommunities",
      request,
      metadata || {},
      methodDescriptor_Communities_ListCommunities
    );
  };

/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.communities.ListGroupsReq,
 *   !proto.org.couchers.api.communities.ListGroupsRes>}
 */
const methodDescriptor_Communities_ListGroups = new grpc.web.MethodDescriptor(
  "/org.couchers.api.communities.Communities/ListGroups",
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.communities.ListGroupsReq,
  proto.org.couchers.api.communities.ListGroupsRes,
  /**
   * @param {!proto.org.couchers.api.communities.ListGroupsReq} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.communities.ListGroupsRes.deserializeBinary
);

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.communities.ListGroupsReq,
 *   !proto.org.couchers.api.communities.ListGroupsRes>}
 */
const methodInfo_Communities_ListGroups =
  new grpc.web.AbstractClientBase.MethodInfo(
    proto.org.couchers.api.communities.ListGroupsRes,
    /**
     * @param {!proto.org.couchers.api.communities.ListGroupsReq} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    proto.org.couchers.api.communities.ListGroupsRes.deserializeBinary
  );

/**
 * @param {!proto.org.couchers.api.communities.ListGroupsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.communities.ListGroupsRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.communities.ListGroupsRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.communities.CommunitiesClient.prototype.listGroups =
  function (request, metadata, callback) {
    return this.client_.rpcCall(
      this.hostname_ + "/org.couchers.api.communities.Communities/ListGroups",
      request,
      metadata || {},
      methodDescriptor_Communities_ListGroups,
      callback
    );
  };

/**
 * @param {!proto.org.couchers.api.communities.ListGroupsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.communities.ListGroupsRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.communities.CommunitiesPromiseClient.prototype.listGroups =
  function (request, metadata) {
    return this.client_.unaryCall(
      this.hostname_ + "/org.couchers.api.communities.Communities/ListGroups",
      request,
      metadata || {},
      methodDescriptor_Communities_ListGroups
    );
  };

/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.communities.ListAdminsReq,
 *   !proto.org.couchers.api.communities.ListAdminsRes>}
 */
const methodDescriptor_Communities_ListAdmins = new grpc.web.MethodDescriptor(
  "/org.couchers.api.communities.Communities/ListAdmins",
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.communities.ListAdminsReq,
  proto.org.couchers.api.communities.ListAdminsRes,
  /**
   * @param {!proto.org.couchers.api.communities.ListAdminsReq} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.communities.ListAdminsRes.deserializeBinary
);

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.communities.ListAdminsReq,
 *   !proto.org.couchers.api.communities.ListAdminsRes>}
 */
const methodInfo_Communities_ListAdmins =
  new grpc.web.AbstractClientBase.MethodInfo(
    proto.org.couchers.api.communities.ListAdminsRes,
    /**
     * @param {!proto.org.couchers.api.communities.ListAdminsReq} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    proto.org.couchers.api.communities.ListAdminsRes.deserializeBinary
  );

/**
 * @param {!proto.org.couchers.api.communities.ListAdminsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.communities.ListAdminsRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.communities.ListAdminsRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.communities.CommunitiesClient.prototype.listAdmins =
  function (request, metadata, callback) {
    return this.client_.rpcCall(
      this.hostname_ + "/org.couchers.api.communities.Communities/ListAdmins",
      request,
      metadata || {},
      methodDescriptor_Communities_ListAdmins,
      callback
    );
  };

/**
 * @param {!proto.org.couchers.api.communities.ListAdminsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.communities.ListAdminsRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.communities.CommunitiesPromiseClient.prototype.listAdmins =
  function (request, metadata) {
    return this.client_.unaryCall(
      this.hostname_ + "/org.couchers.api.communities.Communities/ListAdmins",
      request,
      metadata || {},
      methodDescriptor_Communities_ListAdmins
    );
  };

/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.communities.ListMembersReq,
 *   !proto.org.couchers.api.communities.ListMembersRes>}
 */
const methodDescriptor_Communities_ListMembers = new grpc.web.MethodDescriptor(
  "/org.couchers.api.communities.Communities/ListMembers",
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.communities.ListMembersReq,
  proto.org.couchers.api.communities.ListMembersRes,
  /**
   * @param {!proto.org.couchers.api.communities.ListMembersReq} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.communities.ListMembersRes.deserializeBinary
);

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.communities.ListMembersReq,
 *   !proto.org.couchers.api.communities.ListMembersRes>}
 */
const methodInfo_Communities_ListMembers =
  new grpc.web.AbstractClientBase.MethodInfo(
    proto.org.couchers.api.communities.ListMembersRes,
    /**
     * @param {!proto.org.couchers.api.communities.ListMembersReq} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    proto.org.couchers.api.communities.ListMembersRes.deserializeBinary
  );

/**
 * @param {!proto.org.couchers.api.communities.ListMembersReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.communities.ListMembersRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.communities.ListMembersRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.communities.CommunitiesClient.prototype.listMembers =
  function (request, metadata, callback) {
    return this.client_.rpcCall(
      this.hostname_ + "/org.couchers.api.communities.Communities/ListMembers",
      request,
      metadata || {},
      methodDescriptor_Communities_ListMembers,
      callback
    );
  };

/**
 * @param {!proto.org.couchers.api.communities.ListMembersReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.communities.ListMembersRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.communities.CommunitiesPromiseClient.prototype.listMembers =
  function (request, metadata) {
    return this.client_.unaryCall(
      this.hostname_ + "/org.couchers.api.communities.Communities/ListMembers",
      request,
      metadata || {},
      methodDescriptor_Communities_ListMembers
    );
  };

/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.communities.ListNearbyUsersReq,
 *   !proto.org.couchers.api.communities.ListNearbyUsersRes>}
 */
const methodDescriptor_Communities_ListNearbyUsers =
  new grpc.web.MethodDescriptor(
    "/org.couchers.api.communities.Communities/ListNearbyUsers",
    grpc.web.MethodType.UNARY,
    proto.org.couchers.api.communities.ListNearbyUsersReq,
    proto.org.couchers.api.communities.ListNearbyUsersRes,
    /**
     * @param {!proto.org.couchers.api.communities.ListNearbyUsersReq} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    proto.org.couchers.api.communities.ListNearbyUsersRes.deserializeBinary
  );

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.communities.ListNearbyUsersReq,
 *   !proto.org.couchers.api.communities.ListNearbyUsersRes>}
 */
const methodInfo_Communities_ListNearbyUsers =
  new grpc.web.AbstractClientBase.MethodInfo(
    proto.org.couchers.api.communities.ListNearbyUsersRes,
    /**
     * @param {!proto.org.couchers.api.communities.ListNearbyUsersReq} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    proto.org.couchers.api.communities.ListNearbyUsersRes.deserializeBinary
  );

/**
 * @param {!proto.org.couchers.api.communities.ListNearbyUsersReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.communities.ListNearbyUsersRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.communities.ListNearbyUsersRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.communities.CommunitiesClient.prototype.listNearbyUsers =
  function (request, metadata, callback) {
    return this.client_.rpcCall(
      this.hostname_ +
        "/org.couchers.api.communities.Communities/ListNearbyUsers",
      request,
      metadata || {},
      methodDescriptor_Communities_ListNearbyUsers,
      callback
    );
  };

/**
 * @param {!proto.org.couchers.api.communities.ListNearbyUsersReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.communities.ListNearbyUsersRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.communities.CommunitiesPromiseClient.prototype.listNearbyUsers =
  function (request, metadata) {
    return this.client_.unaryCall(
      this.hostname_ +
        "/org.couchers.api.communities.Communities/ListNearbyUsers",
      request,
      metadata || {},
      methodDescriptor_Communities_ListNearbyUsers
    );
  };

/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.communities.ListPlacesReq,
 *   !proto.org.couchers.api.communities.ListPlacesRes>}
 */
const methodDescriptor_Communities_ListPlaces = new grpc.web.MethodDescriptor(
  "/org.couchers.api.communities.Communities/ListPlaces",
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.communities.ListPlacesReq,
  proto.org.couchers.api.communities.ListPlacesRes,
  /**
   * @param {!proto.org.couchers.api.communities.ListPlacesReq} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.communities.ListPlacesRes.deserializeBinary
);

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.communities.ListPlacesReq,
 *   !proto.org.couchers.api.communities.ListPlacesRes>}
 */
const methodInfo_Communities_ListPlaces =
  new grpc.web.AbstractClientBase.MethodInfo(
    proto.org.couchers.api.communities.ListPlacesRes,
    /**
     * @param {!proto.org.couchers.api.communities.ListPlacesReq} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    proto.org.couchers.api.communities.ListPlacesRes.deserializeBinary
  );

/**
 * @param {!proto.org.couchers.api.communities.ListPlacesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.communities.ListPlacesRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.communities.ListPlacesRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.communities.CommunitiesClient.prototype.listPlaces =
  function (request, metadata, callback) {
    return this.client_.rpcCall(
      this.hostname_ + "/org.couchers.api.communities.Communities/ListPlaces",
      request,
      metadata || {},
      methodDescriptor_Communities_ListPlaces,
      callback
    );
  };

/**
 * @param {!proto.org.couchers.api.communities.ListPlacesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.communities.ListPlacesRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.communities.CommunitiesPromiseClient.prototype.listPlaces =
  function (request, metadata) {
    return this.client_.unaryCall(
      this.hostname_ + "/org.couchers.api.communities.Communities/ListPlaces",
      request,
      metadata || {},
      methodDescriptor_Communities_ListPlaces
    );
  };

/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.communities.ListGuidesReq,
 *   !proto.org.couchers.api.communities.ListGuidesRes>}
 */
const methodDescriptor_Communities_ListGuides = new grpc.web.MethodDescriptor(
  "/org.couchers.api.communities.Communities/ListGuides",
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.communities.ListGuidesReq,
  proto.org.couchers.api.communities.ListGuidesRes,
  /**
   * @param {!proto.org.couchers.api.communities.ListGuidesReq} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.communities.ListGuidesRes.deserializeBinary
);

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.communities.ListGuidesReq,
 *   !proto.org.couchers.api.communities.ListGuidesRes>}
 */
const methodInfo_Communities_ListGuides =
  new grpc.web.AbstractClientBase.MethodInfo(
    proto.org.couchers.api.communities.ListGuidesRes,
    /**
     * @param {!proto.org.couchers.api.communities.ListGuidesReq} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    proto.org.couchers.api.communities.ListGuidesRes.deserializeBinary
  );

/**
 * @param {!proto.org.couchers.api.communities.ListGuidesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.communities.ListGuidesRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.communities.ListGuidesRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.communities.CommunitiesClient.prototype.listGuides =
  function (request, metadata, callback) {
    return this.client_.rpcCall(
      this.hostname_ + "/org.couchers.api.communities.Communities/ListGuides",
      request,
      metadata || {},
      methodDescriptor_Communities_ListGuides,
      callback
    );
  };

/**
 * @param {!proto.org.couchers.api.communities.ListGuidesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.communities.ListGuidesRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.communities.CommunitiesPromiseClient.prototype.listGuides =
  function (request, metadata) {
    return this.client_.unaryCall(
      this.hostname_ + "/org.couchers.api.communities.Communities/ListGuides",
      request,
      metadata || {},
      methodDescriptor_Communities_ListGuides
    );
  };

/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.communities.ListEventsReq,
 *   !proto.org.couchers.api.communities.ListEventsRes>}
 */
const methodDescriptor_Communities_ListEvents = new grpc.web.MethodDescriptor(
  "/org.couchers.api.communities.Communities/ListEvents",
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.communities.ListEventsReq,
  proto.org.couchers.api.communities.ListEventsRes,
  /**
   * @param {!proto.org.couchers.api.communities.ListEventsReq} request
   * @return {!Uint8Array}
   */
  function (request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.communities.ListEventsRes.deserializeBinary
);

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.communities.ListEventsReq,
 *   !proto.org.couchers.api.communities.ListEventsRes>}
 */
const methodInfo_Communities_ListEvents =
  new grpc.web.AbstractClientBase.MethodInfo(
    proto.org.couchers.api.communities.ListEventsRes,
    /**
     * @param {!proto.org.couchers.api.communities.ListEventsReq} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    proto.org.couchers.api.communities.ListEventsRes.deserializeBinary
  );

/**
 * @param {!proto.org.couchers.api.communities.ListEventsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.communities.ListEventsRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.communities.ListEventsRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.communities.CommunitiesClient.prototype.listEvents =
  function (request, metadata, callback) {
    return this.client_.rpcCall(
      this.hostname_ + "/org.couchers.api.communities.Communities/ListEvents",
      request,
      metadata || {},
      methodDescriptor_Communities_ListEvents,
      callback
    );
  };

/**
 * @param {!proto.org.couchers.api.communities.ListEventsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.communities.ListEventsRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.communities.CommunitiesPromiseClient.prototype.listEvents =
  function (request, metadata) {
    return this.client_.unaryCall(
      this.hostname_ + "/org.couchers.api.communities.Communities/ListEvents",
      request,
      metadata || {},
      methodDescriptor_Communities_ListEvents
    );
  };

/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.communities.ListDiscussionsReq,
 *   !proto.org.couchers.api.communities.ListDiscussionsRes>}
 */
const methodDescriptor_Communities_ListDiscussions =
  new grpc.web.MethodDescriptor(
    "/org.couchers.api.communities.Communities/ListDiscussions",
    grpc.web.MethodType.UNARY,
    proto.org.couchers.api.communities.ListDiscussionsReq,
    proto.org.couchers.api.communities.ListDiscussionsRes,
    /**
     * @param {!proto.org.couchers.api.communities.ListDiscussionsReq} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    proto.org.couchers.api.communities.ListDiscussionsRes.deserializeBinary
  );

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.communities.ListDiscussionsReq,
 *   !proto.org.couchers.api.communities.ListDiscussionsRes>}
 */
const methodInfo_Communities_ListDiscussions =
  new grpc.web.AbstractClientBase.MethodInfo(
    proto.org.couchers.api.communities.ListDiscussionsRes,
    /**
     * @param {!proto.org.couchers.api.communities.ListDiscussionsReq} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    proto.org.couchers.api.communities.ListDiscussionsRes.deserializeBinary
  );

/**
 * @param {!proto.org.couchers.api.communities.ListDiscussionsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.communities.ListDiscussionsRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.communities.ListDiscussionsRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.communities.CommunitiesClient.prototype.listDiscussions =
  function (request, metadata, callback) {
    return this.client_.rpcCall(
      this.hostname_ +
        "/org.couchers.api.communities.Communities/ListDiscussions",
      request,
      metadata || {},
      methodDescriptor_Communities_ListDiscussions,
      callback
    );
  };

/**
 * @param {!proto.org.couchers.api.communities.ListDiscussionsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.communities.ListDiscussionsRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.communities.CommunitiesPromiseClient.prototype.listDiscussions =
  function (request, metadata) {
    return this.client_.unaryCall(
      this.hostname_ +
        "/org.couchers.api.communities.Communities/ListDiscussions",
      request,
      metadata || {},
      methodDescriptor_Communities_ListDiscussions
    );
  };

/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.communities.JoinCommunityReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Communities_JoinCommunity =
  new grpc.web.MethodDescriptor(
    "/org.couchers.api.communities.Communities/JoinCommunity",
    grpc.web.MethodType.UNARY,
    proto.org.couchers.api.communities.JoinCommunityReq,
    google_protobuf_empty_pb.Empty,
    /**
     * @param {!proto.org.couchers.api.communities.JoinCommunityReq} request
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
 *   !proto.org.couchers.api.communities.JoinCommunityReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Communities_JoinCommunity =
  new grpc.web.AbstractClientBase.MethodInfo(
    google_protobuf_empty_pb.Empty,
    /**
     * @param {!proto.org.couchers.api.communities.JoinCommunityReq} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    google_protobuf_empty_pb.Empty.deserializeBinary
  );

/**
 * @param {!proto.org.couchers.api.communities.JoinCommunityReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.communities.CommunitiesClient.prototype.joinCommunity =
  function (request, metadata, callback) {
    return this.client_.rpcCall(
      this.hostname_ +
        "/org.couchers.api.communities.Communities/JoinCommunity",
      request,
      metadata || {},
      methodDescriptor_Communities_JoinCommunity,
      callback
    );
  };

/**
 * @param {!proto.org.couchers.api.communities.JoinCommunityReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.communities.CommunitiesPromiseClient.prototype.joinCommunity =
  function (request, metadata) {
    return this.client_.unaryCall(
      this.hostname_ +
        "/org.couchers.api.communities.Communities/JoinCommunity",
      request,
      metadata || {},
      methodDescriptor_Communities_JoinCommunity
    );
  };

/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.communities.LeaveCommunityReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Communities_LeaveCommunity =
  new grpc.web.MethodDescriptor(
    "/org.couchers.api.communities.Communities/LeaveCommunity",
    grpc.web.MethodType.UNARY,
    proto.org.couchers.api.communities.LeaveCommunityReq,
    google_protobuf_empty_pb.Empty,
    /**
     * @param {!proto.org.couchers.api.communities.LeaveCommunityReq} request
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
 *   !proto.org.couchers.api.communities.LeaveCommunityReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Communities_LeaveCommunity =
  new grpc.web.AbstractClientBase.MethodInfo(
    google_protobuf_empty_pb.Empty,
    /**
     * @param {!proto.org.couchers.api.communities.LeaveCommunityReq} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    google_protobuf_empty_pb.Empty.deserializeBinary
  );

/**
 * @param {!proto.org.couchers.api.communities.LeaveCommunityReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.communities.CommunitiesClient.prototype.leaveCommunity =
  function (request, metadata, callback) {
    return this.client_.rpcCall(
      this.hostname_ +
        "/org.couchers.api.communities.Communities/LeaveCommunity",
      request,
      metadata || {},
      methodDescriptor_Communities_LeaveCommunity,
      callback
    );
  };

/**
 * @param {!proto.org.couchers.api.communities.LeaveCommunityReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.communities.CommunitiesPromiseClient.prototype.leaveCommunity =
  function (request, metadata) {
    return this.client_.unaryCall(
      this.hostname_ +
        "/org.couchers.api.communities.Communities/LeaveCommunity",
      request,
      metadata || {},
      methodDescriptor_Communities_LeaveCommunity
    );
  };

/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.communities.ListUserCommunitiesReq,
 *   !proto.org.couchers.api.communities.ListUserCommunitiesRes>}
 */
const methodDescriptor_Communities_ListUserCommunities =
  new grpc.web.MethodDescriptor(
    "/org.couchers.api.communities.Communities/ListUserCommunities",
    grpc.web.MethodType.UNARY,
    proto.org.couchers.api.communities.ListUserCommunitiesReq,
    proto.org.couchers.api.communities.ListUserCommunitiesRes,
    /**
     * @param {!proto.org.couchers.api.communities.ListUserCommunitiesReq} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    proto.org.couchers.api.communities.ListUserCommunitiesRes.deserializeBinary
  );

/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.communities.ListUserCommunitiesReq,
 *   !proto.org.couchers.api.communities.ListUserCommunitiesRes>}
 */
const methodInfo_Communities_ListUserCommunities =
  new grpc.web.AbstractClientBase.MethodInfo(
    proto.org.couchers.api.communities.ListUserCommunitiesRes,
    /**
     * @param {!proto.org.couchers.api.communities.ListUserCommunitiesReq} request
     * @return {!Uint8Array}
     */
    function (request) {
      return request.serializeBinary();
    },
    proto.org.couchers.api.communities.ListUserCommunitiesRes.deserializeBinary
  );

/**
 * @param {!proto.org.couchers.api.communities.ListUserCommunitiesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.communities.ListUserCommunitiesRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.communities.ListUserCommunitiesRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.communities.CommunitiesClient.prototype.listUserCommunities =
  function (request, metadata, callback) {
    return this.client_.rpcCall(
      this.hostname_ +
        "/org.couchers.api.communities.Communities/ListUserCommunities",
      request,
      metadata || {},
      methodDescriptor_Communities_ListUserCommunities,
      callback
    );
  };

/**
 * @param {!proto.org.couchers.api.communities.ListUserCommunitiesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.communities.ListUserCommunitiesRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.communities.CommunitiesPromiseClient.prototype.listUserCommunities =
  function (request, metadata) {
    return this.client_.unaryCall(
      this.hostname_ +
        "/org.couchers.api.communities.Communities/ListUserCommunities",
      request,
      metadata || {},
      methodDescriptor_Communities_ListUserCommunities
    );
  };

module.exports = proto.org.couchers.api.communities;
