import { appGetLayout } from "components/AppRoute";
import NotFoundPage from "features/NotFoundPage";
import { GetStaticPaths, GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { getAllMarkdownSlugs } from "utils/markdownPages";

interface MarkdownPageProps {
  slug: Array<string>;
  frontmatter: unknown;
  content: string;
}

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
      ["global", "profile"],
      nextI18nextConfig
    )),
    page: await getMarkdownPageBySlug(params!.slug as Array<string>),
  },
});

export default function MarkdownPage({ page }: { page: MarkdownPageProps }) {
  try {
    return (
      <>
        <div dangerouslySetInnerHTML={{ __html: page.content }}></div>
      </>
    );
  } catch (err) {
    return <NotFoundPage />;
  }
}

MarkdownPage.getLayout = appGetLayout();
