<template>
  <div class="container">
    <section class="hero">
      <div class="hero-body">
        <div class="container">
          <h2 class="title is-2">Couchers.org Voting</h2>
          <p class="subtitle is-4">Voice your feedback and help us as we build Couchers.org for you</p>
          <p class="content">Some text</p>
        </div>
      </div>
    </section>

    <section class="section" v-bind:class="{ 'is-hidden': done || loading }">
      <form id="form" @submit.prevent="submit_form" action="#" method="post">
        <div class="field">
          <label class="label" for="email">Your email address</label>
          <div class="control">
            <input class="input" v-bind:class="{ 'is-danger': email_error !== null }" name="email" id="email" type="email" v-model="email" placeholder="Email address">
          </div>
          <p class="help is-danger" v-bind:class="{ 'is-hidden': email_error === null }">{{ email_error }}</p>
          <p class="content has-text-grey is-italic">If you are not yet subscribed to our email updates, we will add you to the mailing list.</p>
        </div>
        <div class="field">
          <label class="label">Which logo do you prefer?</label>
          <p class="help is-danger" v-bind:class="{ 'is-hidden': vote_error === null }">{{ vote_error }}</p>
          <div class="columns">
            <div class="control column">
              <label class="radio">
                <input type="radio" name="vote" value="option1" v-model="vote" />
                <div class="media-left">
                  <figure class="image is-128x128">
                    <img src="/img/head-itsi.jpg" alt="Option 1">
                  </figure>
                </div>
              </label>
            </div>
            <div class="control column">
              <label class="radio">
                <input type="radio" name="vote" value="option2" v-model="vote" />
                <div class="media-left">
                  <figure class="image is-128x128">
                    <img src="/img/head-jesse.jpg" alt="Option 2">
                  </figure>
                </div>
              </label>
            </div>
            <div class="control column">
              <label class="radio">
                <input type="radio" name="vote" value="option3" v-model="vote" />
                <div class="media-left">
                  <figure class="image is-128x128">
                    <img src="/img/head-emily.jpg" alt="Option 3">
                  </figure>
                </div>
              </label>
            </div>
          </div>
        </div>
        <div class="control content">
          <button class="button is-primary">Vote!</button>
        </div>
      </form>
    </section>

    <section class="section" v-bind:class="{ 'is-hidden': !done || loading }">
      <h3 class="title is-3">Thank you!</h3>
      <p class="subtitle is-5">We appreciate you taking the time to help us build Couchers.org</p>
    </section>

    <section v-bind:class="{ 'is-hidden': !loading || error }">
      <div class="content progress-container">
        <progress class="progress is-primary" max="100">Loading...</progress>
      </div>
    </section>

    <section class="section" v-bind:class="{ 'is-hidden': !error }">
      <h3 class="title is-3">Error!</h3>
      <p class="subtitle is-5">Sorry, there was an error. We would really appreciate it if you emailed us at contact@ and let us know what you did, so we could fix it as soon as possible! Thanks</p>
    </section>
  </div>
</template>

<script>
export default {
  data () {
    return {
      error: false,
      loading: false,

      done: false,

      email: this.$route.query.email || "",
      email_error: null,

      vote: null,
      vote_error: null,
    }
  },
  methods: {
    valid_email: function (email) {
      var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(email);
    },
    check_form: function () {
      this.email_error = null;

      let has_errors = false;

      if (!this.email) {
        this.email_error = 'Email required.'
        has_errors = true
      } else if (!this.valid_email(this.email)) {
        this.email_error = 'Valid email required.'
        has_errors = true
      }

      if (!this.vote) {
        this.vote_error = 'You need to vote!'
        has_errors = true
      }

      return !has_errors
    },
    submit: async function (data) {
        this.loading = true

        const source = this.$axios.CancelToken.source()

        setTimeout(() => {
          source.cancel('Timeout')
        }, 12000)

        const res = await this.$axios.$post(
          'https://ja4o9uz9u3.execute-api.us-east-1.amazonaws.com/vote_form_handler',
          data,
          { cancelToken: source.token }
        ).then(res => {
          this.loading = false
        }).catch(error => {
          this.error = true
          this.loading = true
        })

    },
    submit_form: function () {
      if (this.check_form()) {
        this.done = true
        this.submit({
          email: this.email,
          vote: this.vote
        })
      }
    }
  },
  head () {
    return {
      title: 'Logo vote',
      meta: [
        { hid: 'og:title', name: 'og:title', content: 'Logo vote' },
        { hid: 'twitter:title', name: 'twitter:title', content: 'Logo vote' },
      ]
    }
  }
}
</script>

<style>
.input, .textarea {
  max-width: 400px;
}

.progress-container {
  padding: 10vh 10vw;
}
</style>
