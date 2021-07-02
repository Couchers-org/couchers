/**
 * @fileoverview gRPC-Web generated client stub for org.couchers.api.events
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

var google_protobuf_wrappers_pb = require('google-protobuf/google/protobuf/wrappers_pb.js')
const proto = {};
proto.org = {};
proto.org.couchers = {};
proto.org.couchers.api = {};
proto.org.couchers.api.events = require('./events_pb.js');

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.org.couchers.api.events.EventsClient =
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
proto.org.couchers.api.events.EventsPromiseClient =
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
 *   !proto.org.couchers.api.events.CreateEventReq,
 *   !proto.org.couchers.api.events.Event>}
 */
const methodDescriptor_Events_CreateEvent = new grpc.web.MethodDescriptor(
  '/org.couchers.api.events.Events/CreateEvent',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.events.CreateEventReq,
  proto.org.couchers.api.events.Event,
  /**
   * @param {!proto.org.couchers.api.events.CreateEventReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.events.Event.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.events.CreateEventReq,
 *   !proto.org.couchers.api.events.Event>}
 */
const methodInfo_Events_CreateEvent = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.events.Event,
  /**
   * @param {!proto.org.couchers.api.events.CreateEventReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.events.Event.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.events.CreateEventReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.events.Event)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.events.Event>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.events.EventsClient.prototype.createEvent =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.events.Events/CreateEvent',
      request,
      metadata || {},
      methodDescriptor_Events_CreateEvent,
      callback);
};


/**
 * @param {!proto.org.couchers.api.events.CreateEventReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.events.Event>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.events.EventsPromiseClient.prototype.createEvent =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.events.Events/CreateEvent',
      request,
      metadata || {},
      methodDescriptor_Events_CreateEvent);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.events.ScheduleEventReq,
 *   !proto.org.couchers.api.events.Event>}
 */
const methodDescriptor_Events_ScheduleEvent = new grpc.web.MethodDescriptor(
  '/org.couchers.api.events.Events/ScheduleEvent',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.events.ScheduleEventReq,
  proto.org.couchers.api.events.Event,
  /**
   * @param {!proto.org.couchers.api.events.ScheduleEventReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.events.Event.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.events.ScheduleEventReq,
 *   !proto.org.couchers.api.events.Event>}
 */
const methodInfo_Events_ScheduleEvent = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.events.Event,
  /**
   * @param {!proto.org.couchers.api.events.ScheduleEventReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.events.Event.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.events.ScheduleEventReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.events.Event)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.events.Event>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.events.EventsClient.prototype.scheduleEvent =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.events.Events/ScheduleEvent',
      request,
      metadata || {},
      methodDescriptor_Events_ScheduleEvent,
      callback);
};


/**
 * @param {!proto.org.couchers.api.events.ScheduleEventReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.events.Event>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.events.EventsPromiseClient.prototype.scheduleEvent =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.events.Events/ScheduleEvent',
      request,
      metadata || {},
      methodDescriptor_Events_ScheduleEvent);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.events.UpdateEventReq,
 *   !proto.org.couchers.api.events.Event>}
 */
const methodDescriptor_Events_UpdateEvent = new grpc.web.MethodDescriptor(
  '/org.couchers.api.events.Events/UpdateEvent',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.events.UpdateEventReq,
  proto.org.couchers.api.events.Event,
  /**
   * @param {!proto.org.couchers.api.events.UpdateEventReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.events.Event.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.events.UpdateEventReq,
 *   !proto.org.couchers.api.events.Event>}
 */
const methodInfo_Events_UpdateEvent = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.events.Event,
  /**
   * @param {!proto.org.couchers.api.events.UpdateEventReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.events.Event.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.events.UpdateEventReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.events.Event)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.events.Event>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.events.EventsClient.prototype.updateEvent =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.events.Events/UpdateEvent',
      request,
      metadata || {},
      methodDescriptor_Events_UpdateEvent,
      callback);
};


/**
 * @param {!proto.org.couchers.api.events.UpdateEventReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.events.Event>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.events.EventsPromiseClient.prototype.updateEvent =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.events.Events/UpdateEvent',
      request,
      metadata || {},
      methodDescriptor_Events_UpdateEvent);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.events.GetEventReq,
 *   !proto.org.couchers.api.events.Event>}
 */
const methodDescriptor_Events_GetEvent = new grpc.web.MethodDescriptor(
  '/org.couchers.api.events.Events/GetEvent',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.events.GetEventReq,
  proto.org.couchers.api.events.Event,
  /**
   * @param {!proto.org.couchers.api.events.GetEventReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.events.Event.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.events.GetEventReq,
 *   !proto.org.couchers.api.events.Event>}
 */
const methodInfo_Events_GetEvent = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.events.Event,
  /**
   * @param {!proto.org.couchers.api.events.GetEventReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.events.Event.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.events.GetEventReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.events.Event)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.events.Event>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.events.EventsClient.prototype.getEvent =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.events.Events/GetEvent',
      request,
      metadata || {},
      methodDescriptor_Events_GetEvent,
      callback);
};


/**
 * @param {!proto.org.couchers.api.events.GetEventReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.events.Event>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.events.EventsPromiseClient.prototype.getEvent =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.events.Events/GetEvent',
      request,
      metadata || {},
      methodDescriptor_Events_GetEvent);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.events.ListEventOccurrencesReq,
 *   !proto.org.couchers.api.events.ListEventOccurrencesRes>}
 */
const methodDescriptor_Events_ListEventOccurrences = new grpc.web.MethodDescriptor(
  '/org.couchers.api.events.Events/ListEventOccurrences',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.events.ListEventOccurrencesReq,
  proto.org.couchers.api.events.ListEventOccurrencesRes,
  /**
   * @param {!proto.org.couchers.api.events.ListEventOccurrencesReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.events.ListEventOccurrencesRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.events.ListEventOccurrencesReq,
 *   !proto.org.couchers.api.events.ListEventOccurrencesRes>}
 */
const methodInfo_Events_ListEventOccurrences = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.events.ListEventOccurrencesRes,
  /**
   * @param {!proto.org.couchers.api.events.ListEventOccurrencesReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.events.ListEventOccurrencesRes.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.events.ListEventOccurrencesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.events.ListEventOccurrencesRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.events.ListEventOccurrencesRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.events.EventsClient.prototype.listEventOccurrences =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.events.Events/ListEventOccurrences',
      request,
      metadata || {},
      methodDescriptor_Events_ListEventOccurrences,
      callback);
};


/**
 * @param {!proto.org.couchers.api.events.ListEventOccurrencesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.events.ListEventOccurrencesRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.events.EventsPromiseClient.prototype.listEventOccurrences =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.events.Events/ListEventOccurrences',
      request,
      metadata || {},
      methodDescriptor_Events_ListEventOccurrences);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.events.ListEventAttendeesReq,
 *   !proto.org.couchers.api.events.ListEventAttendeesRes>}
 */
const methodDescriptor_Events_ListEventAttendees = new grpc.web.MethodDescriptor(
  '/org.couchers.api.events.Events/ListEventAttendees',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.events.ListEventAttendeesReq,
  proto.org.couchers.api.events.ListEventAttendeesRes,
  /**
   * @param {!proto.org.couchers.api.events.ListEventAttendeesReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.events.ListEventAttendeesRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.events.ListEventAttendeesReq,
 *   !proto.org.couchers.api.events.ListEventAttendeesRes>}
 */
const methodInfo_Events_ListEventAttendees = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.events.ListEventAttendeesRes,
  /**
   * @param {!proto.org.couchers.api.events.ListEventAttendeesReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.events.ListEventAttendeesRes.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.events.ListEventAttendeesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.events.ListEventAttendeesRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.events.ListEventAttendeesRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.events.EventsClient.prototype.listEventAttendees =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.events.Events/ListEventAttendees',
      request,
      metadata || {},
      methodDescriptor_Events_ListEventAttendees,
      callback);
};


/**
 * @param {!proto.org.couchers.api.events.ListEventAttendeesReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.events.ListEventAttendeesRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.events.EventsPromiseClient.prototype.listEventAttendees =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.events.Events/ListEventAttendees',
      request,
      metadata || {},
      methodDescriptor_Events_ListEventAttendees);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.events.ListEventSubscribersReq,
 *   !proto.org.couchers.api.events.ListEventSubscribersRes>}
 */
const methodDescriptor_Events_ListEventSubscribers = new grpc.web.MethodDescriptor(
  '/org.couchers.api.events.Events/ListEventSubscribers',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.events.ListEventSubscribersReq,
  proto.org.couchers.api.events.ListEventSubscribersRes,
  /**
   * @param {!proto.org.couchers.api.events.ListEventSubscribersReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.events.ListEventSubscribersRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.events.ListEventSubscribersReq,
 *   !proto.org.couchers.api.events.ListEventSubscribersRes>}
 */
const methodInfo_Events_ListEventSubscribers = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.events.ListEventSubscribersRes,
  /**
   * @param {!proto.org.couchers.api.events.ListEventSubscribersReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.events.ListEventSubscribersRes.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.events.ListEventSubscribersReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.events.ListEventSubscribersRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.events.ListEventSubscribersRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.events.EventsClient.prototype.listEventSubscribers =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.events.Events/ListEventSubscribers',
      request,
      metadata || {},
      methodDescriptor_Events_ListEventSubscribers,
      callback);
};


/**
 * @param {!proto.org.couchers.api.events.ListEventSubscribersReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.events.ListEventSubscribersRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.events.EventsPromiseClient.prototype.listEventSubscribers =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.events.Events/ListEventSubscribers',
      request,
      metadata || {},
      methodDescriptor_Events_ListEventSubscribers);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.events.ListEventOrganizersReq,
 *   !proto.org.couchers.api.events.ListEventOrganizersRes>}
 */
const methodDescriptor_Events_ListEventOrganizers = new grpc.web.MethodDescriptor(
  '/org.couchers.api.events.Events/ListEventOrganizers',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.events.ListEventOrganizersReq,
  proto.org.couchers.api.events.ListEventOrganizersRes,
  /**
   * @param {!proto.org.couchers.api.events.ListEventOrganizersReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.events.ListEventOrganizersRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.events.ListEventOrganizersReq,
 *   !proto.org.couchers.api.events.ListEventOrganizersRes>}
 */
const methodInfo_Events_ListEventOrganizers = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.events.ListEventOrganizersRes,
  /**
   * @param {!proto.org.couchers.api.events.ListEventOrganizersReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.events.ListEventOrganizersRes.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.events.ListEventOrganizersReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.events.ListEventOrganizersRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.events.ListEventOrganizersRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.events.EventsClient.prototype.listEventOrganizers =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.events.Events/ListEventOrganizers',
      request,
      metadata || {},
      methodDescriptor_Events_ListEventOrganizers,
      callback);
};


/**
 * @param {!proto.org.couchers.api.events.ListEventOrganizersReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.events.ListEventOrganizersRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.events.EventsPromiseClient.prototype.listEventOrganizers =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.events.Events/ListEventOrganizers',
      request,
      metadata || {},
      methodDescriptor_Events_ListEventOrganizers);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.events.TransferEventReq,
 *   !proto.org.couchers.api.events.Event>}
 */
const methodDescriptor_Events_TransferEvent = new grpc.web.MethodDescriptor(
  '/org.couchers.api.events.Events/TransferEvent',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.events.TransferEventReq,
  proto.org.couchers.api.events.Event,
  /**
   * @param {!proto.org.couchers.api.events.TransferEventReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.events.Event.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.events.TransferEventReq,
 *   !proto.org.couchers.api.events.Event>}
 */
const methodInfo_Events_TransferEvent = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.events.Event,
  /**
   * @param {!proto.org.couchers.api.events.TransferEventReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.events.Event.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.events.TransferEventReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.events.Event)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.events.Event>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.events.EventsClient.prototype.transferEvent =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.events.Events/TransferEvent',
      request,
      metadata || {},
      methodDescriptor_Events_TransferEvent,
      callback);
};


/**
 * @param {!proto.org.couchers.api.events.TransferEventReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.events.Event>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.events.EventsPromiseClient.prototype.transferEvent =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.events.Events/TransferEvent',
      request,
      metadata || {},
      methodDescriptor_Events_TransferEvent);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.events.SetEventSubscriptionReq,
 *   !proto.org.couchers.api.events.Event>}
 */
const methodDescriptor_Events_SetEventSubscription = new grpc.web.MethodDescriptor(
  '/org.couchers.api.events.Events/SetEventSubscription',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.events.SetEventSubscriptionReq,
  proto.org.couchers.api.events.Event,
  /**
   * @param {!proto.org.couchers.api.events.SetEventSubscriptionReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.events.Event.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.events.SetEventSubscriptionReq,
 *   !proto.org.couchers.api.events.Event>}
 */
const methodInfo_Events_SetEventSubscription = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.events.Event,
  /**
   * @param {!proto.org.couchers.api.events.SetEventSubscriptionReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.events.Event.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.events.SetEventSubscriptionReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.events.Event)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.events.Event>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.events.EventsClient.prototype.setEventSubscription =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.events.Events/SetEventSubscription',
      request,
      metadata || {},
      methodDescriptor_Events_SetEventSubscription,
      callback);
};


/**
 * @param {!proto.org.couchers.api.events.SetEventSubscriptionReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.events.Event>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.events.EventsPromiseClient.prototype.setEventSubscription =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.events.Events/SetEventSubscription',
      request,
      metadata || {},
      methodDescriptor_Events_SetEventSubscription);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.events.SetEventAttendanceReq,
 *   !proto.org.couchers.api.events.Event>}
 */
const methodDescriptor_Events_SetEventAttendance = new grpc.web.MethodDescriptor(
  '/org.couchers.api.events.Events/SetEventAttendance',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.events.SetEventAttendanceReq,
  proto.org.couchers.api.events.Event,
  /**
   * @param {!proto.org.couchers.api.events.SetEventAttendanceReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.events.Event.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.events.SetEventAttendanceReq,
 *   !proto.org.couchers.api.events.Event>}
 */
const methodInfo_Events_SetEventAttendance = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.events.Event,
  /**
   * @param {!proto.org.couchers.api.events.SetEventAttendanceReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.events.Event.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.events.SetEventAttendanceReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.events.Event)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.events.Event>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.events.EventsClient.prototype.setEventAttendance =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.events.Events/SetEventAttendance',
      request,
      metadata || {},
      methodDescriptor_Events_SetEventAttendance,
      callback);
};


/**
 * @param {!proto.org.couchers.api.events.SetEventAttendanceReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.events.Event>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.events.EventsPromiseClient.prototype.setEventAttendance =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.events.Events/SetEventAttendance',
      request,
      metadata || {},
      methodDescriptor_Events_SetEventAttendance);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.events.InviteEventOrganizerReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Events_InviteEventOrganizer = new grpc.web.MethodDescriptor(
  '/org.couchers.api.events.Events/InviteEventOrganizer',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.events.InviteEventOrganizerReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.org.couchers.api.events.InviteEventOrganizerReq} request
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
 *   !proto.org.couchers.api.events.InviteEventOrganizerReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Events_InviteEventOrganizer = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.org.couchers.api.events.InviteEventOrganizerReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.events.InviteEventOrganizerReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.events.EventsClient.prototype.inviteEventOrganizer =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.events.Events/InviteEventOrganizer',
      request,
      metadata || {},
      methodDescriptor_Events_InviteEventOrganizer,
      callback);
};


/**
 * @param {!proto.org.couchers.api.events.InviteEventOrganizerReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.events.EventsPromiseClient.prototype.inviteEventOrganizer =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.events.Events/InviteEventOrganizer',
      request,
      metadata || {},
      methodDescriptor_Events_InviteEventOrganizer);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.events.RemoveEventOrganizerReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodDescriptor_Events_RemoveEventOrganizer = new grpc.web.MethodDescriptor(
  '/org.couchers.api.events.Events/RemoveEventOrganizer',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.events.RemoveEventOrganizerReq,
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.org.couchers.api.events.RemoveEventOrganizerReq} request
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
 *   !proto.org.couchers.api.events.RemoveEventOrganizerReq,
 *   !proto.google.protobuf.Empty>}
 */
const methodInfo_Events_RemoveEventOrganizer = new grpc.web.AbstractClientBase.MethodInfo(
  google_protobuf_empty_pb.Empty,
  /**
   * @param {!proto.org.couchers.api.events.RemoveEventOrganizerReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  google_protobuf_empty_pb.Empty.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.events.RemoveEventOrganizerReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.google.protobuf.Empty)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.google.protobuf.Empty>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.events.EventsClient.prototype.removeEventOrganizer =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.events.Events/RemoveEventOrganizer',
      request,
      metadata || {},
      methodDescriptor_Events_RemoveEventOrganizer,
      callback);
};


/**
 * @param {!proto.org.couchers.api.events.RemoveEventOrganizerReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.google.protobuf.Empty>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.events.EventsPromiseClient.prototype.removeEventOrganizer =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.events.Events/RemoveEventOrganizer',
      request,
      metadata || {},
      methodDescriptor_Events_RemoveEventOrganizer);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.org.couchers.api.events.ListMyEventsReq,
 *   !proto.org.couchers.api.events.ListMyEventsRes>}
 */
const methodDescriptor_Events_ListMyEvents = new grpc.web.MethodDescriptor(
  '/org.couchers.api.events.Events/ListMyEvents',
  grpc.web.MethodType.UNARY,
  proto.org.couchers.api.events.ListMyEventsReq,
  proto.org.couchers.api.events.ListMyEventsRes,
  /**
   * @param {!proto.org.couchers.api.events.ListMyEventsReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.events.ListMyEventsRes.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.org.couchers.api.events.ListMyEventsReq,
 *   !proto.org.couchers.api.events.ListMyEventsRes>}
 */
const methodInfo_Events_ListMyEvents = new grpc.web.AbstractClientBase.MethodInfo(
  proto.org.couchers.api.events.ListMyEventsRes,
  /**
   * @param {!proto.org.couchers.api.events.ListMyEventsReq} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.org.couchers.api.events.ListMyEventsRes.deserializeBinary
);


/**
 * @param {!proto.org.couchers.api.events.ListMyEventsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.org.couchers.api.events.ListMyEventsRes)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.org.couchers.api.events.ListMyEventsRes>|undefined}
 *     The XHR Node Readable Stream
 */
proto.org.couchers.api.events.EventsClient.prototype.listMyEvents =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/org.couchers.api.events.Events/ListMyEvents',
      request,
      metadata || {},
      methodDescriptor_Events_ListMyEvents,
      callback);
};


/**
 * @param {!proto.org.couchers.api.events.ListMyEventsReq} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.org.couchers.api.events.ListMyEventsRes>}
 *     Promise that resolves to the response
 */
proto.org.couchers.api.events.EventsPromiseClient.prototype.listMyEvents =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/org.couchers.api.events.Events/ListMyEvents',
      request,
      metadata || {},
      methodDescriptor_Events_ListMyEvents);
};


module.exports = proto.org.couchers.api.events;

