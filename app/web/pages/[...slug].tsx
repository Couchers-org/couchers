import { appGetLayout } from "components/AppRoute";
import MarkdownPage, { MarkdownPageProps } from "features/markdown/MarkdownPage";
import { appServerSideTranslations } from "i18n/appServerSideTranslations";
import { AUTH, GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticPaths, GetStaticProps } from "next";

async function getMarkdownPageBySlug(slug: Array<string>): Promise<MarkdownPageProps> {
  const md = await import(`markdown/${slug.join("/")}.md`);
  return { slug, frontmatter: md.attributes, content: md.html };
}

export const getStaticPaths: GetStaticPaths = () => {
  // Return empty paths for fast builds
  // Pages will be generated on-demand with fallback: 'blocking'
  return {
    paths: [],
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = async ({ locale, params }) => {
  const slug = params!.slug as Array<string>;

  try {
    return {
      props: {
        ...(await appServerSideTranslations(locale ?? "en", [GLOBAL, AUTH, NOTIFICATIONS])),
        page: await getMarkdownPageBySlug(slug),
      },
    };
  } catch {
    // Markdown file doesn't exist or path is invalid
    return { notFound: true };
  }
};

export default function Markdown({ page }: { page: MarkdownPageProps }) {
  return <MarkdownPage {...page} />;
}

Markdown.getLayout = appGetLayout({
  isPrivate: false,
});
