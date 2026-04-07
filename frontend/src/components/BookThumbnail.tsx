import { useEffect, useState } from 'react';
import styles from '../styles/BookThumbnail.module.css';

type OpenLibraryBook = {
  key: string;
  title: string;
  cover_i?: number;
};

function BookThumbnail() {
  const [books, setBooks] = useState<OpenLibraryBook[]>([]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const page = Math.floor(Math.random() * 10) + 1;
        const url = `https://openlibrary.org/search.json?subject=fiction&language=eng&page=${page}&limit=30&fields=key,title,cover_i`;

        const res = await fetch(url);
        const data = await res.json();

        if (!data.docs) return;

        const filtered = data.docs.filter(
          (book: OpenLibraryBook) => book.cover_i && book.title
        );

        const shuffled = [...filtered].sort(() => Math.random() - 0.5);

        setBooks(shuffled.slice(0, 3));
      } catch (err) {
        console.error('Error fetching Open Library books:', err);
      }
    };

    fetchBooks();
  }, []);

  return (
    <div className={styles.bookGrid}>
      {books.map((book, index) => {
        const coverUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;

        return (
          <img
            key={book.key}
            src={coverUrl}
            alt={book.title}
            className={`${styles.bookCover} ${styles[`book${index + 1}`]}`}
            onError={(e) => {
              e.currentTarget.src = '/image.png';
            }}
          />
        );
      })}
    </div>
  );
}

export default BookThumbnail;
