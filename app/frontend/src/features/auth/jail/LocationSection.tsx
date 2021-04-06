import { Box, makeStyles } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import EditLocationMap, {
  ApproximateLocation,
} from "components/EditLocationMap";
import TextBody from "components/TextBody";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { service } from "service";

import { SIGN_UP_LOCATION_MISSING } from "../constants";

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
  const [error, setError] = useState("");

  const { control, handleSubmit } = useForm<LocationInfo>({
    defaultValues: { location: {} },
  });

  const save = handleSubmit(async ({ location }) => {
    try {
      const { address, lat, lng, radius } = location;
      if (address === "") {
        setError(SIGN_UP_LOCATION_MISSING);
      } else {
        const info = await service.jail.setLocation(address, lat, lng, radius);
        if (!info.isJailed) {
          updateJailed();
        } else {
          //if user is no longer jailed, this component will be unmounted anyway
          setCompleted(true);
        }
      }
    } catch (e) {
      console.error(e);
      setError(e.message);
    }
  });

  return (
    <>
      <Box className={className}>
        <Controller
          name="location"
          control={control}
          rules={{ required: true }}
          render={({ onChange }) => (
            <EditLocationMap
              className={classes.map}
              updateLocation={(location) => {
                if (location) {
                  onChange({
                    address: location.address,
                    lat: location.lat,
                    lng: location.lng,
                    radius: location.radius,
                  });
                } else {
                  onChange({
                    address: "",
                  });
                }
              }}
            />
          )}
        />

        <TextBody>
          {error && <Alert severity="error">{error}</Alert>}
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
