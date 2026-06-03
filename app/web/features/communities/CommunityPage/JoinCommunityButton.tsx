import { useMutation, useQueryClient } from "@tanstack/react-query";
import Button from "components/Button";
import Snackbar from "components/Snackbar";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { Community } from "proto/communities_pb";
import { service } from "service";

import {
  communityKey,
  listMyCommunitiesDiscussionsKey,
  userCommunitiesKey,
} from "../../queryKeys";

export default function JoinCommunityButton({
  community,
}: {
  community: Community.AsObject;
}) {
  const { t } = useTranslation([COMMUNITIES]);
  const queryClient = useQueryClient();
  const invalidateMembershipQueries = () => {
    queryClient.invalidateQueries({ queryKey: [userCommunitiesKey] });
    queryClient.invalidateQueries({
      queryKey: [listMyCommunitiesDiscussionsKey],
    });
    queryClient.invalidateQueries({ queryKey: ["myCommunityEvents"] });
  };

  const join = useMutation<void, RpcError>({
    mutationFn: () => service.communities.joinCommunity(community.communityId),
    onSuccess() {
      queryClient.setQueryData<Community.AsObject | undefined>(
        communityKey(community.communityId),
        (prevData) =>
          prevData
            ? {
                ...prevData,
                member: true,
              }
            : undefined,
      );
      queryClient.invalidateQueries({
        queryKey: communityKey(community.communityId),
      });
      invalidateMembershipQueries();
    },
  });
  const leave = useMutation<void, RpcError>({
    mutationFn: () => service.communities.leaveCommunity(community.communityId),
    onSuccess() {
      queryClient.setQueryData<Community.AsObject | undefined>(
        communityKey(community.communityId),
        (prevData) =>
          prevData
            ? {
                ...prevData,
                member: false,
              }
            : undefined,
      );
      queryClient.invalidateQueries({
        queryKey: communityKey(community.communityId),
      });
      invalidateMembershipQueries();
    },
  });
  const isLoading = join.isPending || leave.isPending;
  return (
    <>
      <Button
        loading={isLoading}
        variant={community.member ? "outlined" : "contained"}
        onClick={() => (community.member ? leave.mutate() : join.mutate())}
      >
        {community.member
          ? t("communities:leave_community")
          : t("communities:join_community")}
      </Button>
      {(join.isError || leave.isError) && (
        <Snackbar severity="error">
          {join.error?.message || leave.error?.message}
        </Snackbar>
      )}
    </>
  );
}
