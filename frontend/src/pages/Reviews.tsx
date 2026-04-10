import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar.tsx";
import "../styles/Reviews.css";

type UserData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type Book = {
  _id: string;
  title: string;
  authors?: string[];
  thumbnail?: string;
  averageRating?: number;
  ratingsCount?: number;
};

type ReviewItem = {
  _id: string;
  rating: number;
  reviewText: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
  };
};

const getStoredUser = (): UserData | null => {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const renderStars = (rating: number) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
};

const HalfStarInput: React.FC<{
  value: number;
  onChange: (value: number) => void;
}> = ({ value, onChange }) => {
  const [hoverValue, setHoverValue] = useState(0);
  const displayValue = hoverValue || value;

  return (
    <div className="reviews-stars-input">
      {[1, 2, 3, 4, 5].map((star) => {
        const leftValue = star - 0.5;
        const rightValue = star;

        const leftFilled = displayValue >= leftValue;
        const rightFilled = displayValue >= rightValue;

        return (
          <div key={star} className="reviews-stars-input__star-wrap">
            <span className={`reviews-stars-input__star ${leftFilled ? "filled" : ""}`}>★</span>
            <button
              type="button"
              className="reviews-stars-input__half reviews-stars-input__half--left"
              onMouseEnter={() => setHoverValue(leftValue)}
              onMouseLeave={() => setHoverValue(0)}
              onClick={() => onChange(leftValue)}
            />
            <button
              type="button"
              className="reviews-stars-input__half reviews-stars-input__half--right"
              onMouseEnter={() => setHoverValue(rightValue)}
              onMouseLeave={() => setHoverValue(0)}
              onClick={() => onChange(rightValue)}
            />
            <span className={`reviews-stars-input__star reviews-stars-input__star--overlay ${rightFilled ? "filled" : ""}`}>★</span>
          </div>
        );
      })}
      <span className="reviews-stars-input__value">{displayValue.toFixed(1)}</span>
    </div>
  );
};

