import { Typography } from "@mui/material";
import Button from "components/Button";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import UsersList from "components/UsersList";
import { useTranslation } from "i18n";
import { GLOBAL, MOD, PROFILE } from "i18n/namespaces";

import { useNewUsers } from "./hooks";

export default function ModPage() {
  const { t } = useTranslation([GLOBAL, MOD, PROFILE]);

  const { userIds, error, hasNextPage, isFetchingNextPage, fetchNextPage } = useNewUsers();

  return (
    <>
      <HtmlMeta title={t("mod:title")} />
      <PageTitle>{t("mod:title")}</PageTitle>
      <h1>{t("mod:list_users.heading")}</h1>
      <UsersList
        error={error}
        userIds={userIds}
        emptyListChildren={<Typography variant="body1">{t("mod:list_users.none_found")}</Typography>}
      />
      {hasNextPage && (
        <Button loading={isFetchingNextPage} onClick={() => fetchNextPage()}>
          {t("mod:list_users.load_more")}
        </Button>
      )}
    </>
  );
}
