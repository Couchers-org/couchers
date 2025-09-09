import { Box, Button, Grid, Link } from "@mui/material";
import React, { useState } from "react";

import Markdown from "@/components/Markdown";
import TextField from "@/components/TextField";

interface NewCommentProps {
  onComment: (comment: string) => Promise<void>;
}

export default function NewComment({ onComment }: NewCommentProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [comment, setComment] = useState("");

  const handleSubmit = async () => {
    await onComment(comment);
    setComment("");
  };

  return (
    <>
      <p>Write a comment:</p>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: isPreview ? 6 : 12 }}>
          <TextField
            id="new-comment"
            label="Text field"
            maxRows={5}
            multiline
            fullWidth
            onChange={(e) => { setComment(e.target.value); }}
            value={comment}
            margin="normal"
          />
          <Box sx={{ textAlign: "end" }}>
            <Button component={Link} href="https://www.markdowntutorial.com/">
              Formatting?
            </Button>
            <Button component={Link} onClick={() => { setIsPreview(!isPreview); }}>
              Preview?
            </Button>
          </Box>
        </Grid>
        {isPreview && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Markdown source={comment} />
          </Grid>
        )}
      </Grid>
      <Button onClick={handleSubmit} type="submit">
        Comment
      </Button>
    </>
  );
}
