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
import { GetCommunityReq, JoinCommunityReq, LeaveCommunityReq, ListAdminsReq, ListCommunitiesReq, ListDiscussionsReq, ListGroupsReq, ListGuidesReq, ListMembersReq, ListNearbyUsersReq, ListPlacesReq, ListUserCommunitiesReq, } from "proto/communities_pb";
import client from "service/client";
export function getCommunity(communityId) {
    return __awaiter(this, void 0, void 0, function () {
        var req, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new GetCommunityReq();
                    req.setCommunityId(communityId);
                    return [4 /*yield*/, client.communities.getCommunity(req)];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.toObject()];
            }
        });
    });
}
/**
 * List sub-communities of a given community
 */
export function listCommunities(communityId, pageToken) {
    return __awaiter(this, void 0, void 0, function () {
        var req, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new ListCommunitiesReq();
                    req.setCommunityId(communityId);
                    if (pageToken) {
                        req.setPageToken(pageToken);
                    }
                    return [4 /*yield*/, client.communities.listCommunities(req)];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.toObject()];
            }
        });
    });
}
export function listGroups(communityId, pageToken) {
    return __awaiter(this, void 0, void 0, function () {
        var req, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new ListGroupsReq();
                    req.setCommunityId(communityId);
                    if (pageToken) {
                        req.setPageToken(pageToken);
                    }
                    return [4 /*yield*/, client.communities.listGroups(req)];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.toObject()];
            }
        });
    });
}
export function listAdmins(communityId, pageToken) {
    return __awaiter(this, void 0, void 0, function () {
        var req, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new ListAdminsReq();
                    req.setCommunityId(communityId);
                    if (pageToken) {
                        req.setPageToken(pageToken);
                    }
                    req.setPageSize(6);
                    return [4 /*yield*/, client.communities.listAdmins(req)];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.toObject()];
            }
        });
    });
}
export function listMembers(communityId, pageToken) {
    return __awaiter(this, void 0, void 0, function () {
        var req, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new ListMembersReq();
                    req.setCommunityId(communityId);
                    if (pageToken) {
                        req.setPageToken(pageToken);
                    }
                    return [4 /*yield*/, client.communities.listMembers(req)];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.toObject()];
            }
        });
    });
}
export function listNearbyUsers(communityId, pageToken) {
    return __awaiter(this, void 0, void 0, function () {
        var req, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new ListNearbyUsersReq();
                    req.setCommunityId(communityId);
                    if (pageToken) {
                        req.setPageToken(pageToken);
                    }
                    return [4 /*yield*/, client.communities.listNearbyUsers(req)];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.toObject()];
            }
        });
    });
}
export function listPlaces(communityId, pageToken) {
    return __awaiter(this, void 0, void 0, function () {
        var req, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new ListPlacesReq();
                    req.setCommunityId(communityId);
                    if (pageToken) {
                        req.setPageToken(pageToken);
                    }
                    return [4 /*yield*/, client.communities.listPlaces(req)];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.toObject()];
            }
        });
    });
}
export function listGuides(communityId, pageToken) {
    return __awaiter(this, void 0, void 0, function () {
        var req, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new ListGuidesReq();
                    req.setCommunityId(communityId);
                    if (pageToken) {
                        req.setPageToken(pageToken);
                    }
                    return [4 /*yield*/, client.communities.listGuides(req)];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.toObject()];
            }
        });
    });
}
export function listDiscussions(communityId, pageToken) {
    return __awaiter(this, void 0, void 0, function () {
        var req, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new ListDiscussionsReq();
                    req.setCommunityId(communityId);
                    if (pageToken) {
                        req.setPageToken(pageToken);
                    }
                    return [4 /*yield*/, client.communities.listDiscussions(req)];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.toObject()];
            }
        });
    });
}
export function joinCommunity(communityId) {
    return __awaiter(this, void 0, void 0, function () {
        var req;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new JoinCommunityReq();
                    req.setCommunityId(communityId);
                    return [4 /*yield*/, client.communities.joinCommunity(req)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
export function leaveCommunity(communityId) {
    return __awaiter(this, void 0, void 0, function () {
        var req;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new LeaveCommunityReq();
                    req.setCommunityId(communityId);
                    return [4 /*yield*/, client.communities.leaveCommunity(req)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
export function listUserCommunities(pageToken) {
    return __awaiter(this, void 0, void 0, function () {
        var req;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    req = new ListUserCommunitiesReq();
                    if (pageToken)
                        req.setPageToken(pageToken);
                    return [4 /*yield*/, client.communities.listUserCommunities(req)];
                case 1: return [2 /*return*/, (_a.sent()).toObject()];
            }
        });
    });
}
//# sourceMappingURL=communities.js.map