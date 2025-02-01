import { Typography } from "@mui/material";
import Button from "components/Button";
import UsersList from "components/UsersList";
import { useBadgeUsers } from "features/badges/hooks";
import { useTranslation } from "i18n";
import { PROFILE } from "i18n/namespaces";

export interface BadgeUserListProps {
  badgeId: string;
}

export default function BadgeUserList({ badgeId }: BadgeUserListProps) {
  const { t } = useTranslation([PROFILE]);

  const { badgeUserIds, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useBadgeUsers(badgeId);

  return (
    <UsersList
      userIds={badgeUserIds}
      endChildren={
        hasNextPage && (
          <Button loading={isFetchingNextPage} onClick={() => fetchNextPage()}>
            Load more
          </Button>
        )
      }
      emptyListChildren={
        <Typography variant="body1">{t("profile:badges.no_people")}</Typography>
      }
    />
  );
}
