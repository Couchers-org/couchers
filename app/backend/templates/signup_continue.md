---
subject: "Finish signing up for Couchers.org"
---

{% from "macros.html" import button %}
Hi {{ flow.name|couchers_escape }}!

Please finish signing up for Couchers.org.

{% if html %}

{{ button("Continue signing up", signup_link) }}

Please click on the above button to continue, or click the following link: <{{ signup_link }}>.

{% else %}

Please click on this link to continue: <{{ signup_link }}>.

{% endif %}

See you in a bit :).

The Couchers.org team
