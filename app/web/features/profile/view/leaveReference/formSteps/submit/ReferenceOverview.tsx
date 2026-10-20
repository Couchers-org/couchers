import { Box, Card, CardContent, styled, Typography, useMediaQuery } from "@mui/material";
import SliderLabel from "components/RatingsSlider/SliderLabel";
import TextBody from "components/TextBody";
import UserSummary from "components/UserSummary";
import { useProfileUser } from "features/profile/hooks/useProfileUser";
import { ReferenceContextFormData } from "features/profile/view/leaveReference/ReferenceForm";
import { useTranslation } from "i18n";
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

export default function ReferenceOverview({ referenceData }: { referenceData: ReferenceContextFormData }) {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const user = useProfileUser();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <>
      <StyledTextBody>{t("profile:leave_reference.thank_you_message")}</StyledTextBody>
      {isMobile && (
        <Box sx={{ margin: theme.spacing(2, 0) }}>
          <TextBody sx={{ marginBottom: theme.spacing(2) }}>{t("profile:leave_reference.writing_for_text")}</TextBody>
          <UserSummary user={user} />
        </Box>
      )}
      <StyledTypography variant="h3" sx={{ marginTop: theme.spacing(3) }}>
        {t("profile:leave_reference.public_text_label", { name: user.name })}
      </StyledTypography>
      <StyledCard>
        <CardContent>
          <TextBody sx={{ whiteSpace: "pre-wrap" }}>{referenceData.text}</TextBody>
        </CardContent>
      </StyledCard>
      <StyledTypography variant="h3" sx={{ marginTop: theme.spacing(3) }}>
        {t("profile:leave_reference.private_text_label")}
      </StyledTypography>
      <ul>
        <li>
          <StyledTextBody>
            {referenceData.wasAppropriate === "true"
              ? t("profile:leave_reference.yes_safe")
              : t("profile:leave_reference.no_not_safe")}
          </StyledTextBody>
        </li>
        <li>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography sx={{ paddingRight: theme.spacing(1) }}>{t("profile:leave_reference.rating_label")}</Typography>
            <SliderLabel value={referenceData.rating} />
          </Box>
        </li>
      </ul>
      {referenceData.privateText && referenceData.privateText.length > 0 && (
        <>
          <StyledTypography variant="h3" sx={{ marginTop: theme.spacing(3) }}>
            {t("profile:leave_reference.private_text_summary")}
          </StyledTypography>
          <StyledCard>
            <CardContent>
              <TextBody sx={{ whiteSpace: "pre-wrap" }}>{referenceData.privateText}</TextBody>
            </CardContent>
          </StyledCard>
        </>
      )}
    </>
  );
}
