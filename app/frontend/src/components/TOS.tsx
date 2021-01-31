import { Link } from "@material-ui/core";
import React from "react";

import PageTitle from "./PageTitle";
import TextBody from "./TextBody";

export default function TOS() {
  return (
    <>
      <PageTitle>Terms of Service</PageTitle>
      <TextBody>
        This is a test TOS. I agree to follow the&nbsp;
        <Link href="https://community.couchers.org/faq">
          Couchers guidelines
        </Link>
        . I understand this is a preview of couchers.org and my data may be
        erased. Lorem Ipsum is simply dummy text of the printing and typesetting
        industry.
        <br />
        <br />
        Lorem Ipsum has been the industry's standard dummy text ever since the
        1500s, when an unknown printer took a galley of type and scrambled it to
        make a type specimen book. It has survived not only five centuries, but
        also the leap into electronic typesetting, remaining essentially
        unchanged.
        <br />
        <br />
        It was popularised in the 1960s with the release of Letraset sheets
        containing Lorem Ipsum passages, and more recently with desktop
        publishing software like Aldus PageMaker including versions of Lorem
        Ipsum.
      </TextBody>
    </>
  );
}
