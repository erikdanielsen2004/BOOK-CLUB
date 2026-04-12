import { useEffect, useState } from 'react';
import styles from '../styles/BookThumbnail.module.css';

type OpenLibraryBook = {
  key: string;
  title: string;
  cover_i?: number;
};

function BookThumbnail({ isLoginPage = false }: { isLoginPage?: boolean }) {
  const [books, setBooks] = useState<OpenLibraryBook[]>([]);

  useEffect(() => {
    if (isLoginPage) return;

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
  }, [isLoginPage]);

  if (!isLoginPage) {
    return (
      <div className={styles.bookGrid}>
        {books.length > 0 ? (
          books.map((book, index) => (
            <img
              key={book.key}
              src={`https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`}
              alt={book.title}
              className={`${styles.bookCover} ${styles[`book${index + 1}`]}`}
              loading="lazy"
              decoding="async"
            />
          ))
        ) : (
          <>
            <div className={`${styles.bookCover} ${styles.book1}`} />
            <div className={`${styles.bookCover} ${styles.book2}`} />
            <div className={`${styles.bookCover} ${styles.book3}`} />
          </>
        )}
      </div>
    );
  }

  return (
    <div className={styles.loginSplitGrid}>
      <div className={`${styles.bookWrapper} ${styles.leftCutoff}`}>
        <img src="/logo.png" alt="decorative book" className={styles.loginBookCover} loading="eager" decoding="async" />
      </div>

      <div className={`${styles.bookWrapper} ${styles.rightCutoff}`}>
        <img src="/logo.png" alt="decorative book" className={styles.loginBookCover} loading="eager" decoding="async" />
      </div>
    </div>
  );
}

export default BookThumbnail;
