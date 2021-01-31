import { Box, makeStyles } from "@material-ui/core";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import Button from "../../../components/Button";
import EditUserLocationMap, {
  ApproximateLocation,
} from "../../../components/EditUserLocationMap";
import TextBody from "../../../components/TextBody";
import { service } from "../../../service";

const useStyles = makeStyles({ map: { height: "40vh" } });

interface LocationInfo {
  city: string;
  location: ApproximateLocation;
}

interface LocationSectionProps {
  updateJailed: () => void;
  className?: string;
}

export default function LocationSection({
  updateJailed,
  className,
}: LocationSectionProps) {
  const classes = useStyles();

  const [completed, setCompleted] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    getValues,
    setValue,
  } = useForm<LocationInfo>({
    defaultValues: { city: "", location: {} },
  });

  //city isn't an actual field anywhere, so register here
  useEffect(() => register("city"), [register]);

  const save = handleSubmit(async ({ city, location }) => {
    const { lat, lng, radius } = location;
    const info = await service.jail.setLocation(city, lat, lng, radius);
    if (!info.isJailed) {
      updateJailed();
    } else {
      //if user is no longer jailed, this component will be unmounted anyway
      setCompleted(true);
    }
  });

  return (
    <>
      <Box className={className}>
        <Controller
          name="location"
          control={control}
          render={({ onChange }) => (
            <EditUserLocationMap
              className={classes.map}
              //react-hook-forms doesn't set value immediately
              //so || "" prevents a uncontrolled->controlled warning
              city={getValues("city") || ""}
              setCity={(value) => setValue("city", value)}
              setLocation={(location) =>
                onChange({
                  lat: location.lat,
                  lng: location.lng,
                  radius: location.radius,
                })
              }
            />
          )}
        />

        <TextBody>
          <Button onClick={save} disabled={completed}>
            {completed ? "Thanks!" : "Save"}
          </Button>
          {completed && (
            <Button component="a" onClick={save}>
              Re-submit
            </Button>
          )}
        </TextBody>
      </Box>
    </>
  );
}
