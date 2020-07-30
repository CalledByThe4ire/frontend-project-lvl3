/* eslint-disable implicit-arrow-linebreak  */

const formProcessStateHandler = (form, value) => {
  const { rss, submit } = form.elements;

  switch (value) {
    case 'failed':
      submit.disabled = false;
      break;

    case 'filling':
      submit.disabled = false;
      break;

    case 'sending':
      submit.disabled = true;
      submit.className = 'btn btn-outline-secondary';
      rss.className = 'form-control';
      break;

    case 'finished':
      submit.disabled = false;
      rss.value = '';
      break;

    default:
      throw new Error(`Unknown state: ${value}`);
  }
};

const formValidityHandler = (form, value) => {
  const { submit } = form.elements;

  submit.disabled = !value;

  if (value) {
    submit.classList.remove('btn-outline-danger');
    submit.classList.add('btn-outline-success');
  } else {
    submit.classList.remove('btn-outline-success');
    submit.classList.add('btn-outline-danger');
  }
};

const formErrorsHandler = (form, error) => {
  const { rss } = form.elements;

  const rssContainer = rss.parentElement;

  const errorElement = rssContainer.nextElementSibling;

  if (errorElement) {
    rss.classList.remove('is-invalid');
    rss.classList.add('is-valid');
    rssContainer.classList.remove('is-invalid');
    rssContainer.classList.add('is-valid');
    errorElement.remove();
  }

  if (error) {
    const feedbackElement = document.createElement('div');

    feedbackElement.classList.add('invalid-feedback');
    feedbackElement.innerHTML = error;
    rss.classList.remove('is-valid');
    rss.classList.add('is-invalid');
    rssContainer.classList.remove('is-valid');
    rssContainer.classList.add('is-invalid');
    rssContainer.after(feedbackElement);
  }
};

const feedsHandler = (container, { feeds, posts }) => {
  const feedsContainer = container;

  if (feeds.length !== 0) {
    feedsContainer.innerHTML = '';

    feeds.forEach((feed) => {
      const {
        title: feedTitle,
        description: feedDescription,
        id: feedId,
      } = feed;

      const filteredPosts = posts.filter((post) => post.feedId === feedId);

      const mappedPosts = filteredPosts.length !== 0
        && filteredPosts.map(({ title: postTitle, href: postHref }) => {
          const postLink = document.createElement('a');

          postLink.className = 'list-group-item list-group-item-action posts__item';
          postLink.href = postHref;
          postLink.textContent = postTitle;

          return postLink;
        });

      let postsContainer = null;

      if (mappedPosts.length !== 0) {
        postsContainer = document.createElement('ul');

        postsContainer.className = 'list-group list-group-flush feed__posts posts';

        postsContainer.append(...mappedPosts);
      }

      const card = document.createElement('div');

      card.className = 'card mb-4 feeds__item feed';

      card.innerHTML = `
<div class="card-body feed__body">
<h5 class="card-title feed__title">${feedTitle}</h5>
<p class="card-text feed__description">${feedDescription}</p>
</div>`;

      if (postsContainer) {
        card.append(postsContainer);
      }

      feedsContainer.append(card);
    });
  }
};

export default (path, value) => {
  try {
    const [name] = path.split('.');

    const element = document.querySelector(`[data-state=${name}]`);

    switch (path) {
      case 'form.process.state':
        formProcessStateHandler(element, value);
        break;

      case 'form.process.error':
      case 'form.validity.error':
        formErrorsHandler(element, value);
        break;

      case 'form.validity.valid':
        formValidityHandler(element, value);
        break;

      case 'rss':
        feedsHandler(element, value);
        break;

      default:
        break;
    }
  } catch (err) {
    throw new Error(err.message);
  }
};
