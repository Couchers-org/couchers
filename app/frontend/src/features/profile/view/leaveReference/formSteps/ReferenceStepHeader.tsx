import { Typography } from "@material-ui/core";
import HeaderButton from "components/HeaderButton";
import { BackIcon } from "components/Icons";
import {
  PREVIOUS_STEP,
  REFERENCE_FORM_HEADING_FRIEND,
  REFERENCE_FORM_HEADING_HOSTED,
  REFERENCE_FORM_HEADING_SURFED,
  REFERENCE_SUBMIT_HEADING,
} from "features/profile/constants";
import { ReferenceType } from "proto/references_pb";
import { useHistory } from "react-router";
import { referenceTypeRoute } from "routes";
import makeStyles from "utils/makeStyles";

export interface ReferenceStepHeaderProps {
  name?: string;
  referenceType?: string;
  isSubmitStep?: boolean;
}

const useStyles = makeStyles((theme) => ({
  header: {
    alignItems: "center",
    display: "flex",
  },
  title: {
    marginInlineStart: theme.spacing(2),
  },
}));

export default function ReferenceStepHeader({
  name,
  referenceType,
  isSubmitStep = false,
}: ReferenceStepHeaderProps) {
  const history = useHistory();
  const classes = useStyles();

  return (
    <div className={classes.header}>
      <HeaderButton onClick={() => history.goBack()} aria-label={PREVIOUS_STEP}>
        <BackIcon />
      </HeaderButton>
      <Typography variant="h2" className={classes.title}>
        {isSubmitStep
          ? REFERENCE_SUBMIT_HEADING
          : `${
              referenceType ===
              referenceTypeRoute[ReferenceType.REFERENCE_TYPE_FRIEND]
                ? REFERENCE_FORM_HEADING_FRIEND
                : referenceType ===
                  referenceTypeRoute[ReferenceType.REFERENCE_TYPE_SURFED]
                ? REFERENCE_FORM_HEADING_SURFED
                : REFERENCE_FORM_HEADING_HOSTED
            } ${name}`}
      </Typography>
    </div>
  );
}
