import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const appId = process.env.NEXT_PUBLIC_IOS_APP_ID;

  res.setHeader("Content-Type", "application/json");
  res.write(
    JSON.stringify({
      applinks: {
        apps: [],
        details: [
          {
            appIDs: [appId],
            components: [{ "/": "/*" }],
          },
        ],
      },
      webcredentials: {
        apps: [appId],
      },
    }),
  );
  res.end();
  return { props: {} };
};

export default function AppleAppSiteAssociation() {
  return null;
}
