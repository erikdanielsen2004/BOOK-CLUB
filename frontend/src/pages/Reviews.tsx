.reviews-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.reviews-panel-header--top {
  width: 100%;
}

.reviews-book-card__inner {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.reviews-close-btn {
  border: 1px solid rgba(0, 0, 0, 0.18);
  background: transparent;
  color: rgba(0, 0, 0, 0.7);
  border-radius: 999px;
  padding: 0.55rem 0.9rem;
  font-family: 'PT Mono', monospace;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.reviews-close-btn:hover {
  background: rgba(0, 0, 0, 0.78);
  color: white;
}

@media (max-width: 768px) {
  .reviews-book-card__inner {
    flex-direction: column;
  }

  .reviews-panel-header {
    flex-direction: column;
    align-items: stretch;
  }
}
