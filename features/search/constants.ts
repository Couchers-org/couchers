import { TFunction } from "i18n";
import maplibregl from "maplibre-gl";
import { User } from "proto/api_pb";
import { UserSearchFilters } from "service/search";
import { firstName } from "utils/names";

export const aboutText = (user: User.AsObject, t: TFunction) => {
  const missingAbout = user.aboutMe.length === 0;
  return missingAbout
    ? t("search:search_result.missing_about_description", {
        name: firstName(user?.name),
      })
    : user.aboutMe.length < 300
    ? user.aboutMe
    : user.aboutMe.substring(0, 300) + "...";
};

export const getLastActiveOptions = (t: TFunction) => [
  { label: t("search:last_active_options.any"), value: null },
  { label: t("search:last_active_options.last_day"), value: 1 },
  { label: t("search:last_active_options.last_week"), value: 7 },
  { label: t("search:last_active_options.last_2_weeks"), value: 14 },
  { label: t("search:last_active_options.last_month"), value: 31 },
  { label: t("search:last_active_options.last_3_months"), value: 93 },
];

export const selectedUserZoom = 12;

export type MapClickedCallback = (
  ev: maplibregl.MapMouseEvent & {
    features?: maplibregl.MapboxGeoJSONFeature[] | undefined;
  } & maplibregl.EventData
) => void;

export interface SearchParams extends UserSearchFilters {
  location?: string;
}
