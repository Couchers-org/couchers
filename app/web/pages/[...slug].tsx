import { appGetLayout } from "components/AppRoute";
import MarkdownPage, {
  MarkdownPageProps,
} from "features/markdown/MarkdownPage";
import { AUTH, GLOBAL, NOTIFICATIONS } from "i18n/namespaces";
import { GetStaticPaths, GetStaticProps } from "next";
import nextI18nextConfig from "next-i18next.config";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

async function getMarkdownPageBySlug(
  slug: Array<string>,
): Promise<MarkdownPageProps> {
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

  // Validate slug: only allow alphanumeric, hyphens, and underscores
  // This prevents webpack files, dot files, etc.
  const isValidSlug = slug.every((segment) => /^[a-zA-Z0-9_-]+$/.test(segment));

  if (!isValidSlug) {
    return { notFound: true };
  }

  try {
    return {
      props: {
        ...(await serverSideTranslations(
          locale ?? "en",
          [GLOBAL, AUTH, NOTIFICATIONS],
          nextI18nextConfig,
        )),
        page: await getMarkdownPageBySlug(slug),
      },
    };
  } catch {
    // Markdown file doesn't exist
    return { notFound: true };
  }
};

export default function Markdown({ page }: { page: MarkdownPageProps }) {
  return <MarkdownPage {...page} />;
}

Markdown.getLayout = appGetLayout({
  isPrivate: false,
});
