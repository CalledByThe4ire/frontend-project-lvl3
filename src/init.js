/* eslint-disable implicit-arrow-linebreak */

import _ from 'lodash';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import * as yup from 'yup';
import i18next from 'i18next';
import { en } from './locales';
import parse from './parser';
import watch from './watcher';
import corsProxyUrl from './utils/cors-proxy-url';

const errorsMapping = {
  url: 'form.input.errors.url',
  exists: 'form.input.errors.exists',
  required: 'form.input.errors.required',
};

const validateRssUrl = (url, feeds) => {
  const urls = feeds.map((feed) => feed.url);

  const urlSchema = yup
    .string()
    .url(errorsMapping.url)
    .notOneOf(urls, errorsMapping.exists)
    .required(errorsMapping.required);

  try {
    urlSchema.validateSync(url);

    return null;
  } catch (error) {
    return error.message;
  }
};

const handleRssInput = ({ target: { value } }, state) => {
  const { form, feeds } = state;

  form.url = value;

  const rssUrlError = validateRssUrl(value, feeds);

  if (rssUrlError) {
    form.valid = false;
    form.error = rssUrlError;
  } else {
    form.valid = true;
    form.error = null;
  }
};

const handleFormSubmit = (event, state) => {
  event.preventDefault();

  const { form, feeds, posts } = state;

  form.state = 'loading';

  const rssUrlError = validateRssUrl(form.url, feeds);

  if (!rssUrlError) {
    axios
      .get(`${corsProxyUrl}/${form.url}`)
      .then(({ data }) => {
        const feed = data |> parse;

        const feedId = uuidv4();

        posts.push(
          ...feed.posts.map((post) => ({
            ...post,
            feedId,
          })),
        );
        feeds.unshift({
          id: feedId,
          title: feed.title,
          description: feed.description,
          url: form.url,
        });
        form.rss = '';
        form.state = 'filling';
      })
      .catch((error) => {
        form.state = 'failed';
        form.error = error.message;
      });
  } else {
    form.state = 'failed';
    form.error = rssUrlError;
  }
};

const fetchPosts = (state) => {
  const { feeds } = state;

  if (feeds.length !== 0) {
    const { posts } = state;

    feeds.forEach((feed) =>
      axios
        .get(`${corsProxyUrl}/${feed.url}`)
        .then(({ data }) => {
          const parsedFeed = data |> parse;

          const newPosts = parsedFeed.posts.map((post) => ({
            ...post,
            feedId: feed.id,
          }));

          const oldPosts = posts.filter((post) => post.feedId === feed.id);

          const postsDiff = _.differenceWith(newPosts, oldPosts, _.isEqual);

          posts.unshift(...postsDiff);
        })
        .catch((err) => {
          console.error(err);
          throw err;
        }));
  }
};

export default () => {
  const state = {
    form: {
      state: 'filling',
      url: '',
      valid: true,
      error: null,
    },
    feeds: [],
    posts: [],
  };

  const elements = {
    title: document.querySelector('.rss-reader__title'),
    description: document.querySelector('.rss-reader__description'),
    form: document.querySelector('.rss-reader__form'),
    rss: document.querySelector('.rss-reader-form__input[name="rss"]'),
    submit: document.querySelector('.rss-reader-form__submit'),
    errorMessage: document.querySelector('.rss-reader__error-message'),
    feeds: document.querySelector('.rss-reader__feeds'),
  };

  i18next
    .init({
      lng: 'en',
      debug: true,
      resources: {
        en,
      },
    })
    .then((t) => {
      const rssReaderTitle = document.querySelector('.rss-reader__title');

      const rssReaderDescription = document.querySelector(
        '.rss-reader__description',
      );

      const rssReaderFormInput = document.querySelector(
        '.rss-reader-form__input[name="rss"]',
      );

      const rssReaderFormSubmit = document.querySelector(
        '.rss-reader-form__submit',
      );

      rssReaderTitle.textContent = t('title');
      rssReaderDescription.textContent = t('description');
      rssReaderFormInput.placeholder = t('form.input.placeholder');
      rssReaderFormSubmit.textContent = t('form.submit.label');

      const watchedState = watch(state, elements);

      elements.rss.addEventListener('input', (event) => {
        handleRssInput(event, watchedState);
      });

      elements.form.addEventListener('submit', (event) => {
        handleFormSubmit(event, watchedState);
      });

      const delay = 5000;

      const request = () => {
        fetchPosts(watchedState);
        setTimeout(request, delay);
      };

      setTimeout(request, delay);
    });
};
