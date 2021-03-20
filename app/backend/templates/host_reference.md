---
subject: "You've received a reference!"
---

{% from "macros.html" import button %}

Hi {{ escape(reference.to_user.name) }}!

{{ escape(reference.from_user.name) }} just wrote a reference for you from when you {% if surfed %} surfed with {% else %} hosted {% endif %} them.

This is what they wrote:

"{{ escape(reference.text) }}"


{% if both_written %}
Thanks for using Couchers to organize this interaction! We hope you had an enjoyable, fulfilling time.
{% else %}
Please go and write a reference for them too. It's a nice gesture and helps us build a community together!
{% endif %}


Thanks for using Couchers!

The Couchers.org team
