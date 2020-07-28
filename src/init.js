/* eslint-disable implicit-arrow-linebreak, no-param-reassign, no-shadow */

import _ from 'lodash';
import * as yup from 'yup';
import onChange from 'on-change';
import actions from './actions';
import queries, { subscribe } from './queries';
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
        errors: {},
      },
      fields: {
        rss: '',
      },
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

  const schema = yup.object().shape({
    rss: yup
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
      ),
  });

  const validate = (fields) => {
    try {
      schema.validateSync(fields, { abortEarly: false });

      return {};
    } catch (e) {
      return _.keyBy(e.inner, 'path');
    }
  };

  const updateValidationState = (state) => {
    const errors = validate(state.form.fields);

    state.form.validity.valid = _.isEqual(errors, {});
    state.form.validity.errors = errors;
  };

  try {
    const form = document.forms[0];

    const { rss } = form.elements;

    rss.addEventListener('input', (e) => {
      watchedState.form.fields[rss.name] = e.target.value;
      updateValidationState(watchedState);
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);

      const url = formData.get(rss.name);

      watchedState.form.process.state = 'sending';

      queries(`${corsProxy}${url}`, watchedState);
    });
  } catch (err) {
    throw new Error(err.message);
  }
};
