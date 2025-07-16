import StyledLink from "components/StyledLink";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";

export default function AntibotNote() {
  const { t } = useTranslation([GLOBAL]);
  return (
    <>
      {t("antibot.note")}{" "}
      <StyledLink target="_blank" href="https://policies.google.com/privacy">
        {t("antibot.privacy_policy")}
      </StyledLink>{" "}
      and{" "}
      <StyledLink target="_blank" href="https://policies.google.com/terms">
        {t("antibot.terms_of_service")}
      </StyledLink>{" "}
      {t("antibot.apply")}.
    </>
  );
}
