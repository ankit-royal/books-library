let books = [];
let currentPage = 1;
let isLoading = false;
let hasMore = true;
let isGridView = true;
let searchTerm = '';
let sortOption = 'title';
let lastScrollTop = 0;
let showHeader = true;

const booksContainer = document.getElementById('books-container');
const loader = document.getElementById('loader');
const noResults = document.getElementById('no-results');
const endMessage = document.getElementById('end-message');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const sortSelect = document.getElementById('sort-select');
const gridViewBtn = document.getElementById('grid-view-button');
const listViewBtn = document.getElementById('list-view-button');
const mainHeader = document.getElementById('main-header');

document.addEventListener('DOMContentLoaded', init);
searchInput.addEventListener('keyup', event => {
  if (event.key === 'Enter') handleSearch();
});
searchButton.addEventListener('click', handleSearch);
sortSelect.addEventListener('change', handleSortChange);
gridViewBtn.addEventListener('click', () => setViewMode(true));
listViewBtn.addEventListener('click', () => setViewMode(false));
window.addEventListener('scroll', handleScroll);

function init() {
  loadBooks();
}

function setViewMode(grid) {
  isGridView = grid;
  if (grid) {
    booksContainer.className = 'grid-view';
    gridViewBtn.classList.add('active');
    listViewBtn.classList.remove('active');
  } else {
    booksContainer.className = 'list-view';
    listViewBtn.classList.add('active');
    gridViewBtn.classList.remove('active');
  }
  renderBooks();
}

function handleSearch() {
  const newSearchTerm = searchInput.value.trim().toLowerCase();
  if (newSearchTerm === searchTerm && newSearchTerm !== '') return;
  searchTerm = newSearchTerm;
  currentPage = 1;
  hasMore = true;
  books = [];
  booksContainer.innerHTML = '';
  loadBooks();
}

function handleSortChange() {
  const newSortOption = sortSelect.value;
  if (newSortOption === sortOption) return;
  sortOption = newSortOption;
  sortBooks();
  renderBooks();
}

function handleScroll() {
  const st = window.scrollY;
  if (st > lastScrollTop + 10 && showHeader) {
    showHeader = false;
    mainHeader.style.transform = 'translateY(-100%)';
  } else if (st < lastScrollTop - 10 && !showHeader) {
    showHeader = true;
    mainHeader.style.transform = 'translateY(0)';
  }
  lastScrollTop = st <= 0 ? 0 : st;
  if (
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 &&
    hasMore &&
    !isLoading
  ) {
    loadMoreBooks();
  }
}

function loadMoreBooks() {
  currentPage++;
  loadBooks();
}

async function loadBooks() {
  if (isLoading || !hasMore) return;
  isLoading = true;
  loader.classList.remove('hidden');
  noResults.classList.add('hidden');
  endMessage.classList.add('hidden');

  try {
    const pageLimit = 10;
    const response = await fetch(
      `https://api.freeapi.app/api/v1/public/books?page=${currentPage}&limit=${pageLimit}`
    );
    const data = await response.json();
    const newBooks = data?.data?.data ?? [];
    hasMore = newBooks.length === pageLimit;

    if (newBooks.length === 0) {
      hasMore = false;
      if (books.length === 0) {
        noResults.classList.remove('hidden');
      } else {
        endMessage.classList.remove('hidden');
      }
    } else {
      const filteredBooks = searchTerm
        ? newBooks.filter(book => {
            const title = book.volumeInfo?.title?.toLowerCase() || '';
            const authors = book.volumeInfo?.authors
              ? book.volumeInfo.authors.join(' ').toLowerCase()
              : '';
            return title.includes(searchTerm) || authors.includes(searchTerm);
          })
        : newBooks;
      books = [...books, ...filteredBooks];
      sortBooks();
      renderBooks();
      if (!hasMore) {
        endMessage.classList.remove('hidden');
      }
    }
  } catch (error) {
    console.error('Error fetching books:', error);
    hasMore = false;
  } finally {
    isLoading = false;
    loader.classList.add('hidden');
  }
}

function sortBooks() {
  if (!books.length) return;
  switch (sortOption) {
    case 'title':
      books.sort((a, b) =>
        (a.volumeInfo?.title || '').localeCompare(b.volumeInfo?.title || '')
      );
      break;
    case 'publishedDate':
      books.sort((a, b) => {
        const dateA = a.volumeInfo?.publishedDate
          ? new Date(a.volumeInfo.publishedDate)
          : new Date(0);
        const dateB = b.volumeInfo?.publishedDate
          ? new Date(b.volumeInfo.publishedDate)
          : new Date(0);
        return dateB - dateA;
      });
      break;
    case 'author':
      books.sort((a, b) =>
        (a.volumeInfo?.authors ? a.volumeInfo.authors[0] : '').localeCompare(
          b.volumeInfo?.authors ? b.volumeInfo.authors[0] : ''
        )
      );
      break;
  }
}

function renderBooks() {
  booksContainer.innerHTML = '';
  books.forEach((book, index) => {
    const bookEl = createBookElement(book, index);
    booksContainer.appendChild(bookEl);
  });
}

function createEl(tag, { className = '', text = '', attributes = {} } = {}) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  Object.keys(attributes).forEach(attr => {
    el.setAttribute(attr, attributes[attr]);
  });
  return el;
}

function createBookElement(book, index) {
  const bookEl = createEl('div', {
    className: `${isGridView ? 'book-card grid-card' : 'book-card list-card'} slide-up`
  });
  bookEl.style.animationDelay = `${index * 0.05}s`;

  const coverEl = createEl('div', { className: 'book-cover' });
  const imgEl = createEl('img', {
    attributes: {
      src: book.volumeInfo?.imageLinks?.thumbnail || 'https://placehold.co/200x300/e5e7eb/a1a1aa?text=No+Image',
      alt: book.volumeInfo?.title || 'Book cover',
      loading: 'lazy'
    }
  });
  coverEl.appendChild(imgEl);

  const infoEl = createEl('div', { className: 'book-info' });
  const titleEl = createEl('h2', {
    className: 'book-title',
    text: book.volumeInfo?.title || 'Unknown Title'
  });
  const authorEl = createEl('p', {
    className: 'book-author',
    text: book.volumeInfo?.authors ? `by ${book.volumeInfo.authors.join(', ')}` : 'Unknown Author'
  });
  const publisherEl = createEl('p', {
    className: 'book-publisher',
    text: book.volumeInfo?.publisher || 'Unknown Publisher'
  });
  const dateEl = createEl('p', {
    className: 'book-date',
    text: book.volumeInfo?.publishedDate ? formatDate(book.volumeInfo.publishedDate) : 'Unknown Date'
  });

  infoEl.append(titleEl, authorEl, publisherEl, dateEl);
  bookEl.append(coverEl, infoEl);

  if (book.volumeInfo.infoLink) {
    bookEl.style.cursor = 'pointer';
    bookEl.addEventListener('click', () => window.open(book.volumeInfo.infoLink, '_blank'));
  }
  return bookEl;
}

function formatDate(dateString) {
  if (!dateString) return 'Unknown Date';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}