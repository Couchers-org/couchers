import {
  Card,
  CardContent,
  Link,
  styled,
  Typography,
  useMediaQuery,
} from "@mui/material";
import SliderLabel from "components/RatingsSlider/SliderLabel";
import TextBody from "components/TextBody";
import UserSummary from "components/UserSummary";
import { contactLink } from "features/profile/constants";
import { useProfileUser } from "features/profile/hooks/useProfileUser";
import { ReferenceContextFormData } from "features/profile/view/leaveReference/ReferenceForm";
import { Trans, useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import { theme } from "theme";

const StyledTextBody = styled(TextBody)(({ theme }) => ({
  "& > .MuiInputBase-root": {
    width: "100%",
  },
  marginTop: theme.spacing(1),
  [theme.breakpoints.up("md")]: {
    "& > .MuiInputBase-root": {
      width: 400,
    },
  },
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
  "& > .MuiInputBase-root": {
    width: "100%",
  },
  marginTop: theme.spacing(1),
  [theme.breakpoints.up("md")]: {
    "& > .MuiInputBase-root": {
      width: 400,
    },
  },
}));

const StyledCard = styled(Card)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(1),
}));

export default function ReferenceOverview({
  referenceData,
}: {
  referenceData: ReferenceContextFormData;
}) {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const user = useProfileUser();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <>
      <StyledTextBody>
        {t("profile:leave_reference.thank_you_message")}
      </StyledTextBody>
      {isMobile && (
        <>
          <TextBody>{t("profile:leave_reference.writing_for_text")}</TextBody>
          <UserSummary user={user} />
        </>
      )}
      <StyledTypography variant="h3">
        {t("profile:leave_reference.public_text_label")}
      </StyledTypography>
      <StyledCard>
        <CardContent>
          <TextBody sx={{ whiteSpace: "pre-wrap" }}>
            {referenceData.text}
          </TextBody>
        </CardContent>
      </StyledCard>
      <StyledTypography variant="h3">
        {t("profile:leave_reference.private_text_label")}
      </StyledTypography>
      <ul>
        <li>
          <StyledTextBody>
            {referenceData.wasAppropriate === "true"
              ? t("profile:leave_reference.coucher_was_appropriate")
              : t("profile:leave_reference.coucher_was_not_appropriate")}
          </StyledTextBody>
        </li>
        <li>
          <StyledTextBody>
            {t("profile:leave_reference.rating_label")}
            <SliderLabel value={referenceData.rating} />
          </StyledTextBody>
        </li>
      </ul>
      <StyledTextBody>
        <Trans t={t} i18nKey="profile:leave_reference.contact_text">
          If you have any questions or wish to provide additional information,
          please don't hesitate to
          <Link href={contactLink} target="_blank" underline="hover">
            contact us here.
          </Link>
        </Trans>
      </StyledTextBody>
    </>
  );
}
