---
subject: "You have {{ time_left_text|couchers_escape }} to write a reference for {{ other_user.name|couchers_escape }}!"
---

{% from "macros.html" import button, link, support_email %}

Hi {{ user.name|couchers_escape }}!

You have {{ time_left_text|couchers_escape }} left to write a reference for {{ other_user.name|couchers_escape }} from when you {% if surfed %} surfed with {% else %} hosted {% endif %} them.

To write a reference, go to the Messaging tab and locate the request, then click on the "Write Reference" button at the bottom of the conversation.

It's a nice gesture to write references and helps us build a community together! References will become visible 2 weeks after the stay, or when you've both written a reference for each other.

Thanks for using Couchers!

The Couchers.org team
