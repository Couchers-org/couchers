import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import { useCurrentProfile } from "features/userQueries/useProfile";
import React from "react";

import {
  ParkingDetails,
  Profile,
  SleepingArrangement,
  SmokingLocation,
} from "../../../proto/api_pb";
import { HostingPreferenceData } from "../../../service/user";
import { DEFAULT_ABOUT_HOME_HEADINGS } from "./constants";
import EditHostingPreferenceForm from "./EditHostingPreferenceForm";

export default function EditHostingPreference() {
  const { data: profile } = useCurrentProfile();

  if (profile) {
    const profileToFormValues = (
      profile: Profile.AsObject,
    ): HostingPreferenceData => ({
      lastMinute: !!profile.lastMinute?.value,
      wheelchairAccessible: !!profile.wheelchairAccessible?.value,
      campingOk: !!profile.campingOk?.value,
      acceptsKids: !!profile.acceptsKids?.value,
      acceptsPets: !!profile.acceptsPets?.value,
      drinkingAllowed: !!profile.drinkingAllowed?.value,
      maxGuests: profile.maxGuests?.value ?? 1,
      smokingAllowed:
        profile.smokingAllowed || SmokingLocation.SMOKING_LOCATION_UNKNOWN,
      aboutPlace: profile.aboutPlace || DEFAULT_ABOUT_HOME_HEADINGS,
      sleepingArrangement:
        profile.sleepingArrangement ||
        SleepingArrangement.SLEEPING_ARRANGEMENT_UNKNOWN,
      hasHousemates: !!profile.hasHousemates?.value,
      housemateDetails: profile.housemateDetails?.value ?? "",
      hasKids: !!profile.hasKids?.value,
      kidDetails: profile.kidDetails?.value ?? "",
      hasPets: !!profile.hasPets?.value,
      petDetails: profile.petDetails?.value ?? "",
      parking: !!profile.parking?.value,
      parkingDetails:
        profile.parkingDetails || ParkingDetails.PARKING_DETAILS_UNKNOWN,
      drinksAtHome: !!profile.drinksAtHome?.value,
      smokesAtHome: !!profile.smokesAtHome?.value,
      area: profile.area?.value ?? "",
      sleepingDetails: profile.sleepingDetails?.value ?? "",
      houseRules: profile.houseRules?.value ?? "",
      otherHostInfo: profile.otherHostInfo?.value ?? "",
    });
    return <EditHostingPreferenceForm user={profileToFormValues(profile)} />;
  }

  return <CenteredSpinner />;
}
