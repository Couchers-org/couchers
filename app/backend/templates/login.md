---
subject: "Your login link for Couchers.org"
---

{% from "macros.html" import button %}
Hi {{ user.name|couchers_escape }}!

Here's a login link for Couchers.org:

{% if html %}

{{ button("Sign in", login_link)|couchers_safe }}

Alternatively, click the following link: <{{ login_link|couchers_escape }}>.

{% else %}

<{{ login_link|couchers_escape }}>

{% endif %}

See you in a bit :).

The Couchers.org team
