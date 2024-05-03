---
subject: "You have {{ time_left_text|couchers_escape }} to write a reference for {{ other_user.name|couchers_escape }}!"
---

{% from "macros.html" import button, link, support_email, email_link, newline %}

Hi {{ user.name|couchers_escape }}!

You have {{ time_left_text|couchers_escape }} left to write a reference for {{ other_user.name|couchers_escape }} from when you {% if surfed %} surfed with {% else %} hosted {% endif %} them.

Leave a reference here:

{% if html %}
{{ button("Leave a reference", leave_reference_link)|couchers_safe }}

Alternatively, click the following link: {{ link(leave_reference_link, html)|couchers_safe }}
{% else %}
<{{ leave_reference_link|couchers_safe }}>
{% endif %}

You can also leave a reference by going to the Messaging tab, locating the request, then clicking on the "Write Reference" button at the bottom of the conversation.

It's a nice gesture to write references and helps us build a community together! References will become visible 2 weeks after the stay, or when you've both written a reference for each other, whichever happens first.

Thanks for using Couchers!

The Couchers.org team
