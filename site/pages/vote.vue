<template>
  <div class="container">
    <section class="hero">
      <div class="hero-body">
        <div class="container">
          <h2 class="title is-2">Couchers.org Logo Vote</h2>
          <p class="subtitle is-4">Voice your feedback and help us build Couchers.org for you</p>
          <p class="content">We need your help to decide the direction of our branding. One of the first things people will see when they interact with Couchers is our logo. Logos grab attention, are memorable, and help communicate our mission. The mission of having a trusted hospitality exchange platform that is diverse, inclusive, collaborative, and adventurous.</p>
          <p class="content">We have not finished our designs, but we want you to tell us which idea we should focus our attention on.</p>
          <p class="content">Three different choices. Cast your vote on the one you feel best represents Couchers and our mission. Thank you for your input!</p>
        </div>
      </div>
    </section>

    <section class="section" v-bind:class="{ 'is-hidden': done || loading }">
      <form id="form" @submit.prevent="submit_form" action="#" method="post">
        <p class="subtitle is-4"><b>To submit, please click "Vote!" at the bottom of the page</b></p>
        <div class="field">
          <label class="label">Which logo concept do you prefer?</label>
          <p class="help is-danger" v-bind:class="{ 'is-hidden': vote_error === null }">{{ vote_error }}</p>
          <hr />
          <div>
            <div class="control">
              <label class="radio">
                <input type="radio" name="vote" value="happy-couch" v-model="vote" /> <b>Vote for "Happy Couch"</b>
                <div class="media-left">
                  <figure class="image is-128x128">
                    <img src="/logo-vote/happy-couch.png" alt="Happy Couch logo">
                  </figure>
                  <a href="/logo-vote/happy-couch-presentation.png" target="_blank"><img src="/logo-vote/happy-couch-presentation.png" alt="Happy Couch presentation"></a>
                </div>
              </label>
              <p class="content has-text-grey is-italic">Click on the presentation to enlarge. Click on the logo or text to select this design for your vote.</p>
            </div>
            <hr />
            <div class="control">
              <label class="radio">
                <input type="radio" name="vote" value="welcoming-hand" v-model="vote" /> <b>Vote for "Welcoming Hand"</b>
                <div class="media-left">
                  <figure class="image is-128x128">
                    <img src="/logo-vote/welcoming-hand.png" alt="Welcoming Hand logo">
                  </figure>
                  <a href="/logo-vote/welcoming-hand-presentation.png" target="_blank"><img src="/logo-vote/welcoming-hand-presentation.png" alt="Welcoming Hand presentation"></a>
                </div>
              </label>
              <p class="content has-text-grey is-italic">Click on the presentation to enlarge. Click on the logo or text to select this design for your vote.</p>
            </div>
            <hr />
            <div class="control">
              <label class="radio">
                <input type="radio" name="vote" value="smiling-couch" v-model="vote" /> <b>Vote for "Couch with Pins"</b>
                <div class="media-left">
                  <figure class="image is-128x128">
                    <img src="/logo-vote/smiling-couch.png" alt="Couch with Pins logo">
                  </figure>
                  <a href="/logo-vote/smiling-couch-presentation.png" target="_blank"><img src="/logo-vote/smiling-couch-presentation.png" alt="Couch withe Pins presentation"></a>
                </div>
              </label>
              <p class="content has-text-grey is-italic">Click on the presentation to enlarge. Click on the logo or text to select this design for your vote.</p>
            </div>
            <hr />
            <div class="control">
              <label class="radio">
                <input type="radio" name="vote" value="none-of-the-above" v-model="vote" /> <b>None of the above.</b>
              </label>
            </div>
          </div>
        </div>
        <hr />
        <div class="field">
          <label class="label" for="email">Your email address</label>
          <div class="control">
            <input class="input" v-bind:class="{ 'is-danger': email_error !== null }" name="email" id="email" type="email" v-model="email" placeholder="Email address">
          </div>
          <p class="help is-danger" v-bind:class="{ 'is-hidden': email_error === null }">{{ email_error }}</p>
          <p class="content has-text-grey is-italic">If you are not yet subscribed to our email updates, we will add you to the mailing list.</p>
        </div>
        <hr />
        <div class="field">
          <label class="label">Comment on the proposals</label>
          <div class="control">
            <textarea class="textarea" placeholder="" v-model="comment"></textarea>
          </div>
        </div>
        <div class="control content">
          <button class="button is-primary">Vote!</button>
        </div>
      </form>
    </section>

    <section class="section" v-bind:class="{ 'is-hidden': !done || loading }">
      <h3 class="title is-3">Thanks for voting!</h3>
      <p class="subtitle is-5">We appreciate you taking the time to help us build Couchers.org.</p>
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

      comment: ""
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
          vote: this.vote,
          comment: this.comment,
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
