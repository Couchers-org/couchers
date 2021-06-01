---
subject: "Finish signing up for Couchers.org"
---

{% from "macros.html" import button %}
Hi {{ escape(flow.name) }}!

Thanks for signing up for Couchers.org!

{% if html %}

{{ button("Confirm your email address", signup_link) }}

To finish setting up your account, please click on the above button, or click the following link: <{{ signup_link }}>.

{% else %}

To finish setting up your account, please click on this link to confirm your email address: <{{ signup_link }}>.

{% endif %}

See you in a bit :).

The Couchers.org team
