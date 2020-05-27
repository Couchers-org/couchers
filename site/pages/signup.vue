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
			<div class="field">
			  <label class="label">Name</label>
			  <div class="control">
			    <input class="input" type="text" placeholder="Your name">
			  </div>
			</div>
			<div class="field">
			  <label class="label">Email</label>
			  <div class="control">
			    <input class="input" type="email" placeholder="Email address">
			  </div>
			</div>
	  	<p>We are looking for a range of people including software and UX/UI engineers and designers. We also need people who have ideas and want to be part of the conversation, and who can help us test the product as we build it.</p>
			<div class="field">
			  <label class="label">Would you like to help in building Couchers.org?</label>
			  <div class="control">
	        <label class="radio">
	          <input type="radio" name="contribute" value="yes">
	          <label for="male">Yes, I'd like to contribute</label><br>
					  <input type="radio" name="contribute" value="no">
					  <label for="female">No, just let me know when you've got something ready to use</label><br>
	        </label>
			  </div>
			</div>
			<div class="field">
			  <div class="label">
			    <label class="label">Would you like to participate in possible future questionaires about what is important to you about the platform and community?</label>
			  </div>
			  <div class="field">
			    <div class="field">
			      <div class="control">
			        <label class="radio">
			          <input type="radio" name="participate" value="yes">
			          Yes
			        </label>
			        <label class="radio">
			          <input type="radio" name="participate" value="no">
			          No
			        </label>
			      </div>
			    </div>
			  </div>
			</div>
			<div class="control">
			  <button class="button is-primary">Submit</button>
			</div>
		</section>
		<section class="section">
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
