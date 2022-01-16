import { RpcError } from "grpc-web";

export default function isGrpcError(e: unknown): e is RpcError {
  if (typeof e === "object" && e) {
    return "message" in e && "code" in e;
  }
  return false;
}
