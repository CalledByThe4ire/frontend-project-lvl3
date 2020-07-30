/* eslint-disable implicit-arrow-linebreak, no-param-reassign, no-shadow */

import _ from 'lodash';
import * as yup from 'yup';
import onChange from 'on-change';
import actions from './actions';
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

  const watchedState = onChange(state, (path, value) => actions(path, value));

  const delay = 5000;

  setTimeout(function request() {
    subscribe(watchedState);
    setTimeout(request, delay);
  }, delay);

  const schema = yup
    .string()
    .required()
    .url()
    .test(
      'isUnique',
      'rss already exists!',
      (value) =>
        !watchedState.rss.feeds
          .map((feed) => feed.url)
          .includes(`${corsProxy}${value}`),
    );

  const validate = (value) => {
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

  const rssReaderInput = rssReaderForm.querySelector('.rss-reader-form__input');

  rssReaderInput.addEventListener('input', (e) => {
    watchedState.form.input = e.target.value;
    updateValidationState(watchedState);
  });

  rssReaderForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    const url = formData.get(rssReaderInput.name);

    watchedState.form.process.state = 'sending';

    query(`${corsProxy}${url}`, watchedState);
  });
};
