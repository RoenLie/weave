thoughts on a new variant of the localize lib.

Whenever a term is requested getOrCreate a signal that holds the value of the language code.
whenever language is changed, or new language codes is added.
After adding them to the lang code map, check which lang codes are currently in use and assign
the new values to those, if any of them are in the new codes being added or changed.

This should allow the term simply returning a string, and also avoid having to rely on promises.

