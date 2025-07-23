import { GraphClient } from './index.js';
import { metadataFilter, pathFilter, variationsFilter } from './filters.js';

function variationSelector<T>(variations: T[]): T {
  const n = Math.floor(Math.random() * variations.length);

  return variations[n];
}

const client = new GraphClient('my key');

//
// Basic example
client.getItem(pathFilter('/en/home'));

//
// A navigation menu
client.listItems();

//
// Get latest news
client.listItems({
  where: {
    _metadata: { types: { in: ['news'] } },
  },
  limit: 10,
  orderBy: {
    _metadata: {
      created: 'DESC',
    },
  },
});

//
// I have the variations before fetching anything
const filter = {
  ...pathFilter('/en/home'),
  ...variationsFilter(['variation_value']),
};
client.getItem(filter);

//
// I don't have the variation before fetching metadata
const items = await client.listItemsMetadata({
  ...pathFilter('/en/home'),
  ...variationsFilter(),
});

const variation = variationSelector(items);
const content = await client.getItemContent({
  ...metadataFilter(variation),
  ...variationsFilter([variation.variation]),
});
