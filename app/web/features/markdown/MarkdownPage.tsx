import { Breadcrumbs, Container, Link, makeStyles, Typography } from "@material-ui/core";
import HtmlMeta from "components/HtmlMeta";
import markdown from 'markdown-it'

const mkd = new markdown()

export interface MarkdownPageFrontmatter {
  title: string;
  subtitle?: string;
  bustitle?: string;
  crumb?: string;
  description?: string;
  date?: string;
  author?: string;
  share_image?: string;
}

export interface MarkdownPageProps {
  slug: Array<string>;
  frontmatter: MarkdownPageFrontmatter;
  content: string;
}

const useStyles = makeStyles((theme) => ({}));

function CreateBreadcrumbs({slug, frontmatter}: {slug: Array<string>; frontmatter: MarkdownPageFrontmatter}) {
  const crumbs = [{key:"root",value:"Couchers.org",path:"/"}]
  if (slug.length > 2 && slug[0] == "blog") {
    // this is fragile, but basically hides the date from the blog crumbs
    crumbs.push({
      key: "blog",
      value: "Blog",
      path: "/blog/"
    })
    crumbs.push({
      key: slug[-1],
      value: frontmatter.title,
      path: "/" + slug.join("/") + "/"
    })
  } else {
    for (let i = 0; i < slug.length; i++) {
      const item = slug[i]
      crumbs.push({
        key: item,
        value: i == slug.length - 1 ? (frontmatter.crumb ? frontmatter.crumb : frontmatter.title) : item.substring(0, 1).toUpperCase() + item.substring(1, item.length),
        path: (i == 0 ? "/" : crumbs[i-1].path) + item + "/"
      })
    }
  }
  return crumbs
}

export default function MarkdownPage({slug, frontmatter, content}: MarkdownPageProps) {
  const classes = useStyles();

  const subtitle = !!frontmatter.subtitle ? mkd.renderInline(frontmatter.subtitle) : null
  const bustitle = !!frontmatter.bustitle ? mkd.renderInline(frontmatter.bustitle) : null

  const crumbs = CreateBreadcrumbs({slug, frontmatter})

  return (
    <>
      <HtmlMeta title={frontmatter.title} />
      <Container maxWidth="sm">
      <Breadcrumbs aria-label="breadcrumb">
        {crumbs.map(crumb =>
        <Link key={crumb.key} underline="hover" color="inherit" href={crumb.path}>
          {crumb.value}
        </Link>
        )}
      </Breadcrumbs>
        <Typography component="h1">{frontmatter.title}</Typography>
      {subtitle && 
      <div dangerouslySetInnerHTML={{ __html: subtitle }}></div>}
      <div dangerouslySetInnerHTML={{ __html: content }}></div>
      {bustitle && 
      <div dangerouslySetInnerHTML={{ __html: bustitle }}></div>}
      </Container>
    </>
  );
}
