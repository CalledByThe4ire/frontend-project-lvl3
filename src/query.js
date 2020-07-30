/* eslint-disable no-param-reassign, implicit-arrow-linebreak  */
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
    title,
    description,
    posts,
  };
};

const addId = (feed, id = uuidv4()) => ({
  ...feed,
  id,
  posts: feed.posts.map((post) => {
    post.feedId = id;

    return post;
  }),
});

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
          try {
            const oldPosts = state.rss.posts.filter(
              (post) => post.feedId === feedId,
            );

            const parsedFeed = data |> parse;

            const { posts } = _.pick(parsedFeed, ['posts']);

            const newPosts = posts.map((post) => {
              post.feedId = feedId;

              return post;
            });

            const postsDiff = _.differenceWith(newPosts, oldPosts, _.isEqual);

            if (postsDiff.length !== 0) {
              state.rss = {
                ...state.rss,
                posts: [...postsDiff, ...state.rss.posts],
              };
            }
          } catch (err) {
            console.error(err);
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
      const feed = data |> parse |> addId;

      if (feed) {
        const {
          title, description, id, posts,
        } = feed;

        state.rss = {
          ...state.rss,
          posts: [...posts, ...state.rss.posts],
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
