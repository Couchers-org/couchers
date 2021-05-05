import { Link } from "@material-ui/core";
import React from "react";

import TextBody from "./TextBody";

export default function TOS() {
  return (
    <>
      <TextBody>
        <Link href="https://community.couchers.org/"
              target="_blank"
              rel="noreferrer">
          Link to TOS
        </Link>
      </TextBody>
    </>
  );
}
