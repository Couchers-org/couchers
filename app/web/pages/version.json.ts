import type { GetServerSideProps } from "next";

const startTime = Date.now();
const STABLE_THRESHOLD_MS = 15 * 60 * 1000;

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader("Content-Type", "application/json");
  res.write(
    JSON.stringify({
      version: process.env.NEXT_PUBLIC_VERSION || "unknown",
      display_version: process.env.NEXT_PUBLIC_DISPLAY_VERSION || "dev",
      stable: Date.now() - startTime >= STABLE_THRESHOLD_MS,
    })
  );
  res.end();
  return { props: {} };
};

export default function Version() {
  return null;
}
