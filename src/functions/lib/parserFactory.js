import { parseFragment } from 'parse5';
import striptags from 'striptags';
import slug from 'slug';
import { isHeading, getHeadingLevel } from './utils';
const downsize = require('downsize');

const parserFactory = () => ({
  // Returns the number of fragments successfully parsed
  parse(post, index) {
    let fragment = {};
    let headingCount = 0;

    const cleanhtml = striptags(post.html, ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
    const nodes = parseFragment(cleanhtml).childNodes;

    if (nodes.length !== 0) {
      // can that be true even with an empty doc?
      // Set first hypothetical headless fragment attributes.
      if (!isHeading(nodes[0])) {
        fragment.id = post.slug;
        // we give a higher importance to the intro (the first headless fragment)
        fragment.importance = 0;

        updateFragment(fragment, post);
      }

      nodes.forEach((node) => {
        if (isHeading(node)) {
          // Send previous fragment
          index.addFragment(fragment);

          fragment = {};
          headingCount += 1;
          fragment.heading = node.childNodes[0].value;
          fragment.id = `${post.slug}#${slug(fragment.heading, { lower: true })}--${headingCount}`;
          fragment.importance = getHeadingLevel(node.nodeName);
          
          updateFragment(fragment, post);
        } else {
          if (fragment.content === undefined) fragment.content = '';
          // If node not a heading, then it is a text node and always has a value property
          fragment.content += `${node.value} `;
        }
      });

      // Saving the last fragment (as saving only happens as a new heading
      // is found). This also takes care of heading-less articles.
      index.addFragment(fragment);
    }

    return index.fragmentsCount();
  },
});

function updateFragment(fragment, post) {
  fragment.post_uuid = post.uuid;
  fragment.post_title = post.title;
  fragment.feature_image = post.feature_image;
  fragment.post_published_at = post.published_at;
  fragment.excerpt = getExcerpt(post);
  fragment.tags = post.tags.map(tag => tag.name);

  if (post.primary_author) {
    fragment.author_id = post.primary_author.id;
    fragment.author_name = post.primary_author.name;
    fragment.author_url = post.primary_author.url;
    fragment.author_profile_image = post.primary_author.profile_image;
  }
}

function getExcerpt(post) {
  const html = post.custom_excerpt ? String(post.custom_excerpt) : post.html ? String(post.html) : '';

  // Strip inline and bottom footnotes
  var excerpt = html.replace(/<a href="#fn.*?rel="footnote">.*?<\/a>/gi, '');
  excerpt = excerpt.replace(/<div class="footnotes"><ol>.*?<\/ol><\/div>/, '');
  // Strip other html
  excerpt = excerpt.replace(/<\/?[^>]+>/gi, '');
  excerpt = excerpt.replace(/(\r\n|\n|\r)+/gm, ' ');

  return downsize(excerpt, {
    words: 50
  });
}

export default parserFactory;
