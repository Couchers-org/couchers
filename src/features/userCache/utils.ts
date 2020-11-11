import { RootState } from "../../reducers";
import { expiryMilliseconds } from "./constants";

export function hasUserExpired(id: number, state: RootState) {
  const expiryDate = new Date(new Date().getTime() + expiryMilliseconds);
  return (state.userCache.entities[id]?.fetched || 0) > expiryDate;
}
