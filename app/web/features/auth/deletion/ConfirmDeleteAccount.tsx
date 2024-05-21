import Alert from "components/Alert";
import Button from "components/Button";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useMutation } from "react-query";
import { logoutRoute } from "routes";
import { service } from "service";
import stringOrFirstString from "utils/stringOrFirstString";

export interface ConfirmDeleteAccountParams {
  token?: string;
}

export default function ConfirmDeleteAccount() {
  const { t } = useTranslation([AUTH, GLOBAL]);

  const router = useRouter();
  const token = stringOrFirstString(router.query.token);

  const { error, isLoading, isSuccess, mutate } = useMutation<
    void,
    RpcError,
    ConfirmDeleteAccountParams
  >(
    async ({ token }) => {
      if (token === undefined) {
        throw Error(t("auth:delete_account.missing_token"));
      }
      return await service.auth.confirmDeleteAccount(token);
    },
    {
      onSuccess: () => {
        router.push(logoutRoute);
      },
    }
  );

  return (
    <>
      <HtmlMeta title={t("auth:delete_account.confirm.title")} />
      <PageTitle>{t("auth:delete_account.confirm.title")}</PageTitle>
      {error && (
        <Alert severity="error">
          {t("auth:delete_account.confirm.error_message", {
            message: error.message,
          })}
        </Alert>
      )}
      {isSuccess && (
        <Alert severity="success">
          {t("auth:delete_account.confirm.account_deleted")}
        </Alert>
      )}
      <Button onClick={() => mutate({ token })} loading={isLoading}>
        {t("auth:delete_account.confirm.button_text")}
      </Button>
    </>
  );
}
