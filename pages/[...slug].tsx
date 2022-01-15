import { appGetLayout } from "components/AppRoute";
import NotFoundPage from "features/NotFoundPage";
import { GetStaticPaths, GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { getAllMarkdownSlugs } from "utils/markdownPages";

export async function getPostBySlug(slug: Array<string>) {
  const md = await import(`markdown/${slug.join("/")}.md`);
  return {
    slug: slug,
    frontmatter: md.attributes,
    content: md.html,
  };
}

export const getStaticPaths: GetStaticPaths = () => ({
  paths: getAllMarkdownSlugs().map((slug) => ({ params: { slug } })),
  fallback: "blocking",
});

// console.log(getStaticPaths()["paths"].map(o => o.params))

export const getStaticProps: GetStaticProps = async ({ locale, params }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? "en",
      ["global", "profile"],
      nextI18nextConfig
    )),
    post: await getPostBySlug(params.slug),
  },
});

export default function MarkdownPage({ post }) {
  try {
    return (
      <>
        <div dangerouslySetInnerHTML={{ __html: post.content }}></div>
      </>
    );
  } catch (err) {
    return <NotFoundPage />;
  }
}

MarkdownPage.getLayout = appGetLayout();
