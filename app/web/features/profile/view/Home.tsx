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
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import { User } from "proto/api_pb";

const StyledRoot = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
  },
}));

const StyledInfoColumn = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  width: "50%",
  [theme.breakpoints.down("sm")]: {
    width: "100%",
  },
}));

const StyledSpacedDivider = styled(Divider)(({ theme }) => ({
  marginTop: theme.spacing(3),
}));

interface HomeProps {
  user: User.AsObject;
}

export default function Home({ user }: HomeProps) {
  const { t } = useTranslation([GLOBAL, PROFILE]);

  return (
    <>
      <StyledRoot>
        <StyledInfoColumn>
          <Typography variant="h1">
            {t("profile:home_info_headings.hosting_preferences")}
          </Typography>
          <LabelAndText
            label={t("profile:home_info_headings.last_minute")}
            text={booleanConversion(t, user.lastMinute?.value)}
          />
          <LabelAndText
            label={t("profile:home_info_headings.wheelchair")}
            text={booleanConversion(t, user.wheelchairAccessible?.value)}
          />
          <LabelAndText
            label={t("profile:edit_home_questions.accept_camping")}
            text={booleanConversion(t, user.campingOk?.value)}
          />
          <LabelAndText
            label={t("profile:home_info_headings.max_guests")}
            text={`${user.maxGuests?.value || t("profile:unspecified_info")}`}
          />
          <LabelAndText
            label={t("profile:edit_home_questions.accept_kids")}
            text={booleanConversion(t, user.acceptsKids?.value)}
          />
          <LabelAndText
            label={t("profile:edit_home_questions.accept_pets")}
            text={booleanConversion(t, user.acceptsPets?.value)}
          />
          <LabelAndText
            label={t("profile:edit_home_questions.accept_drinking")}
            text={booleanConversion(t, user.drinkingAllowed?.value)}
          />
          <LabelAndText
            label={t("profile:edit_home_questions.accept_smoking")}
            text={`${smokingLocationLabels(t)[user.smokingAllowed]}`}
          />
        </StyledInfoColumn>
        <StyledInfoColumn>
          <Typography variant="h1">
            {t("profile:home_info_headings.my_home")}
          </Typography>
          <LabelAndText
            label={t("profile:home_info_headings.space")}
            text={
              sleepingArrangementLabelsShort(t)[user.sleepingArrangement] ||
              t("profile:unspecified_info")
            }
          />
          <LabelAndText
            label={t("profile:home_info_headings.parking")}
            text={booleanConversion(t, user.parking?.value)}
          />
          <LabelAndText
            label={t("profile:home_info_headings.parking_details")}
            text={parkingDetailsLabels(t)[user.parkingDetails]}
          />
          <LabelAndText
            label={t("profile:home_info_headings.has_housemates")}
            text={`${booleanConversion(t, user.hasHousemates?.value)}${
              user.housemateDetails?.value
                ? `, ${user.housemateDetails?.value}`
                : ""
            }`}
          />
          <LabelAndText
            label={t("profile:home_info_headings.has_kids")}
            text={`${booleanConversion(t, user.hasKids?.value)}${
              user.kidDetails?.value ? `, ${user.kidDetails?.value}` : ""
            }`}
          />
          <LabelAndText
            label={t("profile:home_info_headings.has_pets")}
            text={`${booleanConversion(t, user.hasPets?.value)}${
              user.petDetails?.value ? `, ${user.petDetails?.value}` : ""
            }`}
          />
          <LabelAndText
            label={t("profile:home_info_headings.host_drinking")}
            text={booleanConversion(t, user.drinksAtHome?.value)}
          />
          <LabelAndText
            label={t("profile:home_info_headings.host_smoking")}
            text={booleanConversion(t, user.smokesAtHome?.value)}
          />
        </StyledInfoColumn>
      </StyledRoot>
      <StyledSpacedDivider />
      {user.aboutPlace && (
        <>
          <Typography variant="h1">
            {t("profile:home_info_headings.about_home")}
          </Typography>
          <Markdown source={user.aboutPlace} />
          <StyledSpacedDivider />
        </>
      )}
      {user.area && (
        <>
          <Typography variant="h1">
            {t("profile:home_info_headings.local_area")}
          </Typography>
          <Markdown source={user.area?.value} />
          <StyledSpacedDivider />
        </>
      )}
      {user.sleepingDetails && (
        <>
          <Typography variant="h1">
            {t("profile:home_info_headings.sleeping_arrangement")}
          </Typography>
          <Markdown source={user.sleepingDetails?.value} />
          <StyledSpacedDivider />
        </>
      )}
      {user.houseRules && (
        <>
          <Typography variant="h1">
            {t("profile:home_info_headings.house_rules")}
          </Typography>
          <Markdown source={user.houseRules?.value} />
          <StyledSpacedDivider />
        </>
      )}
      {user.otherHostInfo && (
        <>
          <Typography variant="h1">
            {t("profile:heading.additional_information_section")}
          </Typography>
          <Markdown source={user.otherHostInfo?.value} />
        </>
      )}
    </>
  );
}
