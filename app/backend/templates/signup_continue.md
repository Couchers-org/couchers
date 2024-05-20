---
subject: "Finish signing up for Couchers.org"
---

{% from "macros.html" import button, link, support_email, email_link, newline %}
Hi {{ flow.name|couchers_escape }}!

Please finish signing up for Couchers.org.

{% if html %}

{{ button("Continue signing up", signup_link)|couchers_safe }}

Please click on the above button to continue, or click the following link: {{ link(signup_link, html)|couchers_safe }}

{% else %}

Please click on this link to continue: <{{ signup_link|couchers_safe }}>.

{% endif %}

See you in a bit :)

The Couchers.org team

If you did not request a signup, someone else did with your email, and you can safely ignore this message.
