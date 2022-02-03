import { appGetLayout } from "components/AppRoute";
import MarkdownPage, {
  MarkdownPageProps,
} from "features/markdown/MarkdownPage";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { GetStaticPaths, GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { getAllMarkdownSlugs } from "utils/markdownPages";

export async function getMarkdownPageBySlug(
  slug: Array<string>
): Promise<MarkdownPageProps> {
  const md = await import(`markdown/${slug.join("/")}.md`);
  return {
    slug: slug,
    frontmatter: md.attributes,
    content: md.html,
  };
}

export const getStaticPaths: GetStaticPaths = () => ({
  paths: getAllMarkdownSlugs().map((slug) => ({ params: { slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps = async ({ locale, params }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [GLOBAL, AUTH],
      nextI18nextConfig
    )),
    page: await getMarkdownPageBySlug(params!.slug as Array<string>),
  },
});

export default function Markdown({ page }: { page: MarkdownPageProps }) {
  return <MarkdownPage {...page} />;
}

Markdown.getLayout = appGetLayout({
  isPrivate: false,
});
