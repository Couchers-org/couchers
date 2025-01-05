---
subject: "New sign up"
---

Name: {{ form.user.name }}
Email: {{ form.user.email }}
Username: {{ form.user.username }}

Wants to contribute: {{ ("missing" if not form.contribute else form.contribute.name) }}
Ways: {{ ("missing" if not form.contribute_ways else ", ".join(form.contribute_ways)) }}

* Age
{{ form.user.age }}

* Gender
{{ form.user.gender }}

* Country and city
{{ form.user.city }} (tz: {{ form.user.timezone }})

* What expertise do you have in this area(s)?
{{ (form.expertise or "missing") }}

* Briefly describe your experience as a couch surfer.
{{ (form.experience or "missing") }}

* What improvements on Couchsurfing™ would you like to see?
{{ (form.ideas or "missing") }}

* Which features are most important to you?
{{ (form.features or "missing") }}