const ReviewsPage: React.FC = () => {
  const user = useMemo(() => getStoredUser(), []);
  const [bookSearch, setBookSearch] = useState("");
  const [reviewableSearch, setReviewableSearch] = useState("");
  const [reviewedBooks, setReviewedBooks] = useState<Book[]>([]);
  const [reviewableBooks, setReviewableBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(4.5);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState<"success" | "error" | "">("");

  const searchReviewedBooks = async (q = "") => {
    try {
      const res = await fetch(`/api/book-reviews/search-books?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) return;
      setReviewedBooks(data.books || []);
    } catch {}
  };

  const searchReviewableBooks = async (q = "") => {
    if (!user?.id) return;

    try {
      const res = await fetch(`/api/book-reviews/reviewable/${user.id}?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) return;
      setReviewableBooks(data.books || []);
    } catch {}
  };

  const loadBookReviews = async (bookId: string, nextSort = sort, nextPage = page) => {
    try {
      const res = await fetch(`/api/book-reviews/view/${bookId}?sort=${encodeURIComponent(nextSort)}&page=${nextPage}`);
      const data = await res.json();
      if (!res.ok) return;

      setSelectedBook(data.book);
      setReviews(data.reviews || []);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || 1);
    } catch {}
  };

  useEffect(() => {
    searchReviewedBooks("");
    searchReviewableBooks("");
  }, []);

  useEffect(() => {
    if (selectedBook?._id) {
      loadBookReviews(selectedBook._id, sort, page);
    }
  }, [sort, page]);

  const handleCreateReview = async (bookId: string) => {
    if (!user?.id) return;

    try {
      const res = await fetch(`/api/book-reviews/create/${bookId}/${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, reviewText })
      });

      const data = await res.json();

      if (!res.ok) {
        setNotice(data.message || "Could not create review.");
        setNoticeType("error");
        return;
      }

      setNotice("Review created successfully.");
      setNoticeType("success");
      setReviewText("");
      setRating(4.5);

      await searchReviewedBooks(bookSearch);
      await searchReviewableBooks(reviewableSearch);
      await loadBookReviews(bookId, "newest", 1);
      setSort("newest");
      setPage(1);
    } catch {
      setNotice("Could not create review.");
      setNoticeType("error");
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!user?.id || !selectedBook?._id) return;

    try {
      const res = await fetch(`/api/book-reviews/delete/${user.id}/${reviewId}`, {
        method: "DELETE"
      });

      const data = await res.json();

      if (!res.ok) {
        setNotice(data.message || "Could not delete review.");
        setNoticeType("error");
        return;
      }

      setNotice("Review deleted successfully.");
      setNoticeType("success");

      await searchReviewedBooks(bookSearch);
      await searchReviewableBooks(reviewableSearch);
      await loadBookReviews(selectedBook._id, sort, 1);
      setPage(1);
    } catch {
      setNotice("Could not delete review.");
      setNoticeType("error");
    }
  };

  return (
    <div className="reviews-layout">
      <Sidebar />

      <div className="reviews-main">
        <h1 className="reviews-heading">Reviews</h1>

        {notice && (
          <div className={`reviews-notice ${noticeType === "success" ? "reviews-notice--success" : "reviews-notice--error"}`}>
            {notice}
          </div>
        )}

        <div className="reviews-top-grid">
          <section className="reviews-panel">
            <h2 className="reviews-panel__title">Search reviewed books</h2>
            <div className="reviews-searchbar">
              <input
                type="text"
                placeholder="Search books with reviews..."
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
              />
              <button type="button" onClick={() => searchReviewedBooks(bookSearch)}>
                Search
              </button>
            </div>

            <div className="reviews-book-list">
              {reviewedBooks.map((book) => (
                <button
                  key={book._id}
                  type="button"
                  className="reviews-book-list__item"
                  onClick={() => {
                    setSort("newest");
                    setPage(1);
                    loadBookReviews(book._id, "newest", 1);
                  }}
                >
                  <div className="reviews-book-list__title">{book.title}</div>
                  <div className="reviews-book-list__meta">
                    {(book.averageRating || 0).toFixed(2)} · {renderStars(book.averageRating || 0)} · {book.ratingsCount || 0} reviews
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="reviews-panel">
            <h2 className="reviews-panel__title">Write a review</h2>
            <div className="reviews-searchbar">
              <input
                type="text"
                placeholder="Search your Has Read books..."
                value={reviewableSearch}
                onChange={(e) => setReviewableSearch(e.target.value)}
              />
              <button type="button" onClick={() => searchReviewableBooks(reviewableSearch)}>
                Search
              </button>
            </div>

            <div className="reviews-book-list">
              {reviewableBooks.map((book) => (
                <div key={book._id} className="reviews-book-list__card">
                  <div className="reviews-book-list__title">{book.title}</div>
                  <div className="reviews-book-list__meta">{(book.authors || []).join(", ") || "Unknown"}</div>

                  <div className="reviews-form">
                    <HalfStarInput value={rating} onChange={setRating} />
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Write your review..."
                    />
                    <button type="button" onClick={() => handleCreateReview(book._id)}>
                      Submit review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {selectedBook && (
          <section className="reviews-view">
            <div className="reviews-view__header">
              <div>
                <h2 className="reviews-view__title">{selectedBook.title}</h2>
                <div className="reviews-view__rating">
                  <span className="reviews-view__rating-number">{(selectedBook.averageRating || 0).toFixed(2)}</span>
                  <span className="reviews-view__rating-stars">{renderStars(selectedBook.averageRating || 0)}</span>
                  <span className="reviews-view__rating-count">({selectedBook.ratingsCount || 0} reviews)</span>
                </div>
              </div>

              <select
                className="reviews-sort"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
              >
                <option value="newest">Newest to oldest</option>
                <option value="oldest">Oldest to newest</option>
                <option value="rating_desc">Best to worst</option>
                <option value="rating_asc">Worst to best</option>
              </select>
            </div>

            <div className="reviews-list">
              {reviews.map((review) => (
                <div key={review._id} className="reviews-item">
                  <div className="reviews-item__top">
                    <div>
                      <div className="reviews-item__name">
                        {review.user.firstName} {review.user.lastName}
                      </div>
                      <div className="reviews-item__rating">
                        {review.rating.toFixed(2)} · {renderStars(review.rating)}
                      </div>
                    </div>

                    <div className="reviews-item__right">
                      <div className="reviews-item__date">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>

                      {user?.id && selectedBook && (
                        <button
                          type="button"
                          className="reviews-item__delete"
                          onClick={() => handleDeleteReview(review._id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="reviews-item__text">{review.reviewText || "No written review."}</div>
                </div>
              ))}
            </div>

            <div className="reviews-pagination">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((prev) => prev - 1)}
              >
                Previous
              </button>

              <span>Page {page} of {totalPages}</span>

              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ReviewsPage;
