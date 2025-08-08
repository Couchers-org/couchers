import { appGetLayout } from "components/AppRoute";
import MarkdownPage, {
  MarkdownPageProps,
} from "features/markdown/MarkdownPage";
import { AUTH, GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticPaths, GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { getAllMarkdownPathsWithLocales } from "utils/markdownPages";

async function getMarkdownPageBySlug(
  slug: Array<string>,
  locale: string,
): Promise<MarkdownPageProps> {
  // Try new format first: markdown/locales/<locale>/<slug>.md
  try {
    const md = await import(`markdown/locales/${locale}/${slug.join("/")}.md`);
    return {
      slug,
      frontmatter: md.attributes,
      content: md.html,
    };
  } catch (error) {
    // Fallback to old format: markdown/<slug>.md (default English)
    try {
      const md = await import(`markdown/${slug.join("/")}.md`);
      return {
        slug,
        frontmatter: md.attributes,
        content: md.html,
      };
    } catch (e3) {
      // Not found in any location
      throw new Error(
        `Markdown file not found for slug: ${slug.join("/")} and locale: ${locale}`,
      );
    }
  }
}

export const getStaticPaths: GetStaticPaths = () => ({
  paths: getAllMarkdownPathsWithLocales(),
  fallback: false,
});

export const getStaticProps: GetStaticProps = async ({ locale, params }) => {
  const lang = locale ?? "en";
  return {
    props: {
      ...(await serverSideTranslations(
        lang,
        [GLOBAL, AUTH, NOTIFICATIONS],
        nextI18nextConfig,
      )),
      page: await getMarkdownPageBySlug(params!.slug as Array<string>, lang),
    },
  };
};

export default function Markdown({ page }: { page: MarkdownPageProps }) {
  return <MarkdownPage {...page} />;
}

Markdown.getLayout = appGetLayout({
  isPrivate: false,
});
