import onChange from 'on-change';
import i18next from 'i18next';

export default (initialState, elements) => {
  const handleInput = (state) => {
    if (state.form.valid) {
      elements.rss.classList.remove('is-invalid');
      elements.rss.classList.add('is-valid');
      elements.errorMessage.classList.add('d-none');
    } else {
      elements.rss.classList.remove('is-valid');
      elements.rss.classList.add('is-invalid');
      elements.errorMessage.classList.remove('d-none');
    }
  };

  const handleErrors = (state) => {
    const { errorMessage } = elements;

    errorMessage.textContent = i18next.t(state.form.error);
  };

  const handleForm = (state) => {
    const { rss, submit } = elements;

    switch (state.form.state) {
      case 'filling': {
        rss.value = state.form.url;
        submit.removeAttribute('disabled');
        break;
      }
      case 'loading': {
        submit.setAttribute('disabled', true);
        break;
      }
      case 'failed': {
        submit.removeAttribute('disabled');
        break;
      }
      default: {
        throw new Error(`Unknown state: '${state.form.state}'!`);
      }
    }
  };

  const handleFeeds = (state) => {
    const { feeds } = elements;

    if (feeds.classList.contains('d-none')) {
      feeds.classList.remove('d-none');
    }

    const html = state.feeds
      .map((feed) => {
        const feedTitle = `<h5 class="card-title feed__title">${feed.title}</h5>`;

        const feedDescription = `<p class="card-text feed__description">${feed.description}</p>`;

        const feedPosts = state.posts
          .filter((post) => post.feedId === feed.id)
          .map(
            (post) => `<a href='${post.link}' class="list-group-item list-group-item-action posts__item">${post.title}</a>`,
          )
          .join('\n');

        return `
          <div class="card mb-4 feeds__item feed">
            <div class="card-body feed__body">${feedTitle}${feedDescription}</div>
            <ul class="list-group list-group-flush feed__posts posts">${feedPosts}</ul>
          </div>
        `;
      })
      .join('\n');

    feeds.innerHTML = html;
  };

  const watchedState = onChange(initialState, (path) => {
    switch (path) {
      case 'form.valid': {
        handleInput(initialState);
        break;
      }
      case 'form.state': {
        handleForm(initialState);
        break;
      }
      case 'form.error': {
        handleErrors(initialState);
        break;
      }
      case 'feeds':
      case 'posts': {
        handleFeeds(initialState);
        break;
      }
      default: {
        break;
      }
    }
  });

  return watchedState;
};
