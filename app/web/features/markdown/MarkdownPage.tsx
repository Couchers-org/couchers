import {
  Breadcrumbs,
  Container,
  Link,
  styled,
  Typography,
  TypographyProps,
} from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import { Trans, useTranslation } from "i18n";
import markdown from "markdown-it";
import Head from "next/head";
import { theme } from "theme";
import { COMMUNITIES } from "../../i18n/namespaces";

const mkd = new markdown();

interface MarkdownPageFrontmatter {
  title: string;
  hide_title?: boolean;
  subtitle?: string;
  bustitle?: string;
  crumb?: string;
  description?: string;
  date?: string;
  author?: string;
  author_username?: string;
  is_blog_post?: boolean;
  has_custom_cta?: boolean;
  share_image?: string;
}

export interface MarkdownPageProps {
  slug: Array<string>;
  frontmatter: MarkdownPageFrontmatter;
  content: string;
}

const StyledBreadcrumbs = styled(Breadcrumbs)(({ theme }) => ({
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(3),

  "& a": {
    color: theme.palette.primary.main,
  },
}));

const StyledBusTitle = styled(Typography)<TypographyProps>(({ theme }) => ({
  marginTop: theme.spacing(3),
  "& > *": {
    fontSize: "1.5rem",
    fontWeight: "bold",
  },
  "& a": {
    color: theme.palette.primary.main,
  },
}));

const StyledMarkdown = styled("div")(({ theme }) => ({
  fontSize: theme.typography.fontSize,
  fontFamily: theme.typography.fontFamily,
  "& h1, & h2, & h3, & h4, & h5, & h6, & p": {
    borderBottom: "none",
    paddingBottom: 0,
    marginBottom: 0,
    marginTop: theme.spacing(2),
    overflowWrap: "break-word",
    whiteSpace: "pre-wrap",
  },
  "& h1": { ...theme.typography.h1, fontSize: "2.5rem", lineHeight: "1.125" },
  "& h2": { ...theme.typography.h2, fontSize: "1.75em !important" },
  "& h3": { ...theme.typography.h3, fontSize: "1.5em !important" },
  "& h4": theme.typography.h4,
  "& h5": theme.typography.h5,
  "& h6": theme.typography.h6,
  "& p": theme.typography.body1,
  "& ol": theme.typography.body1,
  "& ul": theme.typography.body1,
  "& blockquote": theme.typography.body1,
  "& a": {
    color: theme.palette.primary.main,
  },
  "& img": {
    width: "100%",
    maxWidth: "400px",
    height: "auto",
  },
  "& .tag": {
    color: "#fff",
    borderRadius: "4px",
    display: "inline-block",
    fontSize: "0.75rem",
    padding: "0.3rem 0.75rem",
  },
  "& .tag-large": {
    fontSize: "1.25rem",
  },
  "& .tag-governance": {
    backgroundColor: "#82bb42",
  },
  "& .tag-design": {
    backgroundColor: "#3da4ab",
  },
  "& .tag-tech": {
    backgroundColor: "#f46d50",
  },

  // Roadmap: fix peach backgrounds for dark mode readability
  // Row labels and cells with solid peach background
  '[data-mui-color-scheme="dark"] & td[style*="background-color: #FDE9D4"]': {
    backgroundColor: "#3d4347 !important",
  },
  // Header row with peach background - target the row and its children
  '[data-mui-color-scheme="dark"] & tr[style*="FDE9D4"]': {
    backgroundColor: "#3d4347 !important",
  },
  '[data-mui-color-scheme="dark"] & tr[style*="FDE9D4"] th': {
    backgroundColor: "inherit !important",
  },
  // Pending items with peach gradient
  '[data-mui-color-scheme="dark"] & td[style*="linear-gradient(to right, #FDE9D4"]':
    {
      background:
        "linear-gradient(to right, rgba(254, 152, 42, 0.3), transparent) !important",
    },
  // Completed items with green gradient - fade to dark background instead of white
  '[data-mui-color-scheme="dark"] & td[style*="linear-gradient(to right, #20686C"]':
    {
      background:
        "linear-gradient(to right, #20686C, #00A398, #313539) !important",
    },
  // Partially completed checkmark - make it white in dark mode
  '[data-mui-color-scheme="dark"] & .partial-check': {
    filter: "grayscale(1) brightness(10)",
  },

  // Blog index entry styling
  "& .blog-entry": {
    marginTop: theme.spacing(4),
  },
  "& .blog-entry h2": {
    marginBottom: 0,
  },
  "& .blog-entry-date": {
    marginTop: theme.spacing(0.5),
    fontStyle: "italic",
  },
}));

const StyledTitle = styled(Typography)(({ theme }) => ({
  fontSize: "2.5rem",
  lineHeight: "1.125",
}));

function AuthorList({
  author,
  authorUsername,
}: {
  author: string;
  authorUsername?: string;
}) {
  const authors = author.split(",").map((a) => a.trim());
  const usernames = authorUsername
    ? authorUsername.split(",").map((u) => u.trim())
    : [];
  return (
    <>
      {authors.map((name, i) => (
        <span key={name}>
          {i > 0 && i === authors.length - 1 ? " and " : i > 0 ? ", " : ""}
          {usernames[i] ? (
            <Link href={`/user/${usernames[i]}`}>{name}</Link>
          ) : (
            name
          )}
        </span>
      ))}
    </>
  );
}

