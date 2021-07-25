---
subject: "New sign up"
---

{% from "macros.html" import button, link, support_email %}

Name: {{ form.user.name|couchers_escape }}
Email: {{ form.user.email|couchers_escape }}
Username: {{ form.user.username|couchers_escape }}
Profile: {{ link(user_link, html)|couchers_safe }}

Wants to contribute: {{ ("missing" if not form.contribute else form.contribute.name)|couchers_escape }}
Ways: {{ ("missing" if not form.contribute_ways else ", ".join(form.contribute_ways))|couchers_escape }}


* Age
{{ form.user.age|couchers_escape }}

* Gender
{{ form.user.gender|couchers_escape }}

* Country and city
{{ form.user.city|couchers_escape }} (tz: {{ form.user.timezone|couchers_escape }})

* What expertise do you have that could help build and grow Couchers.org?
{{ (form.expertise or "missing")|couchers_escape }}

* Briefly describe your experience as a couch surfer.
{{ (form.experience or "missing")|couchers_escape }}

* Please share any ideas you have that would improve the couch surfing experience for you and for the community.
{{ (form.ideas or "missing")|couchers_escape }}

* What feature would be most important to you? How could we make that feature as good as possible for your particular use?
{{ (form.features or "missing")|couchers_escape }}
