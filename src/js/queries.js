/* eslint-disable no-param-reassign, implicit-arrow-linebreak  */
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import _ from 'lodash';

const map = (data) => {
  const domParser = new DOMParser();

  const parsedXML = domParser.parseFromString(data, 'application/xml');

  const feed = parsedXML.querySelector('channel');

  const { textContent: title } = feed.querySelector('title');

  const { textContent: description } = feed.querySelector('description');

  const id = uuidv4();

  const feedPosts = parsedXML.querySelectorAll('item');

  const posts = Array.from(feedPosts).map((feedPost) => {
    const { textContent: feedPostTitle } = feedPost.querySelector('title');

    const { textContent: feedPostLink } = feedPost.querySelector('link');

    return {
      title: feedPostTitle,
      href: feedPostLink,
      feedId: id,
    };
  });

  return {
    id,
    title,
    description,
    posts,
  };
};

export const subscribe = (state) => {
  const { feeds } = state.rss;

  if (feeds.length !== 0) {
    feeds.forEach((feed) => {
      const { id, url } = feed;

      axios
        .get(url)
        .then(({ data }) => {
          try {
            const posts = state.rss.posts
              .filter((post) => post.feedId === id)
              .map(({ title, href }) => ({ title, href }));

            const newPosts = _.pick(map(data), ['posts']).posts.map(
              ({ title, href }) => ({
                title,
                href,
              }),
            );

            const postsDiff = _.differenceWith(newPosts, posts, _.isEqual);

            if (postsDiff.length !== 0) {
              state.rss = {
                ...state.rss,
                posts: [
                  ...postsDiff.map(({ title, href }) => ({
                    title,
                    href,
                    feedId: id,
                  })),
                  ...state.rss.posts,
                ],
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
      try {
        const feed = data |> map;

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
      } catch (err) {
        state.form.process.error = err;
        state.form.process.state = 'failed';
      }
    })
    .catch((err) => {
      state.form.process.error = err;
      state.form.process.state = 'failed';
      throw err;
    });
};
