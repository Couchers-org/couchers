---
subject: "You've received a reference from {{ reference.from_user.name|couchers_escape }}!"
---

{% from "macros.html" import button, link, support_email, email_link, newline %}

Hi {{ reference.to_user.name|couchers_escape }}!

{{ reference.from_user.name|couchers_escape }} just wrote a reference for you from when you {% if surfed %} surfed with {% else %} hosted {% endif %} them.

{% if both_written %}
This is what they wrote:

"{{ reference.text|couchers_escape }}"

Thanks for using Couchers to organize this interaction! We hope you had an enjoyable, fulfilling time.
{% else %}
Please go and write a reference for them too. It's a nice gesture and helps us build a community together! When you've both written a reference, both references will become visible. Otherwise {{ reference.from_user.name|couchers_escape }}'s reference will become visible 2 weeks after the end of your interaction, after which you cannot write a reference back.

Thanks for using Couchers!
{% endif %}


The Couchers.org team
