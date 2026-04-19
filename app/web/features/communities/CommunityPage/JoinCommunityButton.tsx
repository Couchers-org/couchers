import { Settings as SettingsIcon } from "@mui/icons-material";
import { IconButton, Menu, MenuItem } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Button from "components/Button";
import Snackbar from "components/Snackbar";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { Community } from "proto/communities_pb";
import { useState } from "react";
import { routeToCommunity } from "routes";
import { service } from "service";
import { useShare } from "utils/useShare";

import { communityKey } from "../../queryKeys";

export default function JoinCommunityButton({
  community,
}: {
  community: Community.AsObject;
}) {
  const { t } = useTranslation([COMMUNITIES]);
  const queryClient = useQueryClient();
  const { share, shareStatus } = useShare();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

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
    },
  });
  const isLoading = join.isPending || leave.isPending;

  const closeMenu = () => setMenuAnchor(null);

  const handleShare = () => {
    closeMenu();
    share({
      title: community.name,
      text: t("communities:community_share_text", { name: community.name }),
      url:
        typeof window !== "undefined"
          ? `${window.location.origin}${routeToCommunity(community.communityId, community.slug)}`
          : routeToCommunity(community.communityId, community.slug),
    });
  };

  const handleLeave = () => {
    closeMenu();
    leave.mutate();
  };

  return (
    <>
      {community.member ? (
        <>
          <IconButton
            aria-label={t("communities:community_options_menu")}
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            disabled={isLoading}
            size="medium"
          >
            <SettingsIcon />
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={closeMenu}
          >
            <MenuItem onClick={handleShare}>
              {t("communities:share_community")}
            </MenuItem>
            <MenuItem onClick={handleLeave}>
              {t("communities:leave_community")}
            </MenuItem>
          </Menu>
        </>
      ) : (
        <Button
          loading={isLoading}
          variant="contained"
          onClick={() => join.mutate()}
        >
          {t("communities:join_community")}
        </Button>
      )}
      {(join.isError || leave.isError) && (
        <Snackbar severity="error">
          {join.error?.message || leave.error?.message}
        </Snackbar>
      )}
      {shareStatus}
    </>
  );
}
