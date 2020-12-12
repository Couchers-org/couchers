import { makeStyles } from "@material-ui/core";
import React, { useState } from "react";
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

export default function LocationSection({
  updateJailed,
}: {
  updateJailed: () => void;
}) {
  const classes = useStyles();

  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, getValues, setValue } = useForm<LocationInfo>({
    defaultValues: { city: "", location: {} },
  });

  const save = handleSubmit(async ({ city, location }) => {
    const { lat, lng, radius } = location;
    setLoading(true);
    const info = await service.jail.setLocation(city, lat, lng, radius);
    if (!info.isJailed) {
      updateJailed();
    } else {
      //if user is no longer jailed, this component will be unmounted anyway
      setLoading(false);
      setCompleted(true);
    }
  });

  return (
    <>
      <form onSubmit={save}>
        <Controller
          name="location"
          control={control}
          render={({ onChange }) => (
            <EditUserLocationMap
              className={classes.map}
              city={getValues("city")}
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
          <Button
            loading={loading}
            onClick={save}
            disabled={completed || loading}
          >
            {completed ? "Thanks!" : "Save"}
          </Button>
          {completed && (
            <Button component="a" onClick={save} disable={loading}>
              Re-submit
            </Button>
          )}
        </TextBody>
      </form>
    </>
  );
}
