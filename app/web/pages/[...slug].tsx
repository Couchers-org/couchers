import { GetStaticPaths, GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import { appGetLayout } from "@/components/AppRoute";
import MarkdownPage, {
  MarkdownPageFrontmatter,
  MarkdownPageProps,
} from "@/features/markdown/MarkdownPage";
import { AUTH, GLOBAL, NOTIFICATIONS } from "@/i18n/namespaces";
import nextI18nextConfig from "@/next-i18next.config";
import { getAllMarkdownPathsWithLocales } from "@/utils/markdownPages";

type FrontmatterMarkdownLoaderOutput = {
  attributes: MarkdownPageFrontmatter;
  html: string;
};

const getMarkdownPageBySlug = async (
  slug: Array<string>,
): Promise<MarkdownPageProps> => {
  const md = (await import(
    `@/markdown/${slug.join("/")}.md`
  )) as FrontmatterMarkdownLoaderOutput;

  return {
    slug,
    frontmatter: md.attributes,
    content: md.html,
  };
};

export const getStaticPaths: GetStaticPaths = () => ({
  paths: getAllMarkdownPathsWithLocales(),
  fallback: true,
});

export const getStaticProps: GetStaticProps = async ({ locale, params }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      [GLOBAL, AUTH, NOTIFICATIONS],
      nextI18nextConfig,
    )),
    page: await getMarkdownPageBySlug((params?.slug ?? []) as Array<string>),
  },
});

const Markdown = ({ page }: { page: MarkdownPageProps }) => {
  return <MarkdownPage {...page} />;
};

Markdown.getLayout = appGetLayout({
  isPrivate: false,
});

export default Markdown;
