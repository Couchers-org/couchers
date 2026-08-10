import { useMutation, useQueryClient } from "@tanstack/react-query";
import { volunteerInfoQueryKey, volunteersKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { GetMyVolunteerInfoRes } from "proto/account_pb";
import { service } from "service";

import { VolunteerFormData } from "./utils";

export function useUpdateVolunteerInfo() {
  const queryClient = useQueryClient();

  return useMutation<GetMyVolunteerInfoRes.AsObject, RpcError, VolunteerFormData>({
    mutationFn: async (data) => {
      // For website, use the URL as both the display text and href
      const linkText = data.linkType === "website" ? data.linkUrl : data.linkText;

      const result = await service.account.updateVolunteerInfo({
        displayName: data.overrideName ? data.displayName : "",
        displayLocation: data.overrideLocation ? data.displayLocation : "",
        showOnTeamPage: data.showOnTeamPage,
        linkType: data.linkType || undefined,
        linkText: linkText || undefined,
        linkUrl: data.linkType === "website" ? data.linkUrl || undefined : undefined,
      });
      return result.toObject();
    },
    onSuccess: (data) => {
      // Update the cache with the new data
      // The form's `values` prop will automatically sync with this update
      queryClient.setQueryData([volunteerInfoQueryKey], data);
      // Invalidate the team page volunteers list so it refetches with updated data
      queryClient.invalidateQueries({ queryKey: [volunteersKey] });
    },
  });
}
