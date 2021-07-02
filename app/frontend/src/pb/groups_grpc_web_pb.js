/**
 * @fileoverview gRPC-Web generated client stub for org.couchers.api.groups
 * @enhanceable
 * @public
 */

// GENERATED CODE -- DO NOT EDIT!


/* eslint-disable */
// @ts-nocheck



const grpc = {};
grpc.web = require('grpc-web');


var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js')

var google_protobuf_timestamp_pb = require('google-protobuf/google/protobuf/timestamp_pb.js')

var pb_discussions_pb = require('../pb/discussions_pb.js')

var pb_pages_pb = require('../pb/pages_pb.js')
const proto = {};
proto.org = {};
proto.org.couchers = {};
proto.org.couchers.api = {};
proto.org.couchers.api.groups = require('./groups_pb.js');

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.org.couchers.api.groups.GroupsClient =
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
proto.org.couchers.api.groups.GroupsPromiseClient =
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
 *   !proto.org.couchers.api.groups.GetGroupReq,
 *   !proto.org.couchers.api.groups.Group>}
 */
const methodDescriptor_Groups_GetGroup = new grpc.web.MethodDescriptor(
  '/org.couchers.api.groups.Groups/GetGroup',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.groups.GetGroupReq,
  proto.org.couchers.api.groups.Group,
  /**
   * @param {!proto.org.couchers.api.groups.GetGroupReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.groups.Group.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.groups.GetGroupReq,
 *   !proto.org.couchers.api.groups.Group>}
 */
const methodInfo_Groups_GetGroup = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.groups.Group,
  /**
   * @param {!proto.org.couchers.api.groups.GetGroupReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.groups.Group.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.groups.GetGroupReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.groups.Group)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.groups.Group>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.groups.GroupsClient.prototype.getGroup =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.groups.Groups/GetGroup',
      request,
      metadata || {},
      methodDescriptor_Groups_GetGroup,
      callback);
};


/**
 * @param {!proto.org.couchers.api.groups.GetGroupReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.groups.Group>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.groups.GroupsPromiseClient.prototype.getGroup =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.groups.Groups/GetGroup',
      request,
      metadata || {},
      methodDescriptor_Groups_GetGroup);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.groups.ListAdminsReq,
 *   !proto.org.couchers.api.groups.ListAdminsRes>}
 */
const methodDescriptor_Groups_ListAdmins = new grpc.web.MethodDescriptor(
  '/org.couchers.api.groups.Groups/ListAdmins',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.groups.ListAdminsReq,
  proto.org.couchers.api.groups.ListAdminsRes,
  /**
   * @param {!proto.org.couchers.api.groups.ListAdminsReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.groups.ListAdminsRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.groups.ListAdminsReq,
 *   !proto.org.couchers.api.groups.ListAdminsRes>}
 */
const methodInfo_Groups_ListAdmins = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.groups.ListAdminsRes,
  /**
   * @param {!proto.org.couchers.api.groups.ListAdminsReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.groups.ListAdminsRes.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.groups.ListAdminsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.groups.ListAdminsRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.groups.ListAdminsRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.groups.GroupsClient.prototype.listAdmins =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.groups.Groups/ListAdmins',
      request,
      metadata || {},
      methodDescriptor_Groups_ListAdmins,
      callback);
};


/**
 * @param {!proto.org.couchers.api.groups.ListAdminsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.groups.ListAdminsRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.groups.GroupsPromiseClient.prototype.listAdmins =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.groups.Groups/ListAdmins',
      request,
      metadata || {},
      methodDescriptor_Groups_ListAdmins);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.groups.ListMembersReq,
 *   !proto.org.couchers.api.groups.ListMembersRes>}
 */
const methodDescriptor_Groups_ListMembers = new grpc.web.MethodDescriptor(
  '/org.couchers.api.groups.Groups/ListMembers',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.groups.ListMembersReq,
  proto.org.couchers.api.groups.ListMembersRes,
  /**
   * @param {!proto.org.couchers.api.groups.ListMembersReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.groups.ListMembersRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.groups.ListMembersReq,
 *   !proto.org.couchers.api.groups.ListMembersRes>}
 */
const methodInfo_Groups_ListMembers = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.groups.ListMembersRes,
  /**
   * @param {!proto.org.couchers.api.groups.ListMembersReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.groups.ListMembersRes.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.groups.ListMembersReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.groups.ListMembersRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.groups.ListMembersRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.groups.GroupsClient.prototype.listMembers =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.groups.Groups/ListMembers',
      request,
      metadata || {},
      methodDescriptor_Groups_ListMembers,
      callback);
};


/**
 * @param {!proto.org.couchers.api.groups.ListMembersReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.groups.ListMembersRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.groups.GroupsPromiseClient.prototype.listMembers =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.groups.Groups/ListMembers',
      request,
      metadata || {},
      methodDescriptor_Groups_ListMembers);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.groups.ListPlacesReq,
 *   !proto.org.couchers.api.groups.ListPlacesRes>}
 */
const methodDescriptor_Groups_ListPlaces = new grpc.web.MethodDescriptor(
  '/org.couchers.api.groups.Groups/ListPlaces',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.groups.ListPlacesReq,
  proto.org.couchers.api.groups.ListPlacesRes,
  /**
   * @param {!proto.org.couchers.api.groups.ListPlacesReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.groups.ListPlacesRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.groups.ListPlacesReq,
 *   !proto.org.couchers.api.groups.ListPlacesRes>}
 */
const methodInfo_Groups_ListPlaces = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.groups.ListPlacesRes,
  /**
   * @param {!proto.org.couchers.api.groups.ListPlacesReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.groups.ListPlacesRes.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.groups.ListPlacesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.groups.ListPlacesRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.groups.ListPlacesRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.groups.GroupsClient.prototype.listPlaces =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.groups.Groups/ListPlaces',
      request,
      metadata || {},
      methodDescriptor_Groups_ListPlaces,
      callback);
};


/**
 * @param {!proto.org.couchers.api.groups.ListPlacesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.groups.ListPlacesRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.groups.GroupsPromiseClient.prototype.listPlaces =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.groups.Groups/ListPlaces',
      request,
      metadata || {},
      methodDescriptor_Groups_ListPlaces);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.groups.ListGuidesReq,
 *   !proto.org.couchers.api.groups.ListGuidesRes>}
 */
const methodDescriptor_Groups_ListGuides = new grpc.web.MethodDescriptor(
  '/org.couchers.api.groups.Groups/ListGuides',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.groups.ListGuidesReq,
  proto.org.couchers.api.groups.ListGuidesRes,
  /**
   * @param {!proto.org.couchers.api.groups.ListGuidesReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.groups.ListGuidesRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.groups.ListGuidesReq,
 *   !proto.org.couchers.api.groups.ListGuidesRes>}
 */
const methodInfo_Groups_ListGuides = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.groups.ListGuidesRes,
  /**
   * @param {!proto.org.couchers.api.groups.ListGuidesReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.groups.ListGuidesRes.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.groups.ListGuidesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.groups.ListGuidesRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.groups.ListGuidesRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.groups.GroupsClient.prototype.listGuides =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.groups.Groups/ListGuides',
      request,
      metadata || {},
      methodDescriptor_Groups_ListGuides,
      callback);
};


/**
 * @param {!proto.org.couchers.api.groups.ListGuidesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.groups.ListGuidesRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.groups.GroupsPromiseClient.prototype.listGuides =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.groups.Groups/ListGuides',
      request,
      metadata || {},
      methodDescriptor_Groups_ListGuides);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.groups.ListEventsReq,
 *   !proto.org.couchers.api.groups.ListEventsRes>}
 */
const methodDescriptor_Groups_ListEvents = new grpc.web.MethodDescriptor(
  '/org.couchers.api.groups.Groups/ListEvents',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.groups.ListEventsReq,
  proto.org.couchers.api.groups.ListEventsRes,
  /**
   * @param {!proto.org.couchers.api.groups.ListEventsReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.groups.ListEventsRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.groups.ListEventsReq,
 *   !proto.org.couchers.api.groups.ListEventsRes>}
 */
const methodInfo_Groups_ListEvents = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.groups.ListEventsRes,
  /**
   * @param {!proto.org.couchers.api.groups.ListEventsReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.groups.ListEventsRes.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.groups.ListEventsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.groups.ListEventsRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.groups.ListEventsRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.groups.GroupsClient.prototype.listEvents =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.groups.Groups/ListEvents',
      request,
      metadata || {},
      methodDescriptor_Groups_ListEvents,
      callback);
};


/**
 * @param {!proto.org.couchers.api.groups.ListEventsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.groups.ListEventsRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.groups.GroupsPromiseClient.prototype.listEvents =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.groups.Groups/ListEvents',
      request,
      metadata || {},
      methodDescriptor_Groups_ListEvents);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.groups.ListDiscussionsReq,
 *   !proto.org.couchers.api.groups.ListDiscussionsRes>}
 */
const methodDescriptor_Groups_ListDiscussions = new grpc.web.MethodDescriptor(
  '/org.couchers.api.groups.Groups/ListDiscussions',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.groups.ListDiscussionsReq,
  proto.org.couchers.api.groups.ListDiscussionsRes,
  /**
   * @param {!proto.org.couchers.api.groups.ListDiscussionsReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.groups.ListDiscussionsRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.groups.ListDiscussionsReq,
 *   !proto.org.couchers.api.groups.ListDiscussionsRes>}
 */
const methodInfo_Groups_ListDiscussions = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.groups.ListDiscussionsRes,
  /**
   * @param {!proto.org.couchers.api.groups.ListDiscussionsReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.groups.ListDiscussionsRes.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.groups.ListDiscussionsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.groups.ListDiscussionsRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.groups.ListDiscussionsRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.groups.GroupsClient.prototype.listDiscussions =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.groups.Groups/ListDiscussions',
      request,
      metadata || {},
      methodDescriptor_Groups_ListDiscussions,
      callback);
};


/**
 * @param {!proto.org.couchers.api.groups.ListDiscussionsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.groups.ListDiscussionsRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.groups.GroupsPromiseClient.prototype.listDiscussions =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.groups.Groups/ListDiscussions',
      request,
      metadata || {},
      methodDescriptor_Groups_ListDiscussions);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.groups.JoinGroupReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Groups_JoinGroup = new grpc.web.MethodDescriptor(
  '/org.couchers.api.groups.Groups/JoinGroup',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.groups.JoinGroupReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.org.couchers.api.groups.JoinGroupReq} request
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
 *   !proto.org.couchers.api.groups.JoinGroupReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Groups_JoinGroup = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.org.couchers.api.groups.JoinGroupReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.groups.JoinGroupReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.groups.GroupsClient.prototype.joinGroup =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.groups.Groups/JoinGroup',
      request,
      metadata || {},
      methodDescriptor_Groups_JoinGroup,
      callback);
};


/**
 * @param {!proto.org.couchers.api.groups.JoinGroupReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.groups.GroupsPromiseClient.prototype.joinGroup =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.groups.Groups/JoinGroup',
      request,
      metadata || {},
      methodDescriptor_Groups_JoinGroup);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.groups.LeaveGroupReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Groups_LeaveGroup = new grpc.web.MethodDescriptor(
  '/org.couchers.api.groups.Groups/LeaveGroup',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.groups.LeaveGroupReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.org.couchers.api.groups.LeaveGroupReq} request
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
 *   !proto.org.couchers.api.groups.LeaveGroupReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Groups_LeaveGroup = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.org.couchers.api.groups.LeaveGroupReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.groups.LeaveGroupReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.groups.GroupsClient.prototype.leaveGroup =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.groups.Groups/LeaveGroup',
      request,
      metadata || {},
      methodDescriptor_Groups_LeaveGroup,
      callback);
};


/**
 * @param {!proto.org.couchers.api.groups.LeaveGroupReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.groups.GroupsPromiseClient.prototype.leaveGroup =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.groups.Groups/LeaveGroup',
      request,
      metadata || {},
      methodDescriptor_Groups_LeaveGroup);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.groups.ListUserGroupsReq,
 *   !proto.org.couchers.api.groups.ListUserGroupsRes>}
 */
const methodDescriptor_Groups_ListUserGroups = new grpc.web.MethodDescriptor(
  '/org.couchers.api.groups.Groups/ListUserGroups',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.groups.ListUserGroupsReq,
  proto.org.couchers.api.groups.ListUserGroupsRes,
  /**
   * @param {!proto.org.couchers.api.groups.ListUserGroupsReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.groups.ListUserGroupsRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.groups.ListUserGroupsReq,
 *   !proto.org.couchers.api.groups.ListUserGroupsRes>}
 */
const methodInfo_Groups_ListUserGroups = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.groups.ListUserGroupsRes,
  /**
   * @param {!proto.org.couchers.api.groups.ListUserGroupsReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.groups.ListUserGroupsRes.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.groups.ListUserGroupsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.groups.ListUserGroupsRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.groups.ListUserGroupsRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.groups.GroupsClient.prototype.listUserGroups =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.groups.Groups/ListUserGroups',
      request,
      metadata || {},
      methodDescriptor_Groups_ListUserGroups,
      callback);
};


/**
 * @param {!proto.org.couchers.api.groups.ListUserGroupsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.groups.ListUserGroupsRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.groups.GroupsPromiseClient.prototype.listUserGroups =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.groups.Groups/ListUserGroups',
      request,
      metadata || {},
      methodDescriptor_Groups_ListUserGroups);
};


module.exports = proto.org.couchers.api.groups;

