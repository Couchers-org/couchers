<template>
  <div class="container">
    <section class="hero">
      <div class="hero-body">
        <div class="container">
          <h2 class="title is-2">Sign up for Couchers.org</h2>
          <p class="subtitle is-4">Join the worldwide team of couch-surfers bringing this community-run platform to life</p>
          <p class="content">Fill in the forms below to tell us your experience, ideas, and expertise. We'll keep you in the loop as we make progress on this exciting project!</p>
        </div>
      </div>
    </section>

    <section class="section" v-bind:class="{ 'is-hidden': first_page_done || loading }">
      <h3 class="title is-3">Your details</h3>
      <p class="subtitle is-5">The basics about you</p>
      <form id="form1" @submit.prevent="submit_form1" action="#" method="post">
        <div class="field">
          <label class="label" for="name">Name</label>
          <div class="control">
            <input class="input" v-bind:class="{ 'is-danger': name_error !== null }" name="name" id="name" type="text" v-model="name" placeholder="Your name">
          </div>
          <p class="help is-danger" v-bind:class="{ 'is-hidden': name_error === null }">{{ name_error }}</p>
        </div>
        <div class="field">
          <label class="label" for="email">Email</label>
          <div class="control">
            <input class="input" v-bind:class="{ 'is-danger': email_error !== null }" name="email" id="email" type="email" v-model="email" placeholder="Email address">
          </div>
          <p class="help is-danger" v-bind:class="{ 'is-hidden': email_error === null }">{{ email_error }}</p>
        </div>
        <div class="field">
          <label class="label">Would you like to help in creating Couchers.org?</label>
          <div class="control">
            <label class="radio">
              <input type="radio" name="contribute" value="yes" v-model="contribute" checked>
              Yes, I'd like to contribute
            </label>
          </div>
          <div class="control">
            <label>
              <input type="radio" name="contribute" value="no" v-model="contribute">
              No, but please keep me updated on the progress
            </label>
          </div>
        </div>
        <div class="control content">
          <button class="button is-primary">Next</button>
        </div>
        <p class="content has-text-grey is-italic">Your basic details will be submitted when you press Next</p>
      </form>
    </section>

    <section class="section" v-bind:class="{ 'is-hidden': (!first_page_done || second_page_done) || loading }">
      <h3 class="title is-3">A bit more about you</h3>
      <p class="subtitle is-5">Feel free to fill out the form below and tell us a bit more about yourself and what you think we should concentrate on</p>
      <form id="form2" @submit.prevent="submit_form2" action="#" method="post">
        <p class="content has-text-grey is-italic">All questions are optional.</p>
        <div class="field">
          <label class="label">Please share any ideas you have that would improve the couch-surfing experience for you and for the community.</label>
          <div class="control">
            <textarea class="textarea" placeholder="" v-model="ideas"></textarea>
          </div>
          <p class="help">Feel free to describe any problems you've had or experienced with other platforms, and what you'd like to see done about them.</p>
        </div>
        <div class="field">
          <label class="label">What feature would you like implemented first, and why? How could we make that feature as good as possible for your particular use?</label>
          <div class="control">
            <textarea class="textarea" placeholder="" v-model="features"></textarea>
          </div>
          <p class="help">Do you care about hosting or surfing? Events or hangouts? Wish there was a better messaging system? Do you like mobile apps or prefer to use a computer?</p>
        </div>
        <div class="field">
          <label class="label">Age</label>
          <div class="control">
            <input class="input" type="number" placeholder="Your age" v-model="age">
          </div>
        </div>
        <div class="field">
          <label class="label">Gender</label>
          <div class="control">
            <div class="select">
              <select v-model="gender">
                <option>Prefer not to say</option>
                <option>Male</option>
                <option>Female</option>
                <option>Genderqueer/Nonbinary</option>
                <option>Gender not listed here</option>
              </select>
            </div>
          </div>
        </div>
        <div class="field">
          <label class="label">Country and city</label>
          <div class="control">
            <input class="input" type="text" placeholder="Country and/or city where you live" v-model="location">
          </div>
        </div>
        <div class="field">
          <label class="label">Briefly describe your experience as a couch-surfer.</label>
          <div class="control">
            <textarea class="textarea" placeholder="" v-model="cs_experience"></textarea>
          </div>
          <p class="help">How many times you've surfed, hosted, and used other features of similar platforms. Have you been part of communities? Anything else you'd like to tell us.</p>
        </div>
        <div class="field">
          <label class="label">Would you like to help in developing or growing Couchers.org?</label>
          <div class="control">
            <label class="radio">
              <input type="radio" name="develop" value="yes" v-model="develop">
              Yes
            </label>
            <label>
              <input type="radio" name="develop" value="no" v-model="develop">
              No
            </label>
            <label>
              <input type="radio" name="develop" value="maybe" v-model="develop">
              Maybe
            </label>
          </div>
        </div>
        <div class="field">
          <label class="label">What kinds of expertise do you have that could help us build and grow this platform?&#13;&#10;Feel free to share a link to your portfolio, github, linkedin or anything else.</label>
          <div class="control">
            <textarea class="textarea" placeholder="" v-model="expertise"></textarea>
          </div>
          <p class="help">Have technical or community/non-profit experience? Anything else you think could get us moving forward?</p>
        </div>
        <div class="control">
          <button class="button is-primary">Submit</button>
        </div>
      </form>
    </section>

    <section class="section" v-bind:class="{ 'is-hidden': !second_page_done || loading }">
      <h3 class="title is-3">Thank you!</h3>
      <p class="subtitle is-5">We appreciate you taking the time to help us build Coucher.org</p>
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

      name: "",
      name_error: null,
      email: "",
      email_error: null,
      contribute: "yes",
      first_page_done: false,

      ideas: null,
      features: null,
      age: null,
      gender: null,
      location: null,
      cs_experience: null,
      develop: null,
      expertise: null,
      second_page_done: false,
    }
  },
  methods: {
    valid_email: function (email) {
      var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(email);
    },
    check_form1: function () {
      this.name_error = null;
      this.email_error = null;

      let has_errors = false;

      if (!this.name) {
        this.name_error = 'Name required!'
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
          'https://ja4o9uz9u3.execute-api.us-east-1.amazonaws.com/form_handler',
          data,
          { cancelToken: source.token }
        ).then(res => {
          this.loading = false
        }).catch(error => {
          this.error = true
          this.loading = true
        })

    },
    submit_form1: function () {
      if (this.check_form1()) {
        this.first_page_done = true
        this.submit({
          form: 1,
          name: this.name,
          email: this.email,
          contribute: this.contribute
        })
      }
    },
    submit_form2: function () {
      if (this.first_page_done) {
        this.second_page_done = true
        this.submit({
          form: 2,
          name: this.name,
          email: this.email,
          contribute: this.contribute,
          ideas: this.ideas,
          features: this.features,
          age: this.age,
          gender: this.gender,
          location: this.location,
          cs_experience: this.cs_experience,
          develop: this.develop,
          expertise: this.expertise
        })
      }
    }
  },
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

<style>
.input, .textarea {
  max-width: 400px;
}

.progress-container {
  padding: 10vh 10vw;
}
</style>
