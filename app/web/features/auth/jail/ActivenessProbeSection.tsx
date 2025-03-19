import {
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import Button from "components/Button";
import { useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { ActivenessProbeResponse } from "proto/jail_pb";
import React, { useState } from "react";
import { service } from "service";
import { theme } from "theme";

interface ActivenessProbeSectionProps {
  updateJailed: () => void;
  className?: string;
}

export default function ActivenessProbeSection({
  updateJailed,
  className,
}: ActivenessProbeSectionProps) {
  const { t } = useTranslation([AUTH, GLOBAL]);

  const [isSelected, setIsSelected] = useState<boolean | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    const info = await service.jail.respondToActivenessProbe(
      isSelected
        ? ActivenessProbeResponse.ACTIVENESS_PROBE_RESPONSE_STILL_ACTIVE
        : ActivenessProbeResponse.ACTIVENESS_PROBE_RESPONSE_NO_LONGER_ACTIVE,
    );
    if (!info.isJailed) {
      updateJailed();
    }
    setIsLoading(false);
  };

  return (
    <div className={className}>
      <Typography variant="h2" id="still-hosting">
        {t("auth:jail.activeness_probe.title")}
      </Typography>
      <Typography variant="body1">
        {t("auth:jail.activeness_probe.description")}
      </Typography>
      <FormControl variant="standard" component="fieldset">
        <RadioGroup
          value={isSelected}
          onChange={(e, val) => setIsSelected(val === "true")}
        >
          <FormControlLabel
            value={true}
            control={<Radio />}
            label={t("auth:jail.activeness_probe.still_hosting")}
          />
          <FormControlLabel
            value={false}
            control={<Radio />}
            label={t("auth:jail.activeness_probe.not_hosting")}
          />
        </RadioGroup>
      </FormControl>
      <Typography
        variant="body2"
        gutterBottom
        sx={{ marginTop: theme.spacing(2) }}
      >
        {t("auth:jail.activeness_probe.note")}
      </Typography>
      <Button
        loading={isLoading}
        onClick={handleSave}
        disabled={isSelected === undefined}
        sx={{ marginTop: theme.spacing(2) }}
      >
        {t("global:save")}
      </Button>
    </div>
  );
}
