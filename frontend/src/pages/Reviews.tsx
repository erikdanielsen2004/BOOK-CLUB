import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar.tsx";
import "../styles/Reviews.css";

type UserData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type ReviewedBook = {
  _id: string;
  title: string;
  authors?: string[];
  thumbnail?: string;
  averageRatingDb: number;
  reviewCount: number;
};

type ReviewUser = {
  firstName: string;
  lastName: string;
};

type ReviewItem = {
  _id: string;
  rating: number;
  reviewText: string;
  createdAt: string;
  user: ReviewUser;
};

type ViewResponse = {
  book: {
    _id: string;
    title: string;
    authors?: string[];
    thumbnail?: string;
  };
  averageRating: number;
  reviewCount: number;
  reviews: ReviewItem[];
  page: number;
  totalPages: number;
};

type HasReadBook = {
  _id: string;
  title: string;
  authors?: string[];
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
  return [1, 2, 3, 4, 5].map((star) => {
    let fill = 0;
    if (rating >= star) fill = 100;
    else if (rating >= star - 0.5) fill = 50;

    return (
      <span
        key={star}
        className="reviews-star"
        style={{
          background: `linear-gradient(90deg, #d7b25f ${fill}%, #ddd ${fill}%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}
      >
        ★
      </span>
    );
  });
};

const HalfStarInput: React.FC<{
  value: number;
  onChange: (value: number) => void;
}> = ({ value, onChange }) => {
  const [hoverValue, setHoverValue] = useState(0);
  const displayValue = hoverValue || value;

  return (
    <div className="reviews-star-input" onMouseLeave={() => setHoverValue(0)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const fill =
          displayValue >= star ? 100 : displayValue >= star - 0.5 ? 50 : 0;

        return (
          <div key={star} className="reviews-star-input__star">
            <span className="reviews-star-input__base">★</span>
            <span
              className="reviews-star-input__fill"
              style={{ width: `${fill}%` }}
            >
              ★
            </span>

            <button
              type="button"
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: "50%",
                height: "100%",
                opacity: 0,
                cursor: "pointer"
              }}
              onMouseEnter={() => setHoverValue(star - 0.5)}
              onClick={() => onChange(star - 0.5)}
            />
            <button
              type="button"
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                width: "50%",
                height: "100%",
                opacity: 0,
                cursor: "pointer"
              }}
              onMouseEnter={() => setHoverValue(star)}
              onClick={() => onChange(star)}
            />
          </div>
        );
      })}

      <span className="reviews-rating-value">{value.toFixed(1)}</span>
    </div>
  );
};

const Reviews: React.FC = () => {
  const user = useMemo(() => getStoredUser(), []);

  const [searchText, setSearchText] = useState("");
  const [reviewedBooks, setReviewedBooks] = useState<ReviewedBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<ReviewedBook | null>(null);
  const [viewData, setViewData] = useState<ViewResponse | null>(null);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const [writeSearch, setWriteSearch] = useState("");
  const [hasReadBooks, setHasReadBooks] = useState<HasReadBook[]>([]);
  const [selectedHasReadBook, setSelectedHasReadBook] = useState<HasReadBook | null>(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const [message, setMessage] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(""), 2500);
  };

  const searchReviewedBooks = async (query = "") => {
    try {
      const res = await fetch(
        `/api/book-reviews/search-books?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Could not search reviewed books.");
        return;
      }

      setReviewedBooks(data.books || []);
    } catch {
      setMessage("Could not search reviewed books.");
    }
  };

  const fetchBookReviews = async (bookId: string, nextSort = sort, nextPage = page) => {
    try {
      const res = await fetch(
        `/api/book-reviews/view/${bookId}?sort=${encodeURIComponent(nextSort)}&page=${nextPage}&limit=5`
      );
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Could not load reviews.");
        return;
      }

      setViewData(data);
    } catch {
      setMessage("Could not load reviews.");
    }
  };

  const searchHasReadBooks = async () => {
    if (!user?.id) return;

    try {
      const res = await fetch(
        `/api/book-reviews/user-hasread/${user.id}?q=${encodeURIComponent(writeSearch)}`
      );
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Could not search your Has Read books.");
        return;
      }

      setHasReadBooks(data.books || []);
    } catch {
      setMessage("Could not search your Has Read books.");
    }
  };

  const submitReview = async () => {
    if (!user?.id || !selectedHasReadBook) return;

    if (rating < 0.5) {
      setMessage("Please choose a rating.");
      return;
    }

    try {
      const res = await fetch(
        `/api/book-reviews/create/${selectedHasReadBook._id}/${user.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating,
            reviewText
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Could not create review.");
        return;
      }

      showToast("Review created successfully.");
      setSelectedHasReadBook(null);
      setReviewText("");
      setRating(0);
      setWriteSearch("");
      setHasReadBooks([]);

      if (selectedBook && selectedBook._id === selectedHasReadBook._id) {
        fetchBookReviews(selectedBook._id, sort, 1);
      }

      searchReviewedBooks(searchText);
    } catch {
      setMessage("Could not create review.");
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!user?.id || !selectedBook) return;

    try {
      const res = await fetch(`/api/book-reviews/delete/${user.id}/${reviewId}`, {
        method: "DELETE"
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Could not delete review.");
        return;
      }

      showToast("Review deleted successfully.");
      fetchBookReviews(selectedBook._id, sort, page);
      searchReviewedBooks(searchText);
    } catch {
      setMessage("Could not delete review.");
    }
  };

  useEffect(() => {
    searchReviewedBooks("");
  }, []);

  useEffect(() => {
    if (selectedBook) {
      fetchBookReviews(selectedBook._id, sort, page);
    }
  }, [sort, page]);

  return (
    <div className="reviews-layout">
      <Sidebar />

      <div className="reviews-main">
        <h1 className="reviews-heading">Reviews</h1>

        {toast && <div className="reviews-toast">{toast}</div>}
        {message && <div className="reviews-message">{message}</div>}

        <section className="reviews-section">
          <h2 className="reviews-section__title">Search reviewed books</h2>

          <div className="reviews-toolbar">
            <input
              className="reviews-input"
              type="text"
              placeholder="Search books with reviews..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchReviewedBooks(searchText)}
            />
            <button className="reviews-btn" type="button" onClick={() => searchReviewedBooks(searchText)}>
              Search
            </button>
          </div>

          <div className="reviews-book-search-results">
            {reviewedBooks.map((book) => (
              <div
                key={book._id}
                className="reviews-book-chip"
                onClick={() => {
                  setSelectedBook(book);
                  setPage(1);
                  setSort("newest");
                  fetchBookReviews(book._id, "newest", 1);
                }}
              >
                <div className="reviews-book-chip__title">{book.title}</div>
                <div className="reviews-book-chip__meta">
                  {book.authors?.join(", ") || "Unknown"}
                </div>
                <div className="reviews-book-chip__rating">
                  {book.averageRatingDb.toFixed(2)}
                  <span className="reviews-stars">{renderStars(book.averageRatingDb)}</span>
                  {" · "}
                  {book.reviewCount} review{book.reviewCount !== 1 ? "s" : ""}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="reviews-section">
          <h2 className="reviews-section__title">Write a review</h2>

          <div className="reviews-toolbar">
            <input
              className="reviews-input"
              type="text"
              placeholder="Search your Has Read books..."
              value={writeSearch}
              onChange={(e) => setWriteSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchHasReadBooks()}
            />
            <button className="reviews-btn reviews-btn--secondary" type="button" onClick={searchHasReadBooks}>
              Search
            </button>
          </div>

          {hasReadBooks.length > 0 && (
            <div className="reviews-book-search-results">
              {hasReadBooks.map((book) => (
                <div
                  key={book._id}
                  className="reviews-book-chip"
                  onClick={() => setSelectedHasReadBook(book)}
                >
                  <div className="reviews-book-chip__title">{book.title}</div>
                  <div className="reviews-book-chip__meta">
                    {book.authors?.join(", ") || "Unknown"}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedHasReadBook && (
            <div className="reviews-create-card">
              <div className="reviews-create-card__book">{selectedHasReadBook.title}</div>
              <div className="reviews-create-card__author">
                {selectedHasReadBook.authors?.join(", ") || "Unknown"}
              </div>

              <HalfStarInput value={rating} onChange={setRating} />

              <textarea
                className="reviews-textarea"
                placeholder="Write your review..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />

              <div className="reviews-toolbar">
                <button className="reviews-btn" type="button" onClick={submitReview}>
                  Submit review
                </button>
              </div>
            </div>
          )}
        </section>

        {viewData && (
          <section className="reviews-section">
            <div className="reviews-book-card">
              <div className="reviews-book-card__cover">
                {viewData.book.thumbnail ? (
                  <img src={viewData.book.thumbnail} alt={viewData.book.title} />
                ) : null}
              </div>

              <div>
                <h3 className="reviews-book-card__title">{viewData.book.title}</h3>
                <div className="reviews-book-card__author">
                  {viewData.book.authors?.join(", ") || "Unknown"}
                </div>
                <div className="reviews-book-card__avg">
                  {viewData.averageRating.toFixed(2)}
                  <span className="reviews-stars">{renderStars(viewData.averageRating)}</span>
                  {" · "}
                  {viewData.reviewCount} review{viewData.reviewCount !== 1 ? "s" : ""}
                </div>
              </div>
            </div>

            <div className="reviews-toolbar">
              <select
                className="reviews-select"
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
              {viewData.reviews.length > 0 ? (
                viewData.reviews.map((review) => {
                  const isMine =
                    user?.firstName === review.user.firstName &&
                    user?.lastName === review.user.lastName;

                  return (
                    <div key={review._id} className="reviews-card">
                      <div className="reviews-card__top">
                        <div>
                          <div className="reviews-card__name">
                            {review.user.firstName} {review.user.lastName}
                          </div>
                          <div className="reviews-card__date">
                            {new Date(review.createdAt).toLocaleString()}
                          </div>
                        </div>

                        <div>
                          <div className="reviews-card__rating">
                            {review.rating.toFixed(1)}
                            <span className="reviews-stars">{renderStars(review.rating)}</span>
                          </div>

                          {isMine && (
                            <div style={{ marginTop: "0.55rem", textAlign: "right" }}>
                              <button
                                className="reviews-delete-btn"
                                type="button"
                                onClick={() => deleteReview(review._id)}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="reviews-card__text">
                        {review.reviewText || "No review text provided."}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="reviews-empty">No reviews yet.</div>
              )}
            </div>

            <div className="reviews-pagination">
              <button
                className="reviews-page-btn"
                type="button"
                disabled={viewData.page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>

              <span className="reviews-page-label">
                Page {viewData.page} of {viewData.totalPages}
              </span>

              <button
                className="reviews-page-btn"
                type="button"
                disabled={viewData.page >= viewData.totalPages}
                onClick={() => setPage((p) => p + 1)}
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

export default Reviews;
