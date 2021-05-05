import { Link } from "@material-ui/core";
import React from "react";

import TextBody from "./TextBody";

import {
  SIGN_UP_TOS_LINK_TEXT,
  SIGN_UP_TOS_LINK_URL,
} from "../features/auth/constants";

export default function TOS() {
  return (
    <>
      <TextBody>
        <Link href={SIGN_UP_TOS_LINK_URL} target="_blank" rel="noreferrer">
          {SIGN_UP_TOS_LINK_TEXT}
        </Link>
      </TextBody>
    </>
  );
}
