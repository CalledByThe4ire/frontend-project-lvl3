export default (data) => {
  const parser = new DOMParser();

  const doc = parser.parseFromString(data, 'text/xml');

  const error = doc.querySelector('parsererror');

  if (error) {
    throw new Error(error.textContent);
  }

  const title = doc.querySelector('title').textContent;

  const description = doc.querySelector('description').textContent;

  const posts = [...doc.querySelectorAll('item')].map((post) => ({
    title: post.querySelector('title').textContent,
    link: post.querySelector('link').textContent,
  }));

  return {
    title,
    description,
    posts,
  };
};
