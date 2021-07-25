---
subject: "Welcome to Couchers.org and the future of couch surfing"
---

{% from "macros.html" import button, link, support_email, email_link, newline %}

Hi {{ user.name|couchers_escape }}!

Welcome to the growing online community of people who have joined the Couchers.org project. It's great to have you here!

As one of the first users, you have a vital role in shaping the future of the platform. You can help us test the functionality, provide feedback, and set the scene and culture as we grow bigger.

Please take some time to explore the platform. As a first step, please head to {{ link(edit_profile_link, html)|couchers_safe }} and edit your profile. Please upload a photo and fill in some profile text, you can even copy your description from your account on other platforms if you're feeling lazy :P

{% if html %}

{{ button("Edit your profile", edit_profile_link)|couchers_safe }}

{% endif %}

Otherwise, please share the link with any of your couch surfing friends that you trust! This platform can only grow with your help bringing the best people over to start it.

Link: <{{ app_link|couchers_escape }}>

The platform is under rapid development, and features are actively being built by our amazing team of Couchers.org contributors around the world. If there's some features you want to see like events, forums, hangouts or public trips, you'll be happy to hear that we're going to build them all, and you'll see some features come out very soon! As you explore the platform, please report any bugs that you see by hitting the "Report a problem" button in the top right corner.

You can also head on over to our forum at {{ link("https://community.couchers.org", html)|couchers_safe }} to discuss features, ideas, or anything else to do with Couchers.org or couch surfing in general. From there you can also join our regular online events if you'd like to meet other passionate couch surfers who are part of this incredible new community!

{% if html %}

{{ button("Visit the forum", "https://community.couchers.org")|couchers_safe }}

{% endif %}

Thanks so much for joining, especially this early. We're really excited to make something great for all of us to use!


Best,

Itsi from Couchers.org{{ newline(html)|couchers_safe }}
Co-founder and Community Team Lead{{ newline(html)|couchers_safe }}
{{ email_link("itsi@couchers.org", html)|couchers_safe }} (always feel free to shoot me an email)
