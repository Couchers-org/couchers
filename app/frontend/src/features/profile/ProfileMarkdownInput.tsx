import { Box, Button, Grid, Link, makeStyles } from "@material-ui/core";
import React, { useState } from "react";
import Markdown from "../../components/Markdown";
import ProfileTextInput from "./ProfileTextInput";

const useStyles = makeStyles({
  reverseAlignment: {
    textAlign: "end",
  },
});

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
  const classes = useStyles();
  const [preview, setPreview] = useState(false);
  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12} md={preview ? 6 : 12}>
          <ProfileTextInput
            label={label}
            rowsMax={5}
            multiline
            onChange={(event) => onChange(event.target.value)}
            value={value}
          />
          <Box className={classes.reverseAlignment}>
            <Button component={Link} onClick={() => setPreview(!preview)}>
              Preview?
            </Button>
          </Box>
        </Grid>
        {preview && (
          <Grid item xs={12} md={6}>
            <Markdown source={value} />
          </Grid>
        )}
      </Grid>
    </>
  );
}
