var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import { StringValue } from "google-protobuf/google/protobuf/wrappers_pb";
import { ListEventsReq } from "proto/communities_pb";
import { CreateEventReq, GetEventReq, ListEventAttendeesReq, ListEventOrganizersReq, OfflineEventInformation, OnlineEventInformation, SetEventAttendanceReq, UpdateEventReq, } from "proto/events_pb";
import client from "service/client";
export function listCommunityEvents(communityId, pageToken, pageSize) {
    return __awaiter(this, void 0, void 0, function () {
        var req, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new ListEventsReq();
                    req.setCommunityId(communityId);
                    if (pageToken) {
                        req.setPageToken(pageToken);
                    }
                    if (pageSize) {
                        req.setPageSize(pageSize);
                    }
                    return [4 /*yield*/, client.communities.listEvents(req)];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, res.toObject()];
            }
        });
    });
}
export function getEvent(eventId) {
    return __awaiter(this, void 0, void 0, function () {
        var req, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new GetEventReq();
                    req.setEventId(eventId);
                    return [4 /*yield*/, client.events.getEvent(req)];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, res.toObject()];
            }
        });
    });
}
export function listEventOrganisers(_a) {
    var eventId = _a.eventId, pageSize = _a.pageSize, pageToken = _a.pageToken;
    return __awaiter(this, void 0, void 0, function () {
        var req, res;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    req = new ListEventOrganizersReq();
                    req.setEventId(eventId);
                    if (pageSize) {
                        req.setPageSize(pageSize);
                    }
                    if (pageToken) {
                        req.setPageToken(pageToken);
                    }
                    return [4 /*yield*/, client.events.listEventOrganizers(req)];
                case 1:
                    res = _b.sent();
                    return [2 /*return*/, res.toObject()];
            }
        });
    });
}
export function listEventAttendees(_a) {
    var eventId = _a.eventId, pageSize = _a.pageSize, pageToken = _a.pageToken;
    return __awaiter(this, void 0, void 0, function () {
        var req, res;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    req = new ListEventAttendeesReq();
                    req.setEventId(eventId);
                    if (pageSize) {
                        req.setPageSize(pageSize);
                    }
                    if (pageToken) {
                        req.setPageToken(pageToken);
                    }
                    return [4 /*yield*/, client.events.listEventAttendees(req)];
                case 1:
                    res = _b.sent();
                    return [2 /*return*/, res.toObject()];
            }
        });
    });
}
export function setEventAttendance(_a) {
    var attendanceState = _a.attendanceState, eventId = _a.eventId;
    return __awaiter(this, void 0, void 0, function () {
        var req, res;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    req = new SetEventAttendanceReq();
                    req.setEventId(eventId);
                    req.setAttendanceState(attendanceState);
                    return [4 /*yield*/, client.events.setEventAttendance(req)];
                case 1:
                    res = _b.sent();
                    return [2 /*return*/, res.toObject()];
            }
        });
    });
}
export function createEvent(input) {
    return __awaiter(this, void 0, void 0, function () {
        var req, onlineEventInfo, offlineEventInfo, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new CreateEventReq();
                    req.setTitle(input.title);
                    req.setContent(input.content);
                    req.setStartTime(Timestamp.fromDate(input.startTime));
                    req.setEndTime(Timestamp.fromDate(input.endTime));
                    if (input.photoKey) {
                        req.setPhotoKey(input.photoKey);
                    }
                    if (input.isOnline) {
                        onlineEventInfo = new OnlineEventInformation();
                        onlineEventInfo.setLink(input.link);
                        req.setParentCommunityId(input.parentCommunityId);
                        req.setOnlineInformation(onlineEventInfo);
                    }
                    else {
                        offlineEventInfo = new OfflineEventInformation();
                        offlineEventInfo.setAddress(input.address);
                        offlineEventInfo.setLat(input.lat);
                        offlineEventInfo.setLng(input.lng);
                        req.setOfflineInformation(offlineEventInfo);
                        if (input.parentCommunityId) {
                            req.setParentCommunityId(input.parentCommunityId);
                        }
                    }
                    return [4 /*yield*/, client.events.createEvent(req)];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, res.toObject()];
            }
        });
    });
}
export function updateEvent(input) {
    return __awaiter(this, void 0, void 0, function () {
        var req, onlineEventInfo, offlineEventInfo, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new UpdateEventReq();
                    req.setEventId(input.eventId);
                    req.setTitle(new StringValue().setValue(input.title));
                    req.setContent(new StringValue().setValue(input.content));
                    req.setStartTime(Timestamp.fromDate(input.startTime));
                    req.setEndTime(Timestamp.fromDate(input.endTime));
                    if (input.photoKey) {
                        req.setPhotoKey(new StringValue().setValue(input.photoKey));
                    }
                    if (input.isOnline) {
                        onlineEventInfo = new OnlineEventInformation();
                        onlineEventInfo.setLink(input.link);
                        req.setOnlineInformation(onlineEventInfo);
                    }
                    else {
                        offlineEventInfo = new OfflineEventInformation();
                        offlineEventInfo.setAddress(input.address);
                        offlineEventInfo.setLat(input.lat);
                        offlineEventInfo.setLng(input.lng);
                        req.setOfflineInformation(offlineEventInfo);
                    }
                    return [4 /*yield*/, client.events.updateEvent(req)];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, res.toObject()];
            }
        });
    });
}
//# sourceMappingURL=events.js.map