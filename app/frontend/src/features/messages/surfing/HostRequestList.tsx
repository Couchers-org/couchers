import { Box, BoxProps, Link, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import * as React from "react";
import TextBody from "../../../components/TextBody";
import { HostRequest } from "../../../pb/requests_pb";
import HostRequestListItem from "./HostRequestListItem";

const useStyles = makeStyles({ root: {} });

export interface HostRequestListProps extends BoxProps {
  setHostRequest: (groupChat: HostRequest.AsObject) => void;
  hostRequests: Array<HostRequest.AsObject>;
}

export default function HostRequestList({
  hostRequests,
  setHostRequest,
}: HostRequestListProps) {
  const classes = useStyles();

  return (
    <>
      <Box className={classes.root}>
        <Typography variant="h2">Requests</Typography>
        {!hostRequests.length ? (
          <TextBody>No requests yet.</TextBody>
        ) : (
          hostRequests.map((hostRequest) => (
            <Link
              key={hostRequest.hostRequestId}
              onClick={() => setHostRequest(hostRequest)}
            >
              <HostRequestListItem hostRequest={hostRequest} />
            </Link>
          ))
        )}
      </Box>
    </>
  );
}
