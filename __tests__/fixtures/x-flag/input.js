const re = new RegExp(`

  # A regular expression for date.

  (?<year>\d{4})-    # year part of a date
  (?<month>\d{2})-   # month part of a date
  (?<day>\d{2})      # day part of a date

`, 'x')