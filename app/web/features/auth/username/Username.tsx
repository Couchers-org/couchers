import { Typography } from "@material-ui/core";
import { useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import { GetAccountInfoRes } from "proto/account_pb";

import { USERNAME_HELPER, YOUR_USERNAME_IS } from "../constants";

type UsernameProps = GetAccountInfoRes.AsObject & {
  className?: string;
};

export default function Username(props: UsernameProps) {
  const { t } = useTranslation(AUTH);
  const { className } = props;

  return (
    <div className={className}>
      <Typography variant="h2">
        {t("account_form.username.field_label")}
      </Typography>
      <Typography variant="body1">
        {YOUR_USERNAME_IS} <b>{props.username}</b>.
      </Typography>
      <Typography variant="body1">{USERNAME_HELPER}</Typography>
    </div>
  );
}
