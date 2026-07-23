import { Box, Button, Grid, Link } from "@mui/material";
import Markdown from "components/Markdown";
import ProfileIncompleteDialog from "components/ProfileIncompleteDialog/ProfileIncompleteDialog";
import TextField from "components/TextField";
import useAccountInfo from "features/auth/useAccountInfo";
import React, { useState } from "react";

interface NewCommentProps {
  onComment: (comment: string) => Promise<void>;
}

export default function NewComment({ onComment }: NewCommentProps) {
  const { data: accountInfo } = useAccountInfo();
  const [preview, setPreview] = useState(false);
  const [comment, setComment] = useState("");
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const handleSubmit = async () => {
    if (accountInfo?.profileComplete === false) {
      setProfileDialogOpen(true);
      return;
    }
    await onComment(comment);
    setComment("");
  };

  return (
    <>
      <ProfileIncompleteDialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        attempted_action="post_comment"
      />
      <p>Write a comment:</p>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: preview ? 6 : 12 }}>
          <TextField
            id="new-comment"
            label="Text field"
            maxRows={5}
            multiline
            fullWidth
            onChange={(e) => setComment(e.target.value)}
            value={comment}
            margin="normal"
          />
          <Box sx={{ textAlign: "end" }}>
            <Button component={Link} href="https://www.markdowntutorial.com/">
              Formatting?
            </Button>
            <Button component={Link} onClick={() => setPreview(!preview)}>
              Preview?
            </Button>
          </Box>
        </Grid>
        {preview && (
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
