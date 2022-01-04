<template>
  <div>
    <section class="hero">
      <div class="hero-body">
        <div class="container">
          <div class="box">
            <h2 class="title is-3">The new alternative to Couchsurfing&#8482;</h2>
            <p class="subtitle is-4">Free&nbsp;forever. Community&#8209;led. Non&#8209;profit. Modern.</p>
            <p class="content">Join 8k+ couch surfers on the fastest growing couch surfing platform.</p>
            <form id="form" @submit.prevent="submit_form" action="#" method="post" v-bind:class="{ 'is-hidden': !!url }">
              <div class="field">
                <label class="label" for="name">Your name</label>
                <div class="control">
                  <input class="input" v-bind:class="{ 'is-danger': name_error !== null }" name="name" id="name" type="name" v-model="name" placeholder="Display name">
                </div>
                <p class="help is-danger" v-bind:class="{ 'is-hidden': name_error === null }">{{ name_error }}</p>
              </div>
              <div class="field">
                <label class="label" for="email">Your email address</label>
                <div class="control">
                  <input class="input" v-bind:class="{ 'is-danger': email_error !== null }" name="email" id="email" type="email" v-model="email" placeholder="Email address">
                </div>
                <p class="help is-danger" v-bind:class="{ 'is-hidden': email_error === null }">{{ email_error }}</p>
              </div>
              <p class="help is-danger content" v-bind:class="{ 'is-hidden': submit_error === null }">{{ submit_error }}</p>
              <div class="control">
                <button class="button couchers-button is-primary" v-bind:class="{ 'is-loading': loading === true }">Create an account</button>
              </div>
              <p class="content has-text-grey is-small">By continuing, you agree to our <a href="https://app.couchers.org/terms">Terms of Service</a>, including our cookie, email, and data handling policies.</p>
              <p class="content">Already have an account? <a href="https://app.couchers.org/login">Click here to log in</a>.</p>
            </form>
            <div v-bind:class="{ 'is-hidden': !url }">
              <p class="content">You're being redirected to the platform to complete signing up. If you are not automatically redirected within 5 seconds, please <a :href="url">click here</a>.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section class="section no-padding-on-mobile">
      <div class="container">
        <div class="box">
          <h2 class="title is-3">Like Couchsurfing&#8482;, but better</h2>
          <p class="content">Couchers.org is a <strong>non-profit and free</strong> platform, <strong>built by volunteers</strong> and responsible to the couch surfing community, instead of investors. Formed after Couchsurfing&#8482; put up its paywall in 2020, our goal is to <strong>reclaim couch surfing</strong> by creating a <strong>complete alternative</strong>, with all your <strong>favourite features</strong>.</p>
          <p class="content">Couchers.org is the <strong>fastest growing</strong> couch surfing platform. We have built the <strong>largest active volunteer base </strong> with over 40 skilled contributors. Our product teams are designing and developing the platform at blazing speed, releasing <strong>new features every two weeks</strong>; our community teams are planning out and executing user base growth and engagement strategies to reach a <strong>critical mass of quality couch surfers</strong> with active local communities and a vibrant global discussion.</p>
          <div class="buttons content">
            <a class="button is-primary" href="/team/">Meet the team</a>
            <a class="button is-primary is-outlined" href="/volunteer/">Volunteer</a>
          </div>
        </div>
      </div>
    </section>
    <div class="container">
      <section class="section">
        <h2 class="title is-3">Our plan: fix the problems with Couchsurfing&#8482;</h2>
        <p class="content">We're sure that you, like all of us, have had great experiences that couldn't have happened without Couchsurfing&#8482;. But we all know it's got its issues. For the next generation in couch surfing apps, we need to fix those issues.</p>
        <p class="content">If there's any problems you've found with Couchsurfing&#8482; or any other platforms, we'd love to hear about it so we can try to fix them.</p>
        <div class="buttons content">
          <a class="button is-primary" href="https://community.couchers.org/">Tell us what you think</a>
        </div>
      </section>
    </div>
    <div class="container">
      <section class="section">
        <h2 class="title is-3">The problems with Couchsurfing&#8482;</h2>
      </section>
    </div>
    <div class="wide-container">
      <section class="section">
        <div class="tile is-ancestor">
          <div class="tile is-vertical">
            <div class="tile">
              <div class="tile is-parent">
                <article class="tile is-child notification is-success c-tile">
                  <p class="subtitle">Issue:</p>
                  <h3 class="title is-3">Governance</h3>
                  <h5 class="title is-5 box-subtitle"><a href="/issues/profit-and-incentives/">Profit incentives</a></h5>
                  <p class="content">Couchsurfing&#8482; is explicitly for-profit, prioritizing returns for investors over users and communities.</p>
                  <h5 class="title is-5 box-subtitle"><a href="/issues/communities-and-trust/">Neglected communities</a></h5>
                  <p class="content">The community has been ignored, too many users have been pushed onto the platform, trust between members has been eroded.</p>
                </article>
              </div>
              <div class="tile is-parent">
                <article class="tile is-child notification is-warning c-tile">
                  <p class="subtitle">Issue:</p>
                  <h3 class="title is-3">Design</h3>
                  <h5 class="title is-5 box-subtitle"><a href="/issues/creeps-and-freeloaders/">Safety</a></h5>
                  <p class="content">Detrimental users threaten users' safety, especially for women. Freeloaders abound.</p>
                  <h5 class="title is-5 box-subtitle"><a href="/issues/reviews/">Reference system</a></h5>
                  <p class="content">You can't trust people based on references.</p>
                  <h5 class="title is-5 box-subtitle"><a href="/issues/host-matching/">Super-host effect</a></h5>
                  <p class="content">Local communities have been shrinking to just small groups of super-hosts.</p>
                </article>
              </div>
              <div class="tile is-parent">
                <article class="tile is-child notification is-danger c-tile">
                  <p class="subtitle">Issue:</p>
                  <h3 class="title is-3">Technology</h3>
                  <h5 class="title is-5 box-subtitle"><a href="/issues/the-build/">The bugs and app issues</a></h5>
                  <p class="content">There are far too many bugs and problems with the Couchsurfing&#8482; platform. It wasn't good enough as a free service, and it's definitely not good enough now that it's paid.</p>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
    <div class="container">
      <section class="section">
        <h2 class="title is-3">Our plan for the next-generation couch surfing platform</h2>
      </section>
    </div>
    <div class="wide-container">
      <section class="section">
        <div class="tile is-ancestor">
          <div class="tile is-vertical">
            <div class="tile">
              <div class="tile is-parent">
                <article class="tile is-child notification is-success c-tile">
                  <p class="subtitle">Our plan:</p>
                  <h3 class="title is-3">Governance</h3>
                  <h4 class="title is-5 box-subtitle"><a href="/plan/profit-and-incentives/">Non-profit structure</a></h4>
                  <p class="content">This platform will be run as a non-profit, taking no outside investment. The priorities will be the users and community.</p>
                  <h4 class="title is-5 box-subtitle"><a href="/plan/communities-and-trust/">Community-first framework</a></h4>
                  <p class="content">We will build communities into the foundations of the product, and improve trust through a new verification method.</p>
                </article>
              </div>
              <div class="tile is-parent">
                <article class="tile is-child notification is-warning c-tile">
                  <p class="subtitle">Our plan:</p>
                  <h3 class="title is-3">Design</h3>
                  <h4 class="title is-5 box-subtitle"><a href="/plan/creeps-and-freeloaders/">Member accountability</a></h4>
                  <p class="content">Users will be accountable for how they treat other members, filtering out creeps and freeloaders.</p>
                  <h4 class="title is-5 box-subtitle"><a href="/plan/reviews/">Improved review system</a></h4>
                  <p class="content">Overhauled references to reflect more accurately on users.</p>
                  <h4 class="title is-5 box-subtitle"><a href="/plan/host-matching/">Better host finding</a></h4>
                  <p class="content">Healthier communities by spreading out hosting opportunities and no message limits.</p>
                </article>
              </div>
              <div class="tile is-parent">
                <article class="tile is-child notification is-danger c-tile">
                  <p class="subtitle">Our plan:</p>
                  <h3 class="title is-3">Technology</h3>
                  <h4 class="title is-5 box-subtitle"><a href="/plan/the-build/">Build it right</a></h4>
                  <p class="content">Our platform is developer-led. We will build this right, make it scalable, and listen to the community to fix bugs. We want to make something to be proud of.</p>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
