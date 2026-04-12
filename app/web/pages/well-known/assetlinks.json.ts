import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const packageName = process.env.NEXT_PUBLIC_ANDROID_PACKAGE_NAME;
  const fingerprint = process.env.NEXT_PUBLIC_ANDROID_CERT_FINGERPRINT;

  res.setHeader("Content-Type", "application/json");
  res.write(
    JSON.stringify([
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: packageName,
          sha256_cert_fingerprints: [fingerprint],
        },
      },
    ]),
  );
  res.end();
  return { props: {} };
};

export default function AssetLinks() {
  return null;
}
