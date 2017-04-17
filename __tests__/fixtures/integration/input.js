const re = new RegExp(`

  # A combined regexp with different features.

  (?<name>.)+
  \k<name>

`, 'sux');