---
subject: "Reset your Couchers.org password"
---

{% from "macros.html" import button, link, support_email, email_link, newline %}
Hi {{ user.name|couchers_escape }}!

You asked for your password to be reset on Couchers.org.

{% if html %}

{{ button("Reset password", password_reset_link)|couchers_safe }}

Alternatively, click the following link: {{ link(password_reset_link, html)|couchers_safe }}

{% else %}

<{{ password_reset_link|couchers_safe }}>

{% endif %}


If this wasn't you, please contact us by emailing {{ support_email(html)|couchers_safe }} so we can sort this out as soon as possible!

The Couchers.org team
