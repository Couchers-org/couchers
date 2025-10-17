import { Community } from "@couchers/services/communities";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RpcError } from "grpc-web";

import Button from "@/components/Button";
import Snackbar from "@/components/Snackbar";
import { communityKey } from "@/features/queryKeys";
import { useTranslation } from "@/i18n";
import { COMMUNITIES } from "@/i18n/namespaces";
import { service } from "@/service";

const JoinCommunityButton = ({
  community,
}: {
  community: Community.AsObject;
}) => {
  const { t } = useTranslation([COMMUNITIES]);
  const queryClient = useQueryClient();
  const join = useMutation<unknown, RpcError>({
    mutationFn: () => service.communities.joinCommunity(community.communityId),
    onSuccess: async () => {
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
      await queryClient.invalidateQueries({
        queryKey: communityKey(community.communityId),
      });
    },
  });
  const leave = useMutation<unknown, RpcError>({
    mutationFn: () => service.communities.leaveCommunity(community.communityId),
    onSuccess: async () => {
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
      await queryClient.invalidateQueries({
        queryKey: communityKey(community.communityId),
      });
    },
  });
  const isLoading = join.isPending || leave.isPending;
  return (
    <>
      <Button
        loading={isLoading}
        variant={community.member ? "outlined" : "contained"}
        onClick={() => {
          if (community.member) {
            leave.mutate();
          } else {
            join.mutate();
          }
        }}
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
};

export default JoinCommunityButton;
