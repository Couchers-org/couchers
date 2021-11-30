import { Typography } from "@material-ui/core";
import { GetAccountInfoRes } from "proto/account_pb";
import { useTranslation } from "react-i18next";

import { USERNAME_HELPER, YOUR_USERNAME_IS } from "../constants";

export default function Username(accountInfo: GetAccountInfoRes.AsObject) {
  const { t } = useTranslation("auth");
  return (
    <>
      <Typography variant="h2">
        {t("account_form.username.field_label")}
      </Typography>
      <Typography variant="body1" paragraph>
        {YOUR_USERNAME_IS} <b>{accountInfo.username}</b>.
      </Typography>
      <Typography variant="body1">{USERNAME_HELPER}</Typography>
    </>
  );
}
