---
subject: "Confirm your Couchers.org account deletion"
---

{% from "macros.html" import button, link, support_email, email_link, newline %}
Hi {{ user.name|couchers_escape }},

You requested that we delete your account from Couchers.org.

To complete this process, please confirm by clicking the following link:

{% if html %}

{{ button("Delete Account", deletion_link)|couchers_safe }}

Alternatively, click the following link: {{ link(deletion_link, html)|couchers_safe }}

{% else %}

<{{ deletion_link|couchers_safe }}>

{% endif %}


If this wasn't you, please contact us by emailing {{ support_email(html)|couchers_safe }} so we can sort this out as soon as possible!

The Couchers.org team
