---
subject: "Complete your profile on Couchers.org"
---

{% from "macros.html" import button, link, support_email, email_link, newline %}

Hi {{ user.name|couchers_escape }}!

We hope you've taken a bit of time to look around the new Couchers.org platform.

We would ask one big favour of you: please fill out your profile by adding a photo and some text.

{% if html %}

{{ button("Go to edit your profile", edit_profile_link)|couchers_safe }}

{% else %}

Link to profile editing page: {{ link(edit_profile_link, html)|couchers_safe }}

{% endif %}

A big problem that platforms like Couchsurfing have is that there are so many empty accounts, and we want to avoid that, especially at this early stage.

We would really appreciate it if you could add a photo and fill in at least the "Who I am" section of your profile, although a full profile would be even better! It's an easy way to make this new platform look great, and it'll mean you're set up for when people start using the platform to start couch surfing.


Thank you so much!

Emily from Couchers.org{{ newline(html)|couchers_safe }}
{{ email_link("community@couchers.org", html)|couchers_safe }}
