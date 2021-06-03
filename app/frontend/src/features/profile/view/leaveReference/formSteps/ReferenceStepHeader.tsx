import { Typography } from "@material-ui/core";
import {
  REFERENCE_FORM_HEADING_FRIEND,
  REFERENCE_FORM_HEADING_HOSTED,
  REFERENCE_FORM_HEADING_SURFED,
} from "features/profile/constants";
import { ReferenceType } from "pb/references_pb";
import { referenceTypeRoute } from "routes";

export interface ReferenceStepHeaderProps {
  name: string;
  referenceType: string;
}

export default function ReferenceStepHeader({
  name,
  referenceType,
}: ReferenceStepHeaderProps) {
  return (
    <Typography variant="h2">
      {referenceType === referenceTypeRoute[ReferenceType.REFERENCE_TYPE_FRIEND]
        ? REFERENCE_FORM_HEADING_FRIEND
        : referenceType ===
          referenceTypeRoute[ReferenceType.REFERENCE_TYPE_SURFED]
        ? REFERENCE_FORM_HEADING_SURFED
        : REFERENCE_FORM_HEADING_HOSTED}
      {name}
    </Typography>
  );
}
