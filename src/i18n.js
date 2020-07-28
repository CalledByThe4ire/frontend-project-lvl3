import i18next from 'i18next';
import ru from './locales/ru';

i18next
  .init({
    lng: 'ru',
    debug: true,
    resources: {
      ...ru,
    },
  })
  .then((t) => {
    const appTitle = document.querySelector('.jumbotron__title');

    const appLead = document.querySelector('.jumbotron__lead');

    const rssReaderFormInput = document.querySelector(
      '.rss-reader-form input[name="rss"]',
    );

    const rssReaderFormSubmit = document.querySelector(
      '.rss-reader-form button[type="submit"]',
    );

    appTitle.textContent = t('app.title');
    appLead.textContent = t('app.lead');
    rssReaderFormInput.placeholder = t(
      'app.rssReaderForm.rss.placeholder',
    );
    rssReaderFormSubmit.textContent = t(
      'app.rssReaderForm.submit.value',
    );
  });
