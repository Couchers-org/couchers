import { Typography } from "@material-ui/core";
import * as Sentry from "@sentry/react";
import Alert from "components/Alert";
import Button from "components/Button";
import EditLocationMap, {
  ApproximateLocation,
} from "components/EditLocationMap";
import TextBody from "components/TextBody";
import { useTranslation } from "next-i18next";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { service } from "service";
import isGrpcError from "utils/isGrpcError";

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
  const { t } = useTranslation(["auth", "global"]);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");

  const { control, handleSubmit } = useForm<LocationInfo>({
    defaultValues: { location: {} },
  });

  const save = handleSubmit(async ({ location }) => {
    try {
      const { address, lat, lng, radius } = location;
      if (address === "") {
        setError(t("auth:location.validation_error"));
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
      Sentry.captureException(e, {
        tags: {
          featureArea: "auth/jail/locationField",
        },
      });
      setError(isGrpcError(e) ? e.message : t("global:fatal_error_message"));
    }
  });

  return (
    <>
      <Typography variant="h2">
        {t("auth:jail.location_section.title")}
      </Typography>
      <div className={className}>
        {error && <Alert severity="error">{error}</Alert>}
        <Controller
          name="location"
          control={control}
          render={({ onChange }) => (
            <EditLocationMap
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
          <Button onClick={save} disabled={completed}>
            {!completed
              ? t("auth:jail.location_section.submit_button.active_text")
              : t("auth:jail.location_section.submit_button.inactive_text")}
          </Button>
          {completed && (
            <Button component="a" onClick={save}>
              {t("auth:jail.location_section.resubmit_button_text")}
            </Button>
          )}
        </TextBody>
      </div>
    </>
  );
}
