export default function isGrpcError(e) {
    if (typeof e === "object" && e) {
        return "message" in e && "code" in e;
    }
    return false;
}
//# sourceMappingURL=isGrpcError.js.map