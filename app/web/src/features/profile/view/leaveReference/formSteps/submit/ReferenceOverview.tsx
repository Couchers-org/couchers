import { Card, CardContent, Hidden, Link, Typography } from "@material-ui/core";
import SliderLabel from "components/RatingsSlider/SliderLabel";
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
  REFERENCE_MOBILE_USER,
  THANK_YOU,
} from "features/profile/constants";
import { useProfileUser } from "features/profile/hooks/useProfileUser";
import { useReferenceStyles } from "features/profile/view/leaveReference/ReferenceForm";

import { SubmitReferenceProps } from "./SubmitReference";

export default function ReferenceOverview({
  referenceData,
}: SubmitReferenceProps) {
  const classes = useReferenceStyles();
  const user = useProfileUser();

  return (
    <>
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
          <TextBody className={classes.referenceText}>
            {referenceData.text}
          </TextBody>
        </CardContent>
      </Card>
      <Typography variant="h3" className={classes.text}>
        {PRIVATE_REFERENCE}
      </Typography>
      <ul>
        <li>
          <TextBody className={classes.text}>
            {referenceData.wasAppropriate === "true"
              ? COUCHER_WAS_APPROPRIATE
              : COUCHER_WAS_NOT_APPROPRIATE}
          </TextBody>
        </li>
        <li>
          <TextBody className={classes.text}>
            {RATING}
            <SliderLabel value={referenceData.rating} />
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
