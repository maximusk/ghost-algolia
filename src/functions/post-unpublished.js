import indexFactory from './lib/indexFactory';

exports.handler = (event, context, callback) => {
  const algoliaSettings = {
    active: process.env.ALGOLIA_ACTIVE === 'TRUE',
    applicationID: process.env.ALGOLIA_APP_ID,
    apiKey: process.env.ALGOLIA_API_KEY,
    index: process.env.ALGOLIA_INDEX,
  };

  const parsedPost = JSON.parse(event.body).post;
  // unpublishing
  let post = parsedPost.current;
  if (!post.uuid) {
    // deleting
    post = parsedPost.previous;
  }

  const index = indexFactory(algoliaSettings);

  if(index.connect()) {
    index.delete(post)
    .then(() => { console.log('GhostAlgolia: post "' + post.title + '" has been removed from the index.'); })
    .catch((err) => console.log(err));
  };
};