To allow for section tags:
https://draftjs.org/docs/advanced-topics-custom-block-render-map.html

To export / import HTML to draft:
https://github.com/sstur/draft-js-utils

GENERAL IDEA: Do all the editor important stuff first so I have an editor that I can use in my own work. Then, we can make it save to a DB, etc.

MUST HAVES TO WRITE MY BOOK:
- [ ] Simple HTMLBook export (react-rte uses this lib, so check config. It does <p> nicely)
- [ ] Ability to add headings
- [ ] Export headings as HTMLBook sections
- [ ] Ability to save multiple files in projects
- [ ] Add list item handling from react-rte

OTHER IDEAS:
- [ ] The HTML export should be configurable in the UI (match draft export HTML params). So users can select this per "output".
- [ ] ID's should never be added during build. They should stay in the document at all times. Preserve react ID's?
