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
import { CreateHostRequestReq, GetHostRequestMessagesReq, GetHostRequestReq, ListHostRequestsReq, MarkLastSeenHostRequestReq, RespondHostRequestReq, SendHostRequestMessageReq, } from "proto/requests_pb";
import client from "service/client";
export function listHostRequests(_a) {
    var _b = _a.lastRequestId, lastRequestId = _b === void 0 ? 0 : _b, _c = _a.count, count = _c === void 0 ? 10 : _c, _d = _a.type, type = _d === void 0 ? "all" : _d, _e = _a.onlyActive, onlyActive = _e === void 0 ? false : _e;
    return __awaiter(this, void 0, void 0, function () {
        var req, response;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    req = new ListHostRequestsReq();
                    req.setOnlyActive(onlyActive);
                    req.setOnlyReceived(type === "hosting");
                    req.setOnlySent(type === "surfing");
                    req.setLastRequestId(lastRequestId);
                    req.setNumber(count);
                    return [4 /*yield*/, client.requests.listHostRequests(req)];
                case 1:
                    response = _f.sent();
                    return [2 /*return*/, response.toObject()];
            }
        });
    });
}
export function getHostRequest(id) {
    return __awaiter(this, void 0, void 0, function () {
        var req, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new GetHostRequestReq();
                    req.setHostRequestId(id);
                    return [4 /*yield*/, client.requests.getHostRequest(req)];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.toObject()];
            }
        });
    });
}
export function sendHostRequestMessage(id, text) {
    return __awaiter(this, void 0, void 0, function () {
        var req, response, messageId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new SendHostRequestMessageReq();
                    req.setHostRequestId(id);
                    req.setText(text);
                    return [4 /*yield*/, client.requests.sendHostRequestMessage(req)];
                case 1:
                    response = _a.sent();
                    messageId = response.getJsPbMessageId();
                    return [2 /*return*/, messageId];
            }
        });
    });
}
export function respondHostRequest(id, status, text) {
    return __awaiter(this, void 0, void 0, function () {
        var req;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new RespondHostRequestReq();
                    req.setHostRequestId(id);
                    req.setStatus(status);
                    req.setText(text);
                    return [4 /*yield*/, client.requests.respondHostRequest(req)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
export function getHostRequestMessages(id, lastMessageId, count) {
    if (lastMessageId === void 0) { lastMessageId = 0; }
    if (count === void 0) { count = 20; }
    return __awaiter(this, void 0, void 0, function () {
        var req, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new GetHostRequestMessagesReq();
                    req.setHostRequestId(id);
                    req.setLastMessageId(lastMessageId);
                    req.setNumber(count);
                    return [4 /*yield*/, client.requests.getHostRequestMessages(req)];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.toObject()];
            }
        });
    });
}
export function createHostRequest(data) {
    return __awaiter(this, void 0, void 0, function () {
        var req, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new CreateHostRequestReq();
                    req.setHostUserId(data.hostUserId);
                    req.setFromDate(data.fromDate.format().split("T")[0]);
                    req.setToDate(data.toDate.format().split("T")[0]);
                    req.setText(data.text);
                    return [4 /*yield*/, client.requests.createHostRequest(req)];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.getHostRequestId()];
            }
        });
    });
}
export function markLastRequestSeen(hostRequestId, messageId) {
    var req = new MarkLastSeenHostRequestReq();
    req.setHostRequestId(hostRequestId);
    req.setLastSeenMessageId(messageId);
    return client.requests.markLastSeenHostRequest(req);
}
//# sourceMappingURL=requests.js.map