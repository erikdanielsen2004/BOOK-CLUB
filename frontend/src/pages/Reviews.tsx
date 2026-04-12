import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar.tsx";
import "../styles/Reviews.css";

type UserData = {
  id?: string;
  _id?: string;
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
  thumbnail?: string;
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

const StarDisplay: React.FC<{ rating: number; size?: "sm" | "md" }> = ({ rating, size = "sm" }) => {
  return (
    <span className={`reviews-stars reviews-stars--${size}`} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = rating >= star ? 100 : rating >= star - 0.5 ? 50 : 0;

        return (
          <span key={star} className="reviews-star-wrap">
            <span className="reviews-star-base">★</span>
            <span className="reviews-star-fill" style={{ width: `${fill}%` }}>
              ★
            </span>
          </span>
        );
      })}
    </span>
  );
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
              className="reviews-star-input__click-half"
              onMouseEnter={() => setHoverValue(star - 0.5)}
              onClick={() => onChange(star - 0.5)}
              aria-label={`Rate ${star - 0.5} out of 5`}
            />
            <button
              type="button"
              className="reviews-star-input__click-full"
              onMouseEnter={() => setHoverValue(star)}
              onClick={() => onChange(star)}
              aria-label={`Rate ${star} out of 5`}
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
  const userId = user?.id || user?._id || "";

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
  const [writePage, setWritePage] = useState(1);

  const [message, setMessage] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(""), 2500);
  };

  const closeViewPanel = () => {
    setSelectedBook(null);
    setViewData(null);
    setPage(1);
    setSort("newest");
  };

  const closeWritePanel = () => {
    setSelectedHasReadBook(null);
    setRating(0);
    setReviewText("");
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

  const loadHasReadBooks = async () => {
    if (!userId) return;

    try {
      const res = await fetch(`/api/user-books/${userId}`);
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Could not load your Has Read books.");
        return;
      }

      setHasReadBooks(data.hasRead || []);
      setWritePage(1);
    } catch {
      setMessage("Could not load your Has Read books.");
    }
  };

  const submitReview = async () => {
    if (!userId || !selectedHasReadBook) return;

    if (rating < 0.5) {
      setMessage("Please choose a rating.");
      return;
    }

    try {
      const res = await fetch(
        `/api/book-reviews/create/${selectedHasReadBook._id}/${userId}`,
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

      const createdBookId = selectedHasReadBook._id;

      closeWritePanel();
      setWriteSearch("");

      await loadHasReadBooks();

      if (selectedBook && selectedBook._id === createdBookId) {
        fetchBookReviews(selectedBook._id, sort, 1);
      }

      searchReviewedBooks(searchText);
    } catch {
      setMessage("Could not create review.");
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!userId || !selectedBook) return;

    try {
      const res = await fetch(`/api/book-reviews/delete/${userId}/${reviewId}`, {
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
    loadHasReadBooks();
  }, []);

  useEffect(() => {
    if (selectedBook) {
      fetchBookReviews(selectedBook._id, sort, page);
    }
  }, [sort, page]);

  const filteredHasReadBooks = useMemo(() => {
    const q = writeSearch.trim().toLowerCase();
    if (!q) return hasReadBooks;

    return hasReadBooks.filter((book) =>
      book.title.toLowerCase().includes(q) ||
      (book.authors?.join(", ").toLowerCase().includes(q) ?? false)
    );
  }, [hasReadBooks, writeSearch]);

  const writeBooksPerPage = 5;
  const writeTotalPages = Math.max(1, Math.ceil(filteredHasReadBooks.length / writeBooksPerPage));
  const paginatedHasReadBooks = filteredHasReadBooks.slice(
    (writePage - 1) * writeBooksPerPage,
    writePage * writeBooksPerPage
  );

  useEffect(() => {
    if (writePage > writeTotalPages) {
      setWritePage(1);
    }
  }, [writePage, writeTotalPages]);

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
                className={`reviews-book-chip ${selectedBook?._id === book._id ? "reviews-book-chip--selected" : ""}`}
                onClick={() => {
                  closeWritePanel();
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
                  <StarDisplay rating={book.averageRatingDb} />
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
              onChange={(e) => {
                setWriteSearch(e.target.value);
                setWritePage(1);
              }}
            />
            <button className="reviews-btn reviews-btn--secondary" type="button" onClick={() => setWritePage(1)}>
              Search
            </button>
          </div>

          {paginatedHasReadBooks.length > 0 ? (
            <>
              <div className="reviews-book-search-results">
                {paginatedHasReadBooks.map((book) => (
                  <div
                    key={book._id}
                    className={`reviews-book-chip ${selectedHasReadBook?._id === book._id ? "reviews-book-chip--selected" : ""}`}
                    onClick={() => {
                      closeViewPanel();
                      setSelectedHasReadBook(book);
                      setRating(0);
                      setReviewText("");
                    }}
                  >
                    <div className="reviews-book-chip__title">{book.title}</div>
                    <div className="reviews-book-chip__meta">
                      {book.authors?.join(", ") || "Unknown"}
                    </div>
                  </div>
                ))}
              </div>

              <div className="reviews-pagination reviews-pagination--top">
                <button
                  className="reviews-page-btn"
                  type="button"
                  disabled={writePage <= 1}
                  onClick={() => setWritePage((p) => p - 1)}
                >
                  Previous
                </button>

                <span className="reviews-page-label">
                  Page {writePage} of {writeTotalPages}
                </span>

                <button
                  className="reviews-page-btn"
                  type="button"
                  disabled={writePage >= writeTotalPages}
                  onClick={() => setWritePage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <div className="reviews-empty">No Has Read books found.</div>
          )}

          {selectedHasReadBook && (
            <div className="reviews-create-card">
              <div className="reviews-panel-header">
                <div>
                  <div className="reviews-create-card__book">{selectedHasReadBook.title}</div>
                  <div className="reviews-create-card__author">
                    {selectedHasReadBook.authors?.join(", ") || "Unknown"}
                  </div>
                </div>

                <button
                  type="button"
                  className="reviews-close-btn"
                  onClick={closeWritePanel}
                >
                  Dismiss writing review
                </button>
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
              <div className="reviews-panel-header reviews-panel-header--top">
                <div className="reviews-book-card__inner">
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
                      <StarDisplay rating={viewData.averageRating} size="md" />
                      {" · "}
                      {viewData.reviewCount} review{viewData.reviewCount !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="reviews-close-btn"
                  onClick={closeViewPanel}
                >
                  Dismiss viewing
                </button>
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
                            <StarDisplay rating={review.rating} />
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
