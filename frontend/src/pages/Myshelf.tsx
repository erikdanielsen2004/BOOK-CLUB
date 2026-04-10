const BookCard: React.FC<{
  book: Book;
  onMove: (target: "hasRead" | "reading" | "wantsToRead") => void;
  onRemove: () => void;
}> = ({ book, onMove, onRemove }) => (
  <div className="shelf-book">
    <div className="shelf-book__cover">
      {book.coverUrl ? (
        <img src={book.coverUrl} alt={book.title} />
      ) : (
        <div
          className="shelf-book__cover-placeholder"
          style={{ background: book.coverColor }}
        />
      )}
    </div>

    <div className="shelf-book__info">
      <p className="shelf-book__title">{book.title}</p>
      <p className="shelf-book__author">{book.author}</p>

      <div className="shelf-book__actions">
        <button type="button" className="shelf-book__btn" onClick={() => onMove("hasRead")}>Has read</button>
        <button type="button" className="shelf-book__btn" onClick={() => onMove("reading")}>Reading</button>
        <button type="button" className="shelf-book__btn" onClick={() => onMove("wantsToRead")}>Want to read</button>
        <button type="button" className="shelf-book__btn shelf-book__btn--danger" onClick={onRemove}>Remove</button>
      </div>
    </div>
  </div>
);