const API_BASE = "https://api.couchers.org"
const APP_BASE = "https://app.couchers.org"
const UNKNOWN_ERROR = "An unknown error occured, please try to sign up on https://app.couchers.org instead."

export default {
  data () {
    return {
      error: false,
      loading: false,

      name: this.$route.query.name || "",
      name_error: null,

      email: this.$route.query.email || "",
      email_error: null,

      submit_error: null,

      url: null,
    }
  },
  methods: {
    valid_email: function (email) {
      var re = /^[0-9a-z][0-9a-z\-_+.]*@([0-9a-z-]+\.)*[0-9a-z-]+\.[a-z]{2,}$/i;
      return re.test(email)
    },
    check_form: function () {
      this.name_error = null
      this.email_error = null
      this.submit_error = null

      let has_errors = false;

      if (!this.name) {
        this.name_error = 'Name required.'
        has_errors = true
      }

      if (!this.email) {
        this.email_error = 'Email required.'
        has_errors = true
      } else if (!this.valid_email(this.email)) {
        this.email_error = 'Valid email required.'
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
          API_BASE + '/auth/signup',
          {"basic": data},
          { cancelToken: source.token }
        ).then(res => {
          this.error = false
          console.log(res)
          if (res.flowToken) {
            const token = res.flowToken
            console.log("flowToken", token)
            this.url = APP_BASE + "/signup/" + token
            window.location.replace(this.url);
          } else {
            this.error = true
            this.submit_error = UNKNOWN_ERROR
          }
          this.loading = false
        }).catch(error => {
          this.error = true
          console.error(error)
          if (error.response && error.response.data && error.response.data.message) {
            this.submit_error = error.response.data.message
          } else {
            this.submit_error = UNKNOWN_ERROR
          }
          this.loading = false
        })
    },
    submit_form: function () {
      if (this.check_form()) {
        this.submit({
          name: this.name,
          email: this.email,
        })
      }
    }
  },
}
</script>

<style>
.hero {
  background: no-repeat url("/img/hero.jpg");
  background-size: cover;

  padding-top: 10vh;
  padding-bottom: 10vh;
  min-height: 50vh;
}

.top-buttons {
  margin-top: 3rem !important;
  margin-bottom: 0px !important;
}

.box {
  padding: 2em;
}

.couchers-box {
  display: inline-block;
}

.coucherslogo {
  display: inline-block;
  width: 4.7rem;
  height: 4.7rem;
  vertical-align: middle;
}

.couchersorg {
  font-family: 'Mansalva', sans-serif;
  font-weight: 400 !important;
  font-size: 3rem;
  margin-inline-start: 1.5;
  color: #e47701;
  vertical-align: middle;
  white-space: nowrap;
}

.box-subtitle {
  margin-bottom: 0.5rem !important;
}

.c-tile {
  padding-bottom: 2.5rem;
}
</style>
