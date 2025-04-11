import { Link as MuiLink, Typography, useMediaQuery } from "@mui/material";
import Button from "components/Button";
import { useTranslation } from "i18n";
import { LANGUAGE_MAP } from "i18n/constants";
import { getLangCookie } from "i18n/getLangCookie";
import { GLOBAL } from "i18n/namespaces";
import { useForm } from "react-hook-form";
import { theme } from "theme";

import useChangeDetailsFormStyles from "../features/auth/useChangeDetailsFormStyles";
import LanguagePickerSelect from "./LanguagePickerSelect";

const VOLUNTEER_PAGE_LINK = "https://couchers.org/volunteer";

interface ChangeLanguageFormData {
  newLanguage: string;
}

interface ChangeLanguageProps {
  // language: string;
  className?: string;
}

export default function LanguagePickerSettings({
  className,
}: ChangeLanguageProps) {
  const { t } = useTranslation([GLOBAL]);
  const formClasses = useChangeDetailsFormStyles();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { handleSubmit, reset: resetForm } = useForm<ChangeLanguageFormData>();
  const onSubmit = handleSubmit(() => {
    // TODO: send request to update cookie on backend w/ newLanguage code
    // TODO: uses i18n.changeLanguage to update UI language
    resetForm();
  });

  return (
    <div className={className}>
      <Typography variant="h2">
        {t("global:language_preference.form_title")}
      </Typography>
      <>
        <Typography variant="body1">
          {`${t("global:language_preference.current_preferred_language")}`}
          <strong>{LANGUAGE_MAP[getLangCookie()].name}</strong>
        </Typography>
        <Typography variant="body1" paragraph>
          <MuiLink
            href={VOLUNTEER_PAGE_LINK}
            target="_blank"
            rel="noreferrer noopener"
            underline="hover"
          >
            <strong>{t("global:language_preference.help_translate")}</strong>
          </MuiLink>
        </Typography>
        <form className={formClasses.form} onSubmit={onSubmit}>
          <LanguagePickerSelect displayMode="rect" />
          <Button fullWidth={isMobile} type="submit">
            {t("global:submit")}
          </Button>
        </form>
      </>
    </div>
  );
}
