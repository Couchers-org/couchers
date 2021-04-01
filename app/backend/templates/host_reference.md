---
subject: "You've received a reference from {{ escape(reference.from_user.name) }}!"
---

{% from "macros.html" import button %}

Hi {{ escape(reference.to_user.name) }}!

{{ escape(reference.from_user.name) }} just wrote a reference for you from when you {% if surfed %} surfed with {% else %} hosted {% endif %} them.

{% if both_written %}
This is what they wrote:

"{{ escape(reference.text) }}"

Thanks for using Couchers to organize this interaction! We hope you had an enjoyable, fulfilling time.
{% else %}
Please go and write a reference for them too. It's a nice gesture and helps us build a community together! When you've both written a reference, the references will both become visible. Otherwise {{ escape(reference.from_user.name) }}'s reference will become visible 2 weeks after the end of your interaction, after which you cannot write a reference back.

Thanks for using Couchers!
{% endif %}


The Couchers.org team
