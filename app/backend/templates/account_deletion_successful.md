---
subject: "Your Couchers.org account has been deleted"
---

{% from "macros.html" import button, link, support_email, email_link, newline %}
Hi {{ user.name|couchers_escape }},

You have successfully deleted your account from Couchers.org.

We are sad to see you go, but wish you the best in your future travels. You are always welcome back on the Couchers.org platform anytime :)

If you change your mind, you have {{ days|couchers_escape }} days to retrieve your account by clicking the following link and following the prompt:

{% if html %}

{{ button("Recover Account", undelete_link)|couchers_safe }}

Alternatively, click the following link: {{ link(undelete_link, html)|couchers_safe }}

{% else %}

<{{ undelete_link|couchers_safe }}>

{% endif %}

After {{ days|couchers_escape }} days your account will be permanently irretrievable.


If this wasn't you, please contact us by emailing {{ support_email(html)|couchers_safe }} so we can sort this out as soon as possible!

The Couchers.org team
