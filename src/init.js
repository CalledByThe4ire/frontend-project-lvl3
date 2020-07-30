/* eslint-disable implicit-arrow-linebreak, no-param-reassign, no-shadow */

import _ from 'lodash';
import * as yup from 'yup';
import onChange from 'on-change';
import handle from './handle';
import query, { subscribe } from './query';
import corsProxy from './utils/cors-proxy';
import './i18n';

export default () => {
  const state = {
    form: {
      process: {
        state: 'filling',
        error: null,
      },
      validity: {
        valid: true,
        error: '',
      },
      input: '',
    },
    rss: {
      feeds: [],
      posts: [],
    },
  };

  const watchedState = onChange(state, (path, value) => handle(path, value));

  const delay = 5000;

  setTimeout(function request() {
    subscribe(watchedState);
    setTimeout(request, delay);
  }, delay);

  const buildSchema = (watchedState) =>
    yup
      .string()
      .required()
      .url()
      .notOneOf(
        watchedState.rss.feeds.map((feed) => {
          const [, url] = feed.url.split(`${corsProxy}`);

          return url;
        }),
      );

  const validate = (value, schema = buildSchema(watchedState)) => {
    try {
      schema.validateSync(value, { abortEarly: false });

      return '';
    } catch (e) {
      return e.message;
    }
  };

  const updateValidationState = (state) => {
    const error = validate(state.form.input);

    state.form.validity.valid = _.isEqual(error, '');
    state.form.validity.error = error;
  };

  const rssReaderForm = document.querySelector('.rss-reader-form');

  const { rss: rssReaderFormInput } = rssReaderForm.elements;

  rssReaderFormInput.addEventListener('input', (e) => {
    watchedState.form.input = e.target.value;
    updateValidationState(watchedState);
  });

  rssReaderForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    const url = formData.get(rssReaderFormInput.name);

    watchedState.form.process.state = 'sending';

    query(`${corsProxy}${url}`, watchedState);
  });
};
