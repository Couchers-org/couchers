import { Box, makeStyles } from "@material-ui/core";
import Button from "components/Button";
import EditLocationMap, {
  ApproximateLocation,
} from "components/EditLocationMap";
import TextBody from "components/TextBody";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { service } from "service";

const useStyles = makeStyles({ map: { height: "40vh" } });

interface LocationInfo {
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

  const { control, handleSubmit } = useForm<LocationInfo>({
    defaultValues: { location: {} },
  });

  const save = handleSubmit(async ({ location }) => {
    const { address, lat, lng, radius } = location;
    const info = await service.jail.setLocation(address, lat, lng, radius);
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
            <EditLocationMap
              className={classes.map}
              updateLocation={(location) =>
                onChange({
                  address: location.address,
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
