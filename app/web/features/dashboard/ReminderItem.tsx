// interface ReminderItemProps {
//   reminder: any;
// }

import { Typography } from "@mui/material";
import Button from "components/Button";
import Link from "next/link";

export default function ReminderItem() {
  // { reminder }: ReminderItemProps
  return (
    <>
      {/* {JSON.stringify(reminder)}
      <div>{reminder}</div> */}
      {/* <Box
        sx={{
          bgcolor: "#fff5e4",
        }}
        maxWidth="lg"
      > */}
      <button>×</button>

      <Typography
        variant="h1"
        component="h2"
        sx={{
          marginBottom: "16px",
        }}
      >
        Title
      </Typography>
      <p>Description</p>

      <Button component={Link} color="primary" href={""}>
        Button
      </Button>
      {/* </Box> */}
    </>
  );
}
