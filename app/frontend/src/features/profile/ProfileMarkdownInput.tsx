import { Grid, Hidden, Typography } from "@material-ui/core";
import React from "react";
import Markdown from "../../components/Markdown";
import ProfileTextInput from "./ProfileTextInput";

interface ProfileMarkdownInputProps {
  onChange: (value: string) => void;
  value: string;
  label: string;
}

export default function ProfileMarkdownInput({
  onChange,
  value,
  label,
}: ProfileMarkdownInputProps) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <ProfileTextInput
          label={label}
          rowsMax={5}
          multiline
          onChange={(event) => onChange(event.target.value)}
          value={value}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <Hidden mdUp>
          <Typography variant="caption">{`${label} preview`}</Typography>
        </Hidden>
        <Markdown source={value} />
      </Grid>
    </Grid>
  );
}
