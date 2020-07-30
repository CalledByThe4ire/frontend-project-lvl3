/* eslint-disable no-param-reassign, */
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import _ from 'lodash';

const parse = (data) => {
  const domParser = new DOMParser();

  const parsedXML = domParser.parseFromString(data, 'application/xml');

  const feed = parsedXML.querySelector('channel');

  const { textContent: title } = feed.querySelector('title');

  const { textContent: description } = feed.querySelector('description');

  const feedPosts = parsedXML.querySelectorAll('item');

  const posts = Array.from(feedPosts).map((feedPost) => {
    const { textContent: feedPostTitle } = feedPost.querySelector('title');

    const { textContent: feedPostLink } = feedPost.querySelector('link');

    return {
      title: feedPostTitle,
      href: feedPostLink,
    };
  });

  return {
    id: uuidv4(),
    title,
    description,
    posts,
  };
};

export const subscribe = (state) => {
  const {
    rss: { feeds },
  } = state;

  if (feeds.length !== 0) {
    feeds.forEach((feed) => {
      const { id: feedId, url: feedUrl } = feed;

      axios
        .get(feedUrl)
        .then(({ data }) => {
          const parsedFeed = data |> parse;

          const postsIndex = state.rss.posts.findIndex(
            (post) => post.feedId === feedId,
          );

          const oldPosts = state.rss.posts[postsIndex].items;

          const newPosts = parsedFeed.posts;

          const postsDiff = _.differenceWith(newPosts, oldPosts, _.isEqual);

          if (postsDiff.length !== 0) {
            state.rss = {
              ...state.rss,
              posts: [
                ...state.rss.posts.slice(0, postsIndex),
                { feedId, items: [...postsDiff, ...oldPosts] },
                ...state.rss.posts.slice(postsIndex + 1),
              ],
            };
          }
        })
        .catch((err) => {
          console.error(err);
          throw err;
        });
    });
  }
};

export default (url, state) => {
  axios
    .get(url)
    .then(({ data }) => {
      const feed = data |> parse;

      if (feed) {
        const {
          id, title, description, posts,
        } = feed;

        state.rss = {
          ...state.rss,
          posts: [{ feedId: id, items: posts }, ...state.rss.posts],
          feeds: [
            {
              id,
              title,
              description,
              url,
            },
            ...state.rss.feeds,
          ],
        };
        state.form.process.state = 'finished';
      }
    })
    .catch((err) => {
      state.form.process.error = err;
      state.form.process.state = 'failed';
      throw err;
    });
};
