import { styled, Typography, useTheme } from "@mui/material";
import Divider from "components/Divider";
import Markdown from "components/Markdown";
import {
  useProfileData,
  useProfileUser,
} from "features/profile/hooks/useProfileUser";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

import { useRegions } from "../hooks/useRegions";
import ProfilePhotoGallery from "./ProfilePhotoGallery";
import { AgeGenderLanguagesLabels, RemainingAboutLabels } from "./userLabels";

const StyledWrapper = styled("div")(({ theme }) => ({
  marginTop: theme.spacing(1),
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
  marginTop: theme.spacing(3),
}));

export default function About() {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const theme = useTheme();
  const { regions } = useRegions();
  const user = useProfileUser();
  const profile = useProfileData();
  return (
    <StyledWrapper>
      <Typography variant="h1">
        {t("profile:heading.overview_section")}
      </Typography>
      <AgeGenderLanguagesLabels user={user} profile={profile} />
      <RemainingAboutLabels user={user} profile={profile} />

      {profile.profileGalleryId && profile.profileGalleryId > 0 && (
        <>
          <ProfilePhotoGallery galleryId={profile.profileGalleryId} />
          <StyledDivider />
        </>
      )}

      {!profile.profileGalleryId && <StyledDivider />}

      {profile.aboutMe && (
        <>
          <Typography variant="h1">
            {t("profile:heading.who_section")}
          </Typography>
          <Markdown source={profile.aboutMe} />
          <StyledDivider />
        </>
      )}
      {profile.thingsILike && (
        <>
          <Typography variant="h1">
            {t("profile:heading.hobbies_section")}
          </Typography>
          <Markdown source={profile.thingsILike} />
          <StyledDivider />
        </>
      )}
      {profile.additionalInformation && (
        <>
          <Typography variant="h1">
            {t("profile:heading.additional_information_section")}
          </Typography>
          <Markdown source={profile.additionalInformation} />
          <StyledDivider />
        </>
      )}
      <Typography variant="h1">
        {t("profile:heading.travel_section")}
      </Typography>
      <Typography variant="body1">
        {regions && profile.regionsVisitedList.length > 0
          ? profile.regionsVisitedList
              .map((country) => regions[country])
              .join(`, `)
          : t("profile:regions_empty_state")}
      </Typography>
      <StyledDivider />
      <Typography variant="h1">{t("profile:heading.lived_section")}</Typography>
      <Typography variant="body1">
        {regions && profile.regionsLivedList.length > 0
          ? profile.regionsLivedList
              .map((country) => regions[country])
              .join(`, `)
          : t("profile:regions_empty_state")}
      </Typography>
      <StyledDivider />
      <Typography variant="h1">{t("profile:heading.map_section")}</Typography>
      <ComposableMap projection="geoEqualEarth">
        <Geographies geography={"/regions.json"}>
          {({ geographies }) =>
            geographies.map((geo) => {
              let color = theme.palette.grey[200];
              if (regions) {
                if (profile.regionsLivedList.includes(geo.id)) {
                  color = theme.palette.primary.main;
                } else if (profile.regionsVisitedList.includes(geo.id)) {
                  color = theme.palette.secondary.main;
                }
              }
              return (
                <Geography key={geo.rsmKey} geography={geo} fill={color} />
              );
            })
          }
        </Geographies>
      </ComposableMap>
    </StyledWrapper>
  );
}
