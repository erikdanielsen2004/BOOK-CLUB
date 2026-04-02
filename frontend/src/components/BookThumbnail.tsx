
import { useEffect, useState } from 'react';
import styles from '../styles/BookThumbnail.module.css';

interface Book {
  id: string;
  volumeInfo: {
    title: string;
    imageLinks?: {
      thumbnail: string;
    };
  };
}

function BookThumbnail() {
    const [books, setBooks] = useState<Book[]>([]);

    useEffect(() => {

      if (books.length > 0) return;

      const apiKey = import.meta.env.VITE_BOOKS_API_KEY;
      const url = `https://www.googleapis.com/books/v1/volumes?q=subject:fiction&key=${apiKey}&maxResults=3`;

      fetch(url)
        .then(res => res.json())
        .then(data => {
           if (data.items) {
             setBooks(data.items);
           }
        });
    }, []);

  return (
    <div className={styles.bookGrid}>
      {books.map((book) => {
        const thumb = book.volumeInfo.imageLinks?.thumbnail;
        if (!thumb) return null;

        return (
          <img
            key={book.id}
            src={thumb.replace('http://', 'https://')}
            alt={book.volumeInfo.title}
            className={styles.bookCover}
          />
        );
      })}
    </div>
  );
}

export default BookThumbnail;
