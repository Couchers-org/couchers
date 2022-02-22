import Alert from "components/Alert";
import Button from "components/Button";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useMutation } from "react-query";
import { service } from "service";
import stringOrFirstString from "utils/stringOrFirstString";

export interface RecoverAccountParams {
  token?: string;
}

export default function RecoverAccount() {
  const { t } = useTranslation([AUTH, GLOBAL]);

  const router = useRouter();
  const token = stringOrFirstString(router.query.token);

  const { error, isLoading, isSuccess, mutate } = useMutation<
    void,
    RpcError,
    RecoverAccountParams
  >(async ({ token }) => {
    if (token === undefined) {
      throw Error(t("auth:delete_account.missing_token"));
    }
    return await service.auth.recoverAccount(token);
  });

  return (
    <>
      <HtmlMeta title={t("auth:delete_account.recover.title")} />
      <PageTitle>{t("auth:delete_account.recover.title")}</PageTitle>
      {error && (
        <Alert severity="error">
          {t("auth:delete_account.recover.error_message", {
            message: error.message,
          })}
        </Alert>
      )}
      {isSuccess && (
        <Alert severity="success">
          {t("auth:delete_account.recover.success")}
        </Alert>
      )}
      <Button onClick={() => mutate({ token })} loading={isLoading}>
        {t("auth:delete_account.recover.button_text")}
      </Button>
    </>
  );
}
