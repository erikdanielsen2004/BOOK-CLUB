import { useEffect, useState } from "react";
import "../styles/BookModal.css";

export type ShelfStatus = "has_read" | "currently_reading" | "want_to_read";

export interface BookModalData {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  coverColor: string;
  status: ShelfStatus;
  review?: string;
  rating?: number;
  totalPages?: number;
}

interface BookModalProps {
  book: BookModalData;
  onClose: () => void;
  onSave: (updated: BookModalData) => void;
}

const StarRating: React.FC<{
  rating: number;
  onChange: (r: number) => void;
}> = ({ rating, onChange }) => {
  const [hovered, setHovered] = useState(0);
  const displayValue = hovered || rating;

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= displayValue;

        return (
          <button
            key={star}
            type="button"
            className={`star ${filled ? "star--filled" : ""}`}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            aria-label={`Rate ${star} out of 5`}
          >
            <span className="star__glyph">★</span>
          </button>
        );
      })}
    </div>
  );
};

const BookModal: React.FC<BookModalProps> = ({ book, onClose, onSave }) => {
  const [status, setStatus] = useState<ShelfStatus>(book.status);
  const [review, setReview] = useState(book.review ?? "");
  const [rating, setRating] = useState(book.rating ?? 0);

  useEffect(() => {
    setStatus(book.status);
    setReview(book.review ?? "");
    setRating(book.rating ?? 0);
  }, [book]);

  const statusOptions: { value: ShelfStatus; label: string }[] = [
    { value: "has_read", label: "Has Read" },
    { value: "currently_reading", label: "Currently Reading" },
    { value: "want_to_read", label: "Want to Read" },
  ];

  const handleSave = () => {
    onSave({ ...book, status, review, rating });
    onClose();
  };

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal" role="dialog" aria-modal="true">
        <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>

        <div className="modal__header">
          <div className="modal__cover" style={{ background: book.coverColor }}>
            {book.coverUrl && <img src={book.coverUrl} alt={book.title} />}
          </div>
          <div className="modal__book-info">
            <h2 className="modal__title">{book.title}</h2>
            <p className="modal__author">{book.author}</p>
          </div>
        </div>

        <div className="modal__section">
          <label className="modal__label">Reading Status</label>
          <div className="modal__status-options">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`status-btn ${status === opt.value ? "status-btn--active" : ""}`}
                onClick={() => setStatus(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="modal__section">
          <label className="modal__label">Your Rating</label>
          <StarRating rating={rating} onChange={setRating} />
        </div>

        <div className="modal__section">
          <label className="modal__label" htmlFor="review">Your Review</label>
          <textarea
            id="review"
            className="modal__textarea"
            placeholder="Write your thoughts about this book..."
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={4}
          />
        </div>

        <div className="modal__actions">
          <button className="modal__btn modal__btn--cancel" onClick={onClose}>Cancel</button>
          <button className="modal__btn modal__btn--save" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default BookModal;
