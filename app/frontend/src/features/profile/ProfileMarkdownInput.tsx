import { Box, Button, Grid, Link, makeStyles } from "@material-ui/core";
import Markdown from "components/Markdown";
import ProfileTextInput from "features/profile/ProfileTextInput";
import React, { useState } from "react";

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
            fullWidth
            onChange={(event) => onChange(event.target.value)}
            value={value}
          />
          <Box className={classes.reverseAlignment}>
            <Button component={Link} href="https://www.markdowntutorial.com/">
              Formatting?
            </Button>
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
