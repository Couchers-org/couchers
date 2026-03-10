import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader("Content-Type", "application/json");
  res.write(
    JSON.stringify({
      version: process.env.NEXT_PUBLIC_VERSION || "unknown",
      display_version: process.env.NEXT_PUBLIC_DISPLAY_VERSION || "dev",
    })
  );
  res.end();
  return { props: {} };
};

export default function Version() {
  return null;
}
