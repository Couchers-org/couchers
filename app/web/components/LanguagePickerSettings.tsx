import {
  Link as MuiLink,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { LANGUAGE_MAP } from "i18n/constants";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { useForm } from "react-hook-form";
import { useMutation } from "react-query";
import { service } from "service";

import useChangeDetailsFormStyles from "../features/auth/useChangeDetailsFormStyles";
import LanguagePickerSelect from "./LanguagePickerSelect";

// TODO: Update to correct link
const COMMUNITY_BUILDER_FORM_LINK =
  "https://couchers.org/community-builder-form";

interface ChangeLanguageFormData {
  newLanguage: string;
}

interface ChangeLanguageProps {
  // language: string;
  className?: string;
}

// TODO: this function is used in two places, where should it live?
// note: this will not retrieve secure cookies in development,
// manually add a non-secure cookie in development to test this functionality
function getLangCookie() {
  const name = "couchers-preferred-language=";

  // split multiple cookies from cookie string
  // "couchers-preferred-language=es; some-other-cookie=some value" --> ['couchers-preferred-language=es', ' some-other-cookie=some value']")
  const allCookies = document.cookie.split("; ");

  // find the cookie with key "couchers-preferred-language" and extract its value
  for (let i = 0; i < allCookies.length; i++) {
    const cookie = allCookies[i];

    // if cookie key is couchers-preferred-language
    if (cookie.indexOf(name) == 0) {
      // cookie val will start at the length of the cookie's name
      return cookie.substring(name.length);
    }
  }
  // if not cookie is found, return an empty string
  return "";
}

export default function LanguagePickerSettings({
  className,
}: ChangeLanguageProps) {
  const { t } = useTranslation([AUTH, GLOBAL]);
  const formClasses = useChangeDetailsFormStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  console.dir(service);

  const {
    handleSubmit,
    register,
    reset: resetForm,
  } = useForm<ChangeLanguageFormData>();
  const onSubmit = handleSubmit(({ newLanguage }) => {
    // TODO: send request to update cookie on backend w/ newLanguage code
  });

  const {
    error: changeLanguageError,
    isLoading: isChangeLanguageLoading,
    isSuccess: isChangeLanguageSuccess,
    mutate: changeLanguage,
  } = useMutation<Empty, RpcError, ChangeLanguageFormData>(
    ({ newLanguage }) => service.account.changeLanguage(newLanguage),
    {
      onSuccess: () => {
        resetForm();
      },
    },
  );

  return (
    <div className={className}>
      {/* <Typography variant="h2">{t("auth:change_language_form.title")}</Typography> */}
      <Typography variant="h2">Language</Typography>
      <>
        <Typography variant="body1">
          {/* <Trans
            i18nKey="auth:change_language_form.current_language_message"
            values={{ language }}
          >
            {`Your language preference is currently `}
            <strong>{language}</strong>
            {`.`}
          </Trans> */}
          {`Your language preference is currently `}
          <strong>{LANGUAGE_MAP[getLangCookie()].name}</strong>
        </Typography>
        <Typography
          variant="body1"
          paragraph
          // className={classes.createCommunityText}
        >
          {/* <Trans i18nKey="dashboard:your_communities_helper_text2"> */}
          {/* {`Don't see your community? `} */}
          <MuiLink
            href={COMMUNITY_BUILDER_FORM_LINK}
            target="_blank"
            rel="noreferrer noopener"
            underline="hover"
          >
            <strong>Help translate couchers into your language.</strong>
          </MuiLink>
          {/* </Trans> */}
        </Typography>
        {changeLanguageError && (
          <Alert severity="error">{changeLanguageError.message}</Alert>
        )}
        {isChangeLanguageSuccess && (
          <Alert severity="success">
            {t("auth:change_language_form.success_message")}
          </Alert>
        )}
        <form className={formClasses.form} onSubmit={onSubmit}>
          <LanguagePickerSelect displayMode="rect" />
          <Button
            fullWidth={isMobile}
            loading={isChangeLanguageLoading}
            type="submit"
          >
            {t("global:submit")}
          </Button>
        </form>
      </>
    </div>
  );
}
