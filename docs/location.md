# About the location feature

## Conceptual view

Locations are **mandatory** on the app, and they're **public** (for logged in users). Each user must have a center and a radius, and it will be shown to others and returned as part of API calls, etc.

## Location policy

There is no requirement that the location is the user's true location, as long a it's somehow representative of where they live (same city/area). For example, it's okay to set the location to the center of your city or suburb if you wish to obfuscate it. It would, however, be best if the circle contained the true location if at all possible, but we understand some users have extra privacy concerns and the limited radius is not enough for everyone.

## Verification

Eventually, I foresee verification as having another address and point in the database corresponding to the true home location (verified with e.g. postcard). This will be private (maybe visible for confirmed guests?), and the user's location is verified if this point is within the public circle.
