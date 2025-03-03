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

type StillHosting = "yes" | "no";

interface ActivenessProbeSectionProps {
  updateJailed: () => void;
  className?: string;
}

export default function ActivenessProbeSection({
  updateJailed,
  className,
}: ActivenessProbeSectionProps) {
  const { t } = useTranslation([AUTH, GLOBAL]);

  const [selected, setSelected] = useState<StillHosting | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    const info = await service.jail.respondToActivenessProbe(
      selected == "yes"
        ? ActivenessProbeResponse.ACTIVENESS_PROBE_RESPONSE_STILL_ACTIVE
        : ActivenessProbeResponse.ACTIVENESS_PROBE_RESPONSE_NO_LONGER_ACTIVE,
    );
    if (!info.isJailed) {
      updateJailed();
    }
    setLoading(false);
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
          value={selected ?? null}
          onChange={(e, val) => setSelected(val as StillHosting)}
        >
          <FormControlLabel
            value="yes"
            control={<Radio />}
            label={t("auth:jail.activeness_probe.still_hosting")}
          />
          <FormControlLabel
            value="no"
            control={<Radio />}
            label={t("auth:jail.activeness_probe.not_hosting")}
          />
        </RadioGroup>
      </FormControl>
      <Typography variant="body2" gutterBottom>
        {t("auth:jail.activeness_probe.note")}
      </Typography>
      <Button loading={loading} onClick={save} disabled={!selected}>
        {t("global:save")}
      </Button>
    </div>
  );
}
