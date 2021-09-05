import { Error as GrpcError } from "grpc-web";

export default function isGrpcError(e: unknown): e is GrpcError {
  if (typeof e === "object" && e) {
    return "message" in e && "code" in e;
  }
  return false;
}
