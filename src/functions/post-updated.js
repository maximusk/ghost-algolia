import indexFactory from './lib/indexFactory';
import parserFactory from './lib/parserFactory';

exports.handler = (event, context, callback) => {
  const algoliaSettings = {
    active: process.env.ALGOLIA_ACTIVE === 'TRUE',
    applicationID: process.env.ALGOLIA_APP_ID,
    apiKey: process.env.ALGOLIA_API_KEY,
    index: process.env.ALGOLIA_INDEX,
  };

  const post = JSON.parse(event.body).post.current;
  const index = indexFactory(algoliaSettings);

  if(index.connect()) {
    let promisePublishedEdited;
    if(parserFactory().parse(post, index)) {
      promisePublishedEdited = index.delete(post)
      .then(() => index.save());
    } else {
      promisePublishedEdited = index.delete(post);
    }
    promisePublishedEdited
    .then(() => { console.log('GhostAlgolia: post "' + post.title + '" has been updated in the index.'); })
    .catch((err) => console.log(err));
  };
};