import { Card, CardContent, Hidden, Link, Typography } from "@material-ui/core";
import TextBody from "components/TextBody";
import UserSummary from "components/UserSummary";
import {
  CONTACT_LINK,
  CONTACT_US,
  COUCHER_WAS_APPROPRIATE,
  COUCHER_WAS_NOT_APPROPRIATE,
  FURTHER,
  PRIVATE_REFERENCE,
  PUBLIC_REFERENCE,
  RATING,
  RATING_SCALE,
  REFERENCE_MOBILE_USER,
  REFERENCE_SUBMIT_HEADING,
  THANK_YOU,
} from "features/communities/constants";
import { useData } from "features/communities/leaveReference/ReferenceDataContext";
import {
  ReferenceFormProps,
  useReferenceStyles,
} from "features/communities/leaveReference/ReferenceForm";
import React from "react";

export default function ReferenceOverview({ user }: ReferenceFormProps) {
  const { data } = useData()!;
  const classes = useReferenceStyles();

  return (
    <>
      <Typography variant="h2">{REFERENCE_SUBMIT_HEADING}</Typography>
      <TextBody className={classes.text}>{THANK_YOU}</TextBody>
      <Hidden mdUp>
        <TextBody className={classes.text}>{REFERENCE_MOBILE_USER}</TextBody>
        <UserSummary user={user} />
      </Hidden>
      <Typography variant="h3" className={classes.text}>
        {PUBLIC_REFERENCE}
      </Typography>
      <Card className={classes.card}>
        <CardContent>
          <TextBody className={classes.text}>{data.text}</TextBody>
        </CardContent>
      </Card>
      <Typography variant="h3" className={classes.text}>
        {PRIVATE_REFERENCE}
      </Typography>
      <ul>
        {data.wasAppropriate === "true" ? (
          <li>
            <TextBody className={classes.text}>
              {COUCHER_WAS_APPROPRIATE}
            </TextBody>
          </li>
        ) : (
          <li>
            <TextBody className={classes.text}>
              {COUCHER_WAS_NOT_APPROPRIATE}
            </TextBody>
          </li>
        )}
        <li>
          <TextBody className={classes.text}>
            {RATING}
            {data.rating}
            {RATING_SCALE}
          </TextBody>
        </li>
      </ul>
      <TextBody className={classes.text}>
        {FURTHER}
        <Link href={CONTACT_LINK} target="_blank">
          {CONTACT_US}
        </Link>
      </TextBody>
    </>
  );
}
