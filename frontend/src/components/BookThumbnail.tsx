
import { useEffect, useState } from 'react';
import styles from '../styles/BookThumbnail.module.css';

function BookThumbnail() {
    const [books, setBooks] = useState<Book[]>([]);

    useEffect(() => {

      if (books.length > 0) return;

        const randomOffset = Math.floor(Math.random() * 150);
        
      const apiKey = process.env.REACT_APP_BOOKS_API_KEY;
      const url = `https://www.googleapis.com/books/v1/volumes?q=subject:fiction&startIndex=${randomOffset}&key=${apiKey}&maxResults=40`;

      fetch(url)
        .then(res => res.json())
        .then(data => {
           if (data.items) {
               
               const filtered = data.items.filter((book: any) => {
                         const thumb = book.volumeInfo.imageLinks?.thumbnail;
                         
                         return (
                                 thumb && !thumb.includes("id=mqM") && !thumb.includes("availability") &&
                                 !thumb.includes("google_books_unknown")
                                 );
                       });
             setBooks(filtered.slice(0,3));
           }
        });
    }, []);

  return (
    <div className={styles.bookGrid}>
      {books.map((book) => {
        const thumb = book.volumeInfo.imageLinks?.thumbnail;
        if (!thumb) return null;
          const placeholder = '/image.png';
        return (
          <img
            key={book.id}
            src={thumb ? thumb.replace('http://', 'https://').replace('&zoom=1','&zoom=2') : placeholder}
            alt={book.volumeInfo.title}
            className={styles.bookCover}
          />
        );
      })}
    </div>
  );
}

export default BookThumbnail;
