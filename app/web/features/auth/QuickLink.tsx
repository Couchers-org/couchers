import { useMutation } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import { UnsubscribeRes } from "couchers/proto/auth_pb";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { service } from "service";
import stringOrFirstString from "utils/stringOrFirstString";

interface UnsubscribeParams {
  payload?: string;
  sig?: string;
}

export default function QuickLink() {
  const { t } = useTranslation([AUTH, GLOBAL]);

  const router = useRouter();
  const payload = stringOrFirstString(router.query.payload);
  const sig = stringOrFirstString(router.query.sig);

  const {
    data,
    error,
    isPending,
    isSuccess,
    mutate: unsubscribe,
  } = useMutation<UnsubscribeRes.AsObject, RpcError, UnsubscribeParams>({
    mutationFn: async ({ payload, sig }) => {
      if (payload === undefined || sig === undefined) {
        throw Error(t("auth:quick_links.missing_payload_or_sig"));
      }
      return await service.auth.unsubscribe(payload, sig);
    },
  });

  return (
    <>
      <HtmlMeta title={t("auth:quick_links.title")} />
      <PageTitle>{t("auth:quick_links.title")}</PageTitle>
      {error && (
        <Alert severity="error">
          {t("auth:quick_links.error_message", {
            message: error.message,
          })}
        </Alert>
      )}
      {isSuccess && <Alert severity="success">{data!.response}</Alert>}
      <Button onClick={() => unsubscribe({ payload, sig })} loading={isPending}>
        {t("auth:quick_links.button_text")}
      </Button>
    </>
  );
}