function createBreadcrumbs({
  slug,
  frontmatter,
}: {
  slug: Array<string>;
  frontmatter: MarkdownPageFrontmatter;
}) {
  const crumbs = [{ key: "root", value: "Couchers.org", path: "/" }];
  if (slug.length > 2 && slug[0] == "blog") {
    // this is fragile, but basically hides the date from the blog crumbs
    crumbs.push({
      key: "blog",
      value: "Blog",
      path: "/blog/",
    });
    crumbs.push({
      key: slug[-1],
      value: frontmatter.title,
      path: "/" + slug.join("/") + "/",
    });
  } else {
    for (let i = 0; i < slug.length; i++) {
      const item = slug[i];
      crumbs.push({
        key: item,
        value:
          i == slug.length - 1
            ? frontmatter.crumb
              ? frontmatter.crumb
              : frontmatter.title
            : item.substring(0, 1).toUpperCase() +
              item.substring(1, item.length),
        path: (i == 0 ? "/" : crumbs[i - 1].path) + item + "/",
      });
    }
  }
  return crumbs;
}

export default function MarkdownPage({
  slug,
  frontmatter,
  content,
}: MarkdownPageProps) {
  const { t } = useTranslation();
  const subtitle = !!frontmatter.subtitle
    ? mkd.renderInline(frontmatter.subtitle)
    : null;
  const bustitle = !!frontmatter.bustitle
    ? mkd.renderInline(frontmatter.bustitle)
    : null;

  const crumbs = createBreadcrumbs({ slug, frontmatter });
  const { tAriaLabel } = useTranslation(COMMUNITIES);

  return (
    <>
      <HtmlMeta
        title={frontmatter.title}
        description={frontmatter.description}
        shareImage={frontmatter.share_image}
      />
      {slug.length === 1 && slug[0] === "blog" && (
        <Head>
          <link
            rel="alternate"
            type="application/rss+xml"
            title="Couchers.org Blog"
            href="/blog/rss.xml"
          />
        </Head>
      )}
      <Container
        disableGutters
        maxWidth="md"
        sx={{ marginTop: theme.spacing(3) }}
      >
        <StyledBreadcrumbs
          aria-label={tAriaLabel("communities:breadcrumb")}
        >
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return isLast ? (
              <Typography key={`${crumb.key}-${index}`} color="textPrimary">
                {crumb.value}
              </Typography>
            ) : (
              <Link
                key={crumb.key}
                underline="hover"
                color="inherit"
                href={crumb.path}
              >
                {crumb.value}
              </Link>
            );
          })}
        </StyledBreadcrumbs>
        {!frontmatter.hide_title && (
          <StyledTitle>{frontmatter.title}</StyledTitle>
        )}
        {subtitle && (
          <Typography component="h2">
            <div dangerouslySetInnerHTML={{ __html: subtitle }}></div>
          </Typography>
        )}
        <StyledMarkdown
          dangerouslySetInnerHTML={{ __html: content }}
        ></StyledMarkdown>
        {frontmatter.is_blog_post && frontmatter.date && (
          <Typography
            variant="body1"
            sx={{ fontStyle: "italic", marginTop: theme.spacing(2) }}
          >
            {frontmatter.author ? (
              <Trans
                i18nKey="blog.byline_with_author"
                values={{ date: frontmatter.date }}
              >
                {"Written by "}
                <AuthorList
                  author={frontmatter.author}
                  authorUsername={frontmatter.author_username}
                />
                {". Published on {{date}}."}
              </Trans>
            ) : (
              t("blog.byline_without_author", { date: frontmatter.date })
            )}
          </Typography>
        )}
        {frontmatter.is_blog_post && !frontmatter.has_custom_cta && (
          <Typography
            variant="body1"
            sx={{ fontWeight: "bold", marginTop: theme.spacing(3) }}
          >
            <Trans i18nKey="blog.cta_message">
              {"Want to help write our blog or volunteer? "}
              <Link href="/volunteer">Sign up</Link>
              {" and let us know. Volunteers and "}
              <Link href="/donate">donations</Link>
              {" are what make Couchers.org possible!"}
            </Trans>
          </Typography>
        )}
        {frontmatter.is_blog_post && (
          <Typography
            variant="body1"
            sx={{ marginTop: theme.spacing(3), display: "flex", gap: 1 }}
          >
            <Link
              href="https://www.instagram.com/couchersorg/"
              target="_blank"
              rel="noopener"
            >
              <img
                src="/img/blog/instagram_logo.svg"
                alt="Instagram"
                style={{ width: 26 }}
              />
            </Link>
            <Link
              href="https://bsky.app/profile/couchers.bsky.social"
              target="_blank"
              rel="noopener"
            >
              <img
                src="/img/blog/bluesky_logo.svg"
                alt="Bluesky"
                style={{ width: 26 }}
              />
            </Link>
          </Typography>
        )}
        {bustitle && (
          <StyledBusTitle component="h2">
            <div dangerouslySetInnerHTML={{ __html: bustitle }}></div>
          </StyledBusTitle>
        )}
      </Container>
    </>
  );
}
