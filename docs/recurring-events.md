# Notes on recurring events

* In order to produce recurring events, we need some definition that tells us a "recurrence rule" which for this doc we'll use to mean "a rule that defines how to generate an infinite series of dates for when a regular event should take place" (I will use "recurrence rule" in this sense through the doc, it has different meanings elsewhere, don't confuse with "RRULE")
* Working with calendars can be a bit painful, so we adopt a subset of RFC 5545 to define such recurrence rules; it's the iCalendar standard and provides a relatively complete and widely implemented machinery for dealing with events, occurrences, datetimes, etc.
* In particular, we adopt the minimal part we need from this standard that lets us define such recurrence rules. We use an RRULE + DTSTART pair, where DTSTART is a defined date and set to midnight at the start of that day
  - An RRULE doesn't often make much sense without a DTSTART, it can be used for instance to define which day of the week a weekly recurrence rule is for, so we need it in addition to the RRULE
  - The RRULE should not include COUNT or UNTIL (making it a finite series)
* RFC 5545 would also provide machinery for handling start *times* and timezones, and which dates to exclude and when to stop; but we do not adopt these, as the library support is limited, and we woudl rather work out this logic in our code
* Our code *should* produce RRULE + DTSTART pairs where the RRULE is from a set of chosen types (at this time we support a limited subset), and DTSTART is always at floating midnight of the start of a given date (i.e. time 000000 without timezone)
  - These pairs should be serialized as a two RFC 5545 content lines, DTSTART followed by RRULE
* Our code *should* consume RRULE + DTSTART pairs where RRULE is an *arbitrary* (within reason) valid RFC 5545 RRULE and DTSTART is at floating midnight of the start of an arbitrary date, and it does not contain UNTIL or COUNT
* Our code *should* raise an exception if the DTSTART of a consumed RRULE + DTSTART date is not at floating midnight of the start of a date, or if the RRULE contains UNTIL or COUNT
* RRULEs technically allow defining recurrences that occur multiple times per day, in this case our code should deduplicate dates
* We will want an ability to edit recurrence rules. In this case, our code should refuse to modify a recurrence rule it does not understand
