<template>
  <div class="container">
    <section class="hero">
      <div class="hero-body">
        <div class="container">
          <h2 class="title is-2">Sign up for Couchers.org</h2>
          <p class="subtitle is-4">Join the worldwide team of couch-surfers building this community-run platform to life</p>
          <p class="content">We are looking for a range of people including software developers, UX/UI engineers and designers. We also need people who have ideas and want to be part of the conversation, and who can help us test the platform as we build it.</p>
        </div>
      </div>
    </section>

    <section class="section" v-bind:class="{ 'is-hidden': first_page_done }">
      <form id="form1" @submit.prevent="submit_form" action="/submit" method="post">
        <h3 class="title is-3">Your details</h3>
        <p class="subtitle is-5">The basics about you</p>
        <div class="field">
          <label class="label" for="name">Name</label>
          <div class="control">
            <input class="input couchers-text-input" v-bind:class="{ 'is-danger': name_error !== null }" name="name" id="name" type="text" v-model="name" placeholder="Your name">
          </div>
          <p class="help is-danger" v-bind:class="{ 'is-hidden': name_error === null }">{{ name_error }}</p>
        </div>
        <div class="field">
          <label class="label" for="email">Email</label>
          <div class="control">
            <input class="input couchers-text-input" v-bind:class="{ 'is-danger': email_error !== null }" name="email" id="email" type="email" v-model="email" placeholder="Email address">
          </div>
          <p class="help is-danger" v-bind:class="{ 'is-hidden': email_error === null }">{{ email_error }}</p>
        </div>
        <div class="field">
          <label class="label">Would you like to help in building Couchers.org?</label>
          <div class="control">
            <label class="radio">
              <input type="radio" name="contribute" value="yes" v-model="contribute" checked>
              Yes, I'd like to contribute
            </label>
          </div>
          <div class="control">
            <label>
              <input type="radio" name="contribute" value="no" v-model="contribute">
              No, just let me know when you've got something ready to use
            </label>
          </div>
        </div>
        <div class="control content">
          <button class="button is-primary">Submit</button>
        </div>
        <p class="content has-text-grey is-italic">There's a few more optional questions on the next page if you want to tell us more!</p>
      </form>
    </section>
    <section class="section" v-bind:class="{ 'is-hidden': !first_page_done }">
      <div class="field">
        <label class="label">Age</label>
        <div class="control">
          <input class="input" type="text" placeholder="Your age">
        </div>
      </div>
      <div class="field">
        <label class="label">Gender</label>
        <div class="control">
          <div class="select">
            <select>
              <option>Male</option>
              <option>Female</option>
              <option>Genderqueer/Nonbinary</option>
              <option>Gender not listed here</option>
            </select>
          </div>
        </div>
      </div>
      <div class="field">
        <label class="label">Country of birth</label>
        <div class="control">
          <input class="input" type="text" placeholder="Country of birth">
        </div>
      </div>
      <div class="field">
        <label class="label">Country of residence</label>
        <div class="control">
          <input class="input" type="text" placeholder="Country of residence">
        </div>
      </div>
      <div class="field">
        <label class="label">If you have technical expertise relevant to building this platform, what is your expertise and experience?</label>
        <div class="control">
          <textarea class="textarea" placeholder="Textarea"></textarea>
        </div>
      </div>
      <div class="field">
        <label class="label">If you have non-profit or business experience that could help with growing this platform, what is your experience?</label>
        <div class="control">
          <textarea class="textarea" placeholder="Textarea"></textarea>
        </div>
      </div>
      <div class="field">
        <label class="label">Briefly describe your experience as a couch-surfer</label>
        <p>How many times you've surfed, hosted, used other features of apps. Have you been part of communities? Anything else you'd like to tell us.</p>
        <div class="control">
          <textarea class="textarea" placeholder="Textarea"></textarea>
        </div>
      </div>
      <div class="field">
        <label class="label">Please describe any problems you've had or seen with other platforms such as CouchSurfing</label>
        <div class="control">
          <textarea class="textarea" placeholder="Textarea"></textarea>
        </div>
      </div>
      <div class="field">
        <label class="label">Please describe any features you'd like to see in a new platform</label>
        <p>Or share any ideas you have that would improve the couch-surfing experience.</p>
        <div class="control">
          <textarea class="textarea" placeholder="Textarea"></textarea>
        </div>
      </div>
      <div class="control">
        <button class="button is-primary">Submit</button>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  data () {
    return {
      name: "",
      name_error: null,
      email: "",
      email_error: null,
      contribute: "yes",
      first_page_done: false
    }
  },
  methods: {
    check_form: function () {
      this.name_error = null;
      this.email_error = null;

      let has_errors = false;

      if (!this.name) {
        console.log("oooooo")
        this.name_error = 'Name required!'
        has_errors = true
      }

      if (!this.email) {
        this.email_error = 'Email required.'
        has_errors = true
      } else if (!this.validEmail(this.email)) {
        this.email_error = 'Valid email required.'
        has_errors = true
      }

      return !has_errors
    },
    validEmail: function (email) {
      var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(email);
    },
    submit_form: function () {
      if (this.check_form()) {
        this.first_page_done = true
        console.log("form submitted.")
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
.couchers-text-input {
  max-width: 400px;
}
</style>