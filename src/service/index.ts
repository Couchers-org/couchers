import * as search from "./search";
import * as user from "./user";

export const service = {
  search,
  user,
};

export function mockService(record: Record<string, any> = service) {
  for (const name in record) {
    if (typeof record[name] === "function") {
      record[name] = jest.fn();
    } else {
      mockService(record[name]);
    }
  }
}
