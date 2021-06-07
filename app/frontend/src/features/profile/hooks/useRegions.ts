import { regionsKey } from "queryKeys";
import { useQuery } from "react-query";
import { service } from "service";

export const useRegions = () => {
  return useQuery(regionsKey, () => service.resources.getRegions());
};
