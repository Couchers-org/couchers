---
subject: "Finish signing up for Couchers.org"
---

{% from "macros.html" import button, link, support_email %}
Hi there!

Thanks for signing up for Couchers.org!

{% if html %}

{{ button("Confirm your email address", signup_link)|couchers_safe }}

To finish setting up your account, please click on the above button, or click the following link: {{ link(signup_link, html)|couchers_safe }}.

{% else %}

To finish setting up your account, please click on this link to confirm your email address: <{{ signup_link|couchers_escape }}>.

{% endif %}

See you in a bit :).

The Couchers.org team
