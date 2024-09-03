# Ferrite

## What is it?

This is a project that is intended to be a multi app platform that has a base shell with navigation and some administrative and user options.
Applications following the correct pattern can be uploaded and activated through the administration panel and then navigated to through the main layout.
The applications can then be viewed through an iframe.
As a byproduct of the proxy mechanism that is expected to be used, that one can also fully navigate to the site and then be able to view the subpage without the main navigation present.
For this we would have to ensure that authentication catches any attempts to access the page, prior to proxying.