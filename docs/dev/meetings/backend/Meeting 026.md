# Backend team meeting #26

When: 23/6/21, 20:00 UTC.
Attending: Aapeli, Austin, Christian, Sam

## Notes

* Discussing splitting up logging out of the main database
  - Maybe just different postgres instance
  - Another option is just storing it in a binary log file with e.g. a 4 byte length value then binary protobuf
* Signup flow v2: Christian has been working on it and fixing it, soon ready for frontend stuff again
* Everyone is not in the github couchers-org/backend group
* Sam wants a backend channel
* Sam will help Austin with testing his PR
