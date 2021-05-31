import { regionsKey } from "queryKeys";
import { useQuery } from "react-query";
import { service } from "service";

export const useRegions = () => {
  const { data, ...rest } = useQuery(regionsKey, () =>
    service.resources.getRegions().then((result) =>
      result.regionsList.reduce(
        (regionsResult, { alpha3, name }) => {
          regionsResult.regions[alpha3] = name;
          regionsResult.regionsLookup[name] = alpha3;
          return regionsResult;
        },
        {
          regions: {} as { [code: string]: string },
          regionsLookup: {} as { [name: string]: string },
        }
      )
    )
  );

  return {
    regions: data?.regions,
    regionsLookup: data?.regionsLookup,
    ...rest,
  };
};
