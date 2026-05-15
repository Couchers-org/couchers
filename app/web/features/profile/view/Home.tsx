import { styled, Typography } from "@mui/material";
import Divider from "components/Divider";
import LabelAndText from "components/LabelAndText";
import Markdown from "components/Markdown";
import {
  booleanConversion,
  parkingDetailsLabels,
  sleepingArrangementLabelsShort,
  smokingLocationLabels,
} from "features/profile/constants";
import { useProfileData } from "features/profile/hooks/useProfileUser";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";

const StyledRoot = styled("div")({
  display: "flex",
  justifyContent: "space-between",
});

const StyledInfoColumn = styled("div")({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  width: "50%",
});

const StyledSpacedDivider = styled(Divider)(({ theme }) => ({
  marginTop: theme.spacing(3),
}));

export default function Home() {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const profile = useProfileData();

  return (
    <>
      <StyledRoot>
        <StyledInfoColumn>
          <Typography variant="h1">
            {t("profile:home_info_headings.hosting_preferences")}
          </Typography>
          <LabelAndText
            label={t("profile:home_info_headings.last_minute")}
            text={booleanConversion(t, profile.lastMinute?.value)}
          />
          <LabelAndText
            label={t("profile:home_info_headings.wheelchair")}
            text={booleanConversion(t, profile.wheelchairAccessible?.value)}
          />
          <LabelAndText
            label={t("profile:edit_home_questions.accept_camping")}
            text={booleanConversion(t, profile.campingOk?.value)}
          />
          <LabelAndText
            label={t("profile:home_info_headings.max_guests")}
            text={`${profile.maxGuests?.value || t("profile:unspecified_info")}`}
          />
          <LabelAndText
            label={t("profile:edit_home_questions.accept_kids")}
            text={booleanConversion(t, profile.acceptsKids?.value)}
          />
          <LabelAndText
            label={t("profile:edit_home_questions.accept_pets")}
            text={booleanConversion(t, profile.acceptsPets?.value)}
          />
          <LabelAndText
            label={t("profile:edit_home_questions.accept_drinking")}
            text={booleanConversion(t, profile.drinkingAllowed?.value)}
          />
          <LabelAndText
            label={t("profile:edit_home_questions.accept_smoking")}
            text={`${smokingLocationLabels(t)[profile.smokingAllowed]}`}
          />
        </StyledInfoColumn>
        <StyledInfoColumn>
          <Typography variant="h1">
            {t("profile:home_info_headings.my_home")}
          </Typography>
          <LabelAndText
            label={t("profile:home_info_headings.space")}
            text={
              sleepingArrangementLabelsShort(t)[profile.sleepingArrangement] ||
              t("profile:unspecified_info")
            }
          />
          <LabelAndText
            label={t("profile:home_info_headings.parking")}
            text={booleanConversion(t, profile.parking?.value)}
          />
          <LabelAndText
            label={t("profile:home_info_headings.parking_details")}
            text={parkingDetailsLabels(t)[profile.parkingDetails]}
          />
          <LabelAndText
            label={t("profile:home_info_headings.has_housemates")}
            text={`${booleanConversion(t, profile.hasHousemates?.value)}${
              profile.housemateDetails?.value
                ? `, ${profile.housemateDetails?.value}`
                : ""
            }`}
          />
          <LabelAndText
            label={t("profile:home_info_headings.has_kids")}
            text={`${booleanConversion(t, profile.hasKids?.value)}${
              profile.kidDetails?.value ? `, ${profile.kidDetails?.value}` : ""
            }`}
          />
          <LabelAndText
            label={t("profile:home_info_headings.has_pets")}
            text={`${booleanConversion(t, profile.hasPets?.value)}${
              profile.petDetails?.value ? `, ${profile.petDetails?.value}` : ""
            }`}
          />
          <LabelAndText
            label={t("profile:home_info_headings.host_drinking")}
            text={booleanConversion(t, profile.drinksAtHome?.value)}
          />
          <LabelAndText
            label={t("profile:home_info_headings.host_smoking")}
            text={booleanConversion(t, profile.smokesAtHome?.value)}
          />
        </StyledInfoColumn>
      </StyledRoot>
      <StyledSpacedDivider />
      {profile.aboutPlace && (
        <>
          <Typography variant="h1">
            {t("profile:home_info_headings.about_home")}
          </Typography>
          <Markdown source={profile.aboutPlace} />
          <StyledSpacedDivider />
        </>
      )}
      {profile.area && (
        <>
          <Typography variant="h1">
            {t("profile:home_info_headings.local_area")}
          </Typography>
          <Markdown source={profile.area?.value} />
          <StyledSpacedDivider />
        </>
      )}
      {profile.sleepingDetails && (
        <>
          <Typography variant="h1">
            {t("profile:home_info_headings.sleeping_arrangement")}
          </Typography>
          <Markdown source={profile.sleepingDetails?.value} />
          <StyledSpacedDivider />
        </>
      )}
      {profile.houseRules && (
        <>
          <Typography variant="h1">
            {t("profile:home_info_headings.house_rules")}
          </Typography>
          <Markdown source={profile.houseRules?.value} />
          <StyledSpacedDivider />
        </>
      )}
      {profile.otherHostInfo && (
        <>
          <Typography variant="h1">
            {t("profile:heading.additional_information_section")}
          </Typography>
          <Markdown source={profile.otherHostInfo?.value} />
        </>
      )}
    </>
  );
}
