---
subject: "Confirm your new email for Couchers.org"
---

{% from "macros.html" import button, link, support_email, email_link, newline %}
Hi {{ user.name|couchers_escape }}!

You requested that your email be changed on Couchers.org.

The new email address is {{ user.new_email|couchers_escape }}.

Please confirm you requested this change by clicking the following link:

{% if html %}

{{ button("Confirm new email", confirmation_link)|couchers_safe }}

Alternatively, click the following link: {{ link(confirmation_link, html)|couchers_safe }}

{% else %}

<{{ confirmation_link|couchers_safe }}>

{% endif %}

If you haven't already confirmed this change, you will still need a final confirmation via a similar email sent to your new email address.


If this wasn't you, please contact us by emailing {{ support_email(html)|couchers_safe }} so we can sort this out as soon as possible!

The Couchers.org team
