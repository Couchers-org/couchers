import { Card, CardContent, Hidden, Link, Typography } from "@material-ui/core";
import SliderLabel from "components/RatingsSlider/SliderLabel";
import TextBody from "components/TextBody";
import UserSummary from "components/UserSummary";
import { contactLink } from "features/profile/constants";
import { useProfileUser } from "features/profile/hooks/useProfileUser";
import {
  ReferenceContextFormData,
  useReferenceStyles,
} from "features/profile/view/leaveReference/ReferenceForm";
import { Trans, useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";

export default function ReferenceOverview({
  referenceData,
}: {
  referenceData: ReferenceContextFormData;
}) {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const classes = useReferenceStyles();
  const user = useProfileUser();

  return (
    <>
      <TextBody className={classes.text}>
        {t("profile:leave_reference.thank_you_message")}
      </TextBody>
      <Hidden mdUp>
        <TextBody className={classes.text}>
          {t("profile:leave_reference.writing_for_text")}
        </TextBody>
        <UserSummary user={user} />
      </Hidden>
      <Typography variant="h3" className={classes.text}>
        {t("profile:leave_reference.public_text_label")}
      </Typography>
      <Card className={classes.card}>
        <CardContent>
          <TextBody className={classes.referenceText}>
            {referenceData.text}
          </TextBody>
        </CardContent>
      </Card>
      <Typography variant="h3" className={classes.text}>
        {t("profile:leave_reference.private_text_label")}
      </Typography>
      <ul>
        <li>
          <TextBody className={classes.text}>
            {referenceData.wasAppropriate === "true"
              ? t("profile:leave_reference.coucher_was_appropriate")
              : t("profile:leave_reference.coucher_was_not_appropriate")}
          </TextBody>
        </li>
        <li>
          <TextBody className={classes.text}>
            {t("profile:leave_reference.rating_label")}
            <SliderLabel value={referenceData.rating} />
          </TextBody>
        </li>
      </ul>
      <TextBody className={classes.text}>
        <Trans t={t} i18nKey="profile:leave_reference.contact_text">
          If you have any questions or wish to provide additional information,
          please don't hesitate to
          <Link href={contactLink} target="_blank">
            contact us here.
          </Link>
        </Trans>
      </TextBody>
    </>
  );
}
