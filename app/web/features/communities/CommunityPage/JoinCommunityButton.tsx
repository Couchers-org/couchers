import { IosShareOutlined, LogoutOutlined } from "@mui/icons-material";
import { IconButton, ListItemIcon, ListItemText } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Button from "components/Button";
import { SettingsIcon } from "components/Icons";
import Menu, { MenuItem } from "components/Menu";
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
  const { share: triggerShare, shareStatus } = useShare();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

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

  const handleShare = () => {
    setAnchorEl(null);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    triggerShare({
      url: `${origin}${routeToCommunity(community.communityId, community.slug)}`,
      title: community.name,
      text: t("communities:community_share_text", { name: community.name }),
    });
  };

  const handleLeave = () => {
    setAnchorEl(null);
    leave.mutate();
  };

  if (!community.member) {
    return (
      <>
        <Button
          loading={isLoading}
          variant="contained"
          onClick={() => join.mutate()}
        >
          {t("communities:join_community")}
        </Button>
        {join.isError && (
          <Snackbar severity="error">{join.error?.message}</Snackbar>
        )}
      </>
    );
  }

  return (
    <>
      <IconButton
        aria-label={t("communities:community_options_menu")}
        aria-controls={menuOpen ? "community-options-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={menuOpen ? "true" : undefined}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        disabled={isLoading}
      >
        <SettingsIcon />
      </IconButton>
      <Menu
        id="community-options-menu"
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={handleShare}>
          <ListItemIcon>
            <IosShareOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t("communities:share_community")} />
        </MenuItem>
        <MenuItem onClick={handleLeave}>
          <ListItemIcon>
            <LogoutOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t("communities:leave_community")} />
        </MenuItem>
      </Menu>
      {leave.isError && (
        <Snackbar severity="error">{leave.error?.message}</Snackbar>
      )}
      {shareStatus}
    </>
  );
}
