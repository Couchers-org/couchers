import Button from "components/Button";
import { useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { strongVerificationRoute } from "routes";

export default function StartStrongVerificationButton() {
  const { t } = useTranslation([GLOBAL, AUTH]);
  const router = useRouter();

  return (
    <Button onClick={() => router.push(strongVerificationRoute)}>{t("auth:strong_verification.start_button")}</Button>
  );
}
