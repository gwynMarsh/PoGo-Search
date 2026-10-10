# Pokémon GO Search Builder

Build English Pokémon GO inventory search strings.

- Stars, types and CP presets match any selected option.
- Zero Attack, statuses, exclusions and different filter groups must all match.
- Custom CP replaces presets. Enter whole numbers of at least 10; leave either bound blank for an open range.
- Contradictory selections show a message and disable Copy until resolved.
- CP bands are storage filters, not checks of battle league eligibility.

Open `index.html` in a browser or serve this directory as a static site.

Run regression tests with `node --test tests/search.test.cjs`.

`search.js` contains pure query generation; `app.js` handles UI and clipboard behavior.
