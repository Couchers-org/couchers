"use strict";
// source: annotations.proto
/**
 * @fileoverview
 * @enhanceable
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
var jspb = require('google-protobuf');
var goog = jspb;
var global = Function('return this')();
var google_protobuf_descriptor_pb = require('google-protobuf/google/protobuf/descriptor_pb.js');
goog.object.extend(proto, google_protobuf_descriptor_pb);
goog.exportSymbol('proto.AuthLevel', null, global);
goog.exportSymbol('proto.authLevel', null, global);
goog.exportSymbol('proto.sensitive', null, global);
/**
 * @enum {number}
 */
proto.AuthLevel = {
    AUTH_LEVEL_UNKNOWN: 0,
    AUTH_LEVEL_OPEN: 1,
    AUTH_LEVEL_JAILED: 2,
    AUTH_LEVEL_SECURE: 3,
    AUTH_LEVEL_ADMIN: 4
};
/**
 * A tuple of {field number, class constructor} for the extension
 * field named `sensitive`.
 * @type {!jspb.ExtensionFieldInfo<boolean>}
 */
proto.sensitive = new jspb.ExtensionFieldInfo(50000, { sensitive: 0 }, null, 
/** @type {?function((boolean|undefined),!jspb.Message=): !Object} */ (null), 0);
google_protobuf_descriptor_pb.FieldOptions.extensionsBinary[50000] = new jspb.ExtensionFieldBinaryInfo(proto.sensitive, jspb.BinaryReader.prototype.readBool, jspb.BinaryWriter.prototype.writeBool, undefined, undefined, false);
// This registers the extension field with the extended class, so that
// toObject() will function correctly.
google_protobuf_descriptor_pb.FieldOptions.extensions[50000] = proto.sensitive;
/**
 * A tuple of {field number, class constructor} for the extension
 * field named `authLevel`.
 * @type {!jspb.ExtensionFieldInfo<!proto.AuthLevel>}
 */
proto.authLevel = new jspb.ExtensionFieldInfo(50001, { authLevel: 0 }, null, 
/** @type {?function((boolean|undefined),!jspb.Message=): !Object} */ (null), 0);
google_protobuf_descriptor_pb.ServiceOptions.extensionsBinary[50001] = new jspb.ExtensionFieldBinaryInfo(proto.authLevel, jspb.BinaryReader.prototype.readEnum, jspb.BinaryWriter.prototype.writeEnum, undefined, undefined, false);
// This registers the extension field with the extended class, so that
// toObject() will function correctly.
google_protobuf_descriptor_pb.ServiceOptions.extensions[50001] = proto.authLevel;
goog.object.extend(exports, proto);
//# sourceMappingURL=annotations_pb.js.map