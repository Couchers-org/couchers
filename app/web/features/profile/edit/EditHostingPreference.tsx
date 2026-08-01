import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import {
  ParkingDetails,
  SleepingArrangement,
  SmokingLocation,
  User,
} from "couchers/proto/api_pb";
import useCurrentUser from "features/userQueries/useCurrentUser";
import React from "react";

import { HostingPreferenceData } from "../../../service/user";
import EditHostingPreferenceForm from "./EditHostingPreferenceForm";

export default function EditHostingPreference() {
  const { data: user } = useCurrentUser();

  if (user) {
    const userToFormValues = (user: User.AsObject): HostingPreferenceData => ({
      lastMinute: !!user.lastMinute?.value,
      wheelchairAccessible: !!user.wheelchairAccessible?.value,
      campingOk: !!user.campingOk?.value,
      acceptsKids: !!user.acceptsKids?.value,
      acceptsPets: !!user.acceptsPets?.value,
      drinkingAllowed: !!user.drinkingAllowed?.value,
      maxGuests: user.maxGuests?.value ?? 1,
      smokingAllowed:
        user.smokingAllowed || SmokingLocation.SMOKING_LOCATION_UNKNOWN,
      aboutPlace: user.aboutPlace ?? "",
      sleepingArrangement:
        user.sleepingArrangement ||
        SleepingArrangement.SLEEPING_ARRANGEMENT_UNKNOWN,
      hasHousemates: !!user.hasHousemates?.value,
      housemateDetails: user.housemateDetails?.value ?? "",
      hasKids: !!user.hasKids?.value,
      kidDetails: user.kidDetails?.value ?? "",
      hasPets: !!user.hasPets?.value,
      petDetails: user.petDetails?.value ?? "",
      parking: !!user.parking?.value,
      parkingDetails:
        user.parkingDetails || ParkingDetails.PARKING_DETAILS_UNKNOWN,
      drinksAtHome: !!user.drinksAtHome?.value,
      smokesAtHome: !!user.smokesAtHome?.value,
      area: user.area?.value ?? "",
      sleepingDetails: user.sleepingDetails?.value ?? "",
      houseRules: user.houseRules?.value ?? "",
      otherHostInfo: user.otherHostInfo?.value ?? "",
    });
    return <EditHostingPreferenceForm user={userToFormValues(user)} />;
  }

  return <CenteredSpinner />;
}
