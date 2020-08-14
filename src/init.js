/* eslint-disable implicit-arrow-linebreak */

import _ from 'lodash';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import * as yup from 'yup';
import i18next from 'i18next';
import { en } from './locales';
import parse from './parser';
import watch from './watcher';

const corsProxyUrl = 'https://cors-anywhere.herokuapp.com';

const delay = 5000;

const errorsMapping = {
  url: 'form.input.errors.url',
  exists: 'form.input.errors.exists',
  required: 'form.input.errors.required',
  none: null,
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

const handleFormSubmit = async (event, state) => {
  event.preventDefault();

  const { form, feeds, posts } = state;

  const formData = new FormData(event.target);

  form.url = formData.get('rss');

  form.state = 'loading';

  const rssUrlError = validateRssUrl(form.url, feeds);

  if (rssUrlError === errorsMapping.none) {
    form.valid = true;

    try {
      const { data } = await axios.get(`${corsProxyUrl}/${form.url}`);

      const feed = data |> parse;

      const feedId = uuidv4();

      const mappedPosts = feed.posts.map((post) => ({
        ...post,
        feedId,
      }));

      posts.push(...mappedPosts);
      feeds.unshift({
        id: feedId,
        title: feed.title,
        description: feed.description,
        url: form.url,
      });
      form.rss = '';
      form.state = 'filling';
    } catch (error) {
      form.valid = false;
      form.state = 'failed';
      form.error = error.message;
    }
  } else {
    form.valid = false;
    form.state = 'failed';
    form.error = rssUrlError;
  }
};

const fetchPosts = (state) => {
  const { feeds } = state;

  if (feeds.length !== 0) {
    const { posts } = state;

    const promises = feeds.map(async (feed) => {
      const { data } = await axios.get(`${corsProxyUrl}/${feed.url}`);

      const parsedFeed = data |> parse;

      const newPosts = parsedFeed.posts.map((post) => ({
        ...post,
        feedId: feed.id,
      }));

      const oldPosts = posts.filter((post) => post.feedId === feed.id);

      const postsDiff = _.differenceWith(newPosts, oldPosts, _.isEqual);

      posts.unshift(...postsDiff);
    });

    Promise.all(promises).finally(() => {
      setTimeout(() => {
        fetchPosts(state);
      }, delay);
    });
  }
};

export default async () => {
  const state = {
    form: {
      state: 'filling',
      url: '',
      valid: true,
      error: errorsMapping.none,
    },
    feeds: [],
    posts: [],
  };

  const elements = {
    title: document.querySelector('#rss-reader-title'),
    description: document.querySelector('#rss-reader-description'),
    form: document.querySelector('#rss-reader-form'),
    rss: document.querySelector('#rss-reader-form-input'),
    submit: document.querySelector('#rss-reader-form-submit'),
    errorMessage: document.querySelector('#rss-reader-error-message'),
    feeds: document.querySelector('#rss-reader-feeds'),
  };

  const t = await i18next.init({
    lng: 'en',
    debug: true,
    resources: {
      en,
    },
  });

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

  elements.form.addEventListener('submit', (event) => {
    handleFormSubmit(event, watchedState);
  });

  setTimeout(() => {
    fetchPosts(watchedState);
  }, delay);
};
