---
subject: "Your login link for Couchers.org"
---

{% from "macros.html" import button, link, support_email, email_link, newline %}
Hi {{ user.name|couchers_escape }}!

Here's a login link for Couchers.org:

{% if html %}

{{ button("Sign in", login_link)|couchers_safe }}

Alternatively, click the following link: {{ link(login_link, html)|couchers_safe }}

{% else %}

<{{ login_link|couchers_safe }}>

{% endif %}

See you in a bit :)

The Couchers.org team
