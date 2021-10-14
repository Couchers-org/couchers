<template>
  <div class="container">
    <section class="section">
      <nav class="breadcrumb" aria-label="breadcrumbs">
        <ul>
          <li><a href="/">Couchers.org</a></li>
          <li v-for="item in breadcrumbs" :key="item.key">
            <a :href="item.path">{{ item.value }}</a>
          </li>
        </ul>
      </nav>
      <h1 class="title is-2">{{ attributes.title }}</h1>
      <p v-if="attributes.subtitle" class="subtitle is-3" v-html="attributes.subtitle" />
      <div class="content" v-html="html"></div>
      <p v-if="attributes.bustitle" class="subtitle is-4" v-html="attributes.bustitle" />
    </section>
    <section class="section">
      <h2 class="title is-4">Have some thoughts on how we could make this even better?</h2>
      <p class="subtitle is-6">Couchers.org is a community project, built by folks like you for the benefit of the global couch surfing community. If you would like to be a part of this great new project and discuss any ideas, click the button below to head to our Community Forum.</p>
      <p><a class="button is-primary" href="https://community.couchers.org/">Tell us what you think!</a></p>
    </section>
  </div>
</template>

<script>
import markdown from 'markdown-it'

const mkd = new markdown()

export default {
  async asyncData({params, error}) {
    let filename = params.pathMatch
    if (filename.substring(filename.length - 1) === "/") {
      filename = filename.substring(0, filename.length - 1)
    }
    let md, split_items
    try {
      md = await import(`@/markdown/${filename}.md`)
      split_items = filename.split("/")
    } catch (err) {
      md = await import(`@/markdown/error.md`)
      split_items = ["error"]
    }

    let items = []
    if (split_items.length > 2 && split_items[0] == "blog") {
      // this is fragile, but basically hides the date from the blog crumbs
      items.push({
        key: "blog",
        value: "Blog",
        path: "/blog/"
      })
      items.push({
        key: split_items[-1],
        value: md.attributes.title,
        path: "/" + split_items.join("/") + "/"
      })
    } else {
      for (let i = 0; i < split_items.length; i++) {
        const item = split_items[i]
        items.push({
          key: item,
          value: i == split_items.length - 1 ? (md.attributes.crumb ? md.attributes.crumb : md.attributes.title) : item.substring(0, 1).toUpperCase() + item.substring(1, item.length),
          path: (i == 0 ? "/" : items[i-1].path) + item + "/"
        })
      }
    }
    if (md.attributes.subtitle) {
      md.attributes.subtitle = mkd.renderInline(md.attributes.subtitle)
    }
    if (md.attributes.bustitle) {
      md.attributes.bustitle = mkd.renderInline(md.attributes.bustitle)
    }
    return {...md, breadcrumbs: items }
  },
  head () {
    let metas = [
      { hid: 'og:title', name: 'og:title', content: this.attributes.title },
      { hid: 'twitter:title', name: 'twitter:title', content: this.attributes.title },
    ]
    if (this.attributes.description) {
      metas.push(
        { hid: 'description', name: 'description', content: this.attributes.description },
        { hid: 'og:description', property: 'og:description', content: this.attributes.description },
        { hid: 'twitter:description', name: 'twitter:description', content: this.attributes.description }
      )
    }
    if (this.attributes.share_image) {
      metas.push(
        { hid: 'og:image', property: 'og:image', content: this.attributes.share_image },
        { hid: 'twitter:image', name: 'twitter:image', content: this.attributes.share_image },
      )
    }
    return {
      title: this.attributes.title,
      meta: metas
    }
  }
}
</script>
