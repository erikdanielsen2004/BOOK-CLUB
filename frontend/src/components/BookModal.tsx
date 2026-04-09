import { useState } from "react";
import "../styles/BookModal.css";

// Types
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
  totalPages?: number; //
}

interface BookModalProps {
  book: BookModalData;
  onClose: () => void;
  onSave: (updated: BookModalData) => void;
}

//Star Rating
const StarRating: React.FC<{
  rating: number;
  onChange: (r: number) => void;
}> = ({ rating, onChange }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star ${star <= (hovered || rating) ? "star--filled" : ""}`}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          aria-label={`Rate ${star} out of 5`}
        >★</button>
      ))}
    </div>
  );
};

// Book Modal
const BookModal: React.FC<BookModalProps> = ({ book, onClose, onSave }) => {
  const [status,      setStatus]      = useState<ShelfStatus>(book.status);
  const [review,      setReview]      = useState(book.review      ?? "");
  const [rating,      setRating]      = useState(book.rating      ?? 0);
  const statusOptions: { value: ShelfStatus; label: string }[] = [
    { value: "has_read",          label: "Has Read" },
    { value: "currently_reading", label: "Currently Reading" },
    { value: "want_to_read",      label: "Want to Read" },
  ];

  const handleSave = () => {

    //API






    onSave({ ...book, status, review, rating});
    onClose();
  };

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal" role="dialog" aria-modal="true">
        <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>

        {/* Book header */}
        <div className="modal__header">
          <div className="modal__cover" style={{ background: book.coverColor }}>
            {book.coverUrl && <img src={book.coverUrl} alt={book.title} />}
          </div>
          <div className="modal__book-info">
            <h2 className="modal__title">{book.title}</h2>
            <p className="modal__author">{book.author}</p>
          </div>
        </div>

        {/* Status */}
        <div className="modal__section">
          <label className="modal__label">Reading Status</label>
          <div className="modal__status-options">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`status-btn ${status === opt.value ? "status-btn--active" : ""}`}
                onClick={() => setStatus(opt.value)}
              >{opt.label}</button>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div className="modal__section">
          <label className="modal__label">Your Rating</label>
          <StarRating rating={rating} onChange={setRating} />
        </div>

        {/* Review */}
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

        {/* Actions */}
        <div className="modal__actions">
          <button className="modal__btn modal__btn--cancel" onClick={onClose}>Cancel</button>
          <button className="modal__btn modal__btn--save"   onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default BookModal;