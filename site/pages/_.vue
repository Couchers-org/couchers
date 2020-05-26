<template>
  <div class="container">
    <section class="section">
      <div class="container">
        <nav class="breadcrumb" aria-label="breadcrumbs">
          <ul>
            <li><a href="/">$SiteName</a></li>
            <li v-for="item in breadcrumbs" :key="item.key">
              <a :href="item.path">{{ item.value }}</a>
            </li>
          </ul>
        </nav>
        <h1 class="title is-1">{{ attributes.title }}</h1>
        <div class="content" v-html="html"></div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  async asyncData({params, error}) {
    let filename = params.pathMatch
    if (filename.substring(filename.length - 1) === "/") {
      filename = filename.substring(0, filename.length - 1)
    }
    let md
    try {
      md = await import(`@/markdown/${filename}.md`)
    } catch (err) {
      error({ statusCode: 404, message: 'Page not found' })
    }

    const split_items = filename.split("/")
    console.log(split_items)
    let items = []
    for (let i = 0; i < split_items.length; i++) {
      const item = split_items[i]
      items.push({
        key: item,
        value: i == split_items.length - 1 ? md.attributes.title : item.substring(0, 1).toUpperCase() + item.substring(1, item.length),
        path: (i == 0 ? "" : items[i-1].path) + "/" + item
      })
    }
    console.log(items)
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
    return {
      title: this.attributes.title,
      meta: metas
    }
  }
}
</script>
