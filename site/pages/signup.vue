<template>
  <div class="container">
    <section class="hero">
      <div class="hero-body">
        <div class="container">
          <h2 class="title is-2">Sign up for Couchers.org</h2>
          <p class="content">We are a group of hosts and surfers who are also a mix of software engineers, data scientists, mathematicians and experienced community members and leaders. We've all gotten a lot of joy out of couch surfing and would like to make that experience even better.</p>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <iframe id='iframe' src='https://forms.couchers.org/view/#!/forms/5ecd9fb9578259033939aac3' style='width:100%;height:600px;'></iframe><div style='font-family: Sans-Serif;font-size: 12px;color: #999;opacity: 0.5; padding-top: 5px;'>Powered by<a href='https://www.ohmyform.com' style='color: #999' target='_blank'>OhMyForm</a></div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  head () {
    return {
      title: 'Sign up',
      meta: [
        { hid: 'og:title', name: 'og:title', content: 'Sign up' },
        { hid: 'twitter:title', name: 'twitter:title', content: 'Sign up' },
      ]
    }
  }
}
</script>