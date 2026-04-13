import 'package:flutter/material.dart';
import '../models/book.dart';
import '../models/review.dart';
import '../models/user.dart';
import '../services/review_service.dart';
import '../theme/app_theme.dart';

class ReviewsPage extends StatefulWidget {
  final UserModel user;

  const ReviewsPage({super.key, required this.user});

  @override
  State<ReviewsPage> createState() => _ReviewsPageState();
}

class _ReviewsPageState extends State<ReviewsPage> {
  final _reviewService = ReviewService();

  final _searchReviewedController = TextEditingController();
  final _searchHasReadController = TextEditingController();
  final _reviewTextController = TextEditingController();

  List<ReviewBookSummary> reviewedBooks = [];
  List<BookModel> hasReadBooks = [];

  ReviewBookSummary? selectedBookSummary;
  ReviewViewResponse? selectedViewData;
  BookModel? selectedHasReadBook;

  bool _loadingReviewedBooks = false;
  bool _loadingHasReadBooks = false;
  bool _loadingView = false;
  bool _submittingReview = false;

  String _message = '';
  bool _messageIsError = false;

  String _sort = 'newest';
  int _page = 1;
  double _rating = 0.0;

  @override
  void initState() {
    super.initState();
    _loadInitial();
  }

  Future<void> _loadInitial() async {
    await Future.wait([
      _searchReviewedBooks(),
      _loadHasReadBooks(),
    ]);
  }

  void _setMessage(String text, {bool isError = false}) {
    setState(() {
      _message = text;
      _messageIsError = isError;
    });
  }

  Future<void> _searchReviewedBooks() async {
    setState(() {
      _loadingReviewedBooks = true;
    });

    try {
      final books = await _reviewService.searchReviewedBooks(
        query: _searchReviewedController.text.trim(),
      );

      setState(() {
        reviewedBooks = books;
      });
    } catch (e) {
      _setMessage(
        e.toString().replaceFirst('Exception: ', ''),
        isError: true,
      );
    } finally {
      setState(() {
        _loadingReviewedBooks = false;
      });
    }
  }

  Future<void> _loadHasReadBooks() async {
    setState(() {
      _loadingHasReadBooks = true;
    });

    try {
      final books = await _reviewService.getUserHasReadBooks(
        widget.user.id,
        query: _searchHasReadController.text.trim(),
      );

      setState(() {
        hasReadBooks = books;
      });
    } catch (e) {
      _setMessage(
        e.toString().replaceFirst('Exception: ', ''),
        isError: true,
      );
    } finally {
      setState(() {
        _loadingHasReadBooks = false;
      });
    }
  }

  Future<void> _fetchBookReviews(String bookId) async {
    setState(() {
      _loadingView = true;
    });

    try {
      final data = await _reviewService.viewBookReviews(
        bookId: bookId,
        sort: _sort,
        page: _page,
        limit: 5,
      );

      setState(() {
        selectedViewData = data;
      });
    } catch (e) {
      _setMessage(
        e.toString().replaceFirst('Exception: ', ''),
        isError: true,
      );
    } finally {
      setState(() {
        _loadingView = false;
      });
    }
  }

  Future<void> _submitReview() async {
    if (selectedHasReadBook == null) {
      _setMessage('Choose a book to review.', isError: true);
      return;
    }

    if (_rating < 0.5) {
      _setMessage('Please choose a rating.', isError: true);
      return;
    }

    setState(() {
      _submittingReview = true;
    });

    try {
      final msg = await _reviewService.createReview(
        bookId: selectedHasReadBook!.id,
        userId: widget.user.id,
        rating: _rating,
        reviewText: _reviewTextController.text.trim(),
      );

      _setMessage(msg, isError: false);

      final reviewedBookId = selectedHasReadBook!.id;

      setState(() {
        selectedHasReadBook = null;
        _rating = 0.0;
        _reviewTextController.clear();
      });

      await _loadHasReadBooks();
      await _searchReviewedBooks();

      if (selectedBookSummary != null && selectedBookSummary!.id == reviewedBookId) {
        await _fetchBookReviews(reviewedBookId);
      }
    } catch (e) {
      _setMessage(
        e.toString().replaceFirst('Exception: ', ''),
        isError: true,
      );
    } finally {
      setState(() {
        _submittingReview = false;
      });
    }
  }

  Future<void> _deleteReview(String reviewId) async {
    try {
      final msg = await _reviewService.deleteReview(
        userId: widget.user.id,
        reviewId: reviewId,
      );

      _setMessage(msg, isError: false);

      await _searchReviewedBooks();

      if (selectedBookSummary != null) {
        await _fetchBookReviews(selectedBookSummary!.id);
      }
    } catch (e) {
      _setMessage(
        e.toString().replaceFirst('Exception: ', ''),
        isError: true,
      );
    }
  }

  Widget _notice() {
    if (_message.isEmpty) return const SizedBox.shrink();

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: _messageIsError
            ? const Color.fromRGBO(139, 35, 35, 0.1)
            : Colors.green.withOpacity(0.1),
        border: Border.all(
          color: _messageIsError
              ? const Color.fromRGBO(139, 35, 35, 0.3)
              : Colors.green.withOpacity(0.3),
        ),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        _message,
        style: TextStyle(
          color: _messageIsError ? AppTheme.background : Colors.green.shade700,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _starDisplay(double rating, {double size = 18}) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (index) {
        final star = index + 1;
        IconData icon;
        if (rating >= star) {
          icon = Icons.star;
        } else if (rating >= star - 0.5) {
          icon = Icons.star_half;
        } else {
          icon = Icons.star_border;
        }

        return Icon(icon, size: size, color: Colors.amber.shade700);
      }),
    );
  }

  Widget _ratingButtons() {
    final values = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: values.map((value) {
        final selected = _rating == value;
        return ChoiceChip(
          label: Text(value.toStringAsFixed(1)),
          selected: selected,
          onSelected: (_) {
            setState(() {
              _rating = value;
            });
          },
        );
      }).toList(),
    );
  }

  Widget _sectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w700,
          color: AppTheme.whiteText,
        ),
      ),
    );
  }

  Widget _reviewedBooksSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: _searchReviewedController,
              decoration: InputDecoration(
                hintText: 'Search books with reviews...',
                suffixIcon: IconButton(
                  onPressed: _searchReviewedBooks,
                  icon: const Icon(Icons.search),
                ),
              ),
              onSubmitted: (_) => _searchReviewedBooks(),
            ),
            const SizedBox(height: 14),
            if (_loadingReviewedBooks)
              const CircularProgressIndicator()
            else if (reviewedBooks.isEmpty)
              const Align(
                alignment: Alignment.centerLeft,
                child: Text('No reviewed books found.'),
              )
            else
              ...reviewedBooks.map((book) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(book.title),
                    subtitle: Text(
                      '${book.authors.isNotEmpty ? book.authors.join(', ') : 'Unknown'} • ${book.reviewCount} review(s)',
                    ),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(book.averageRatingDb.toStringAsFixed(2)),
                        _starDisplay(book.averageRatingDb, size: 14),
                      ],
                    ),
                    onTap: () {
                      setState(() {
                        selectedBookSummary = book;
                        _page = 1;
                        _sort = 'newest';
                      });
                      _fetchBookReviews(book.id);
                    },
                  )),
          ],
        ),
      ),
    );
  }

  Widget _writeReviewSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: _searchHasReadController,
              decoration: InputDecoration(
                hintText: 'Search your Has Read books...',
                suffixIcon: IconButton(
                  onPressed: _loadHasReadBooks,
                  icon: const Icon(Icons.search),
                ),
              ),
              onSubmitted: (_) => _loadHasReadBooks(),
            ),
            const SizedBox(height: 14),
            if (_loadingHasReadBooks)
              const CircularProgressIndicator()
            else if (hasReadBooks.isEmpty)
              const Align(
                alignment: Alignment.centerLeft,
                child: Text('No Has Read books found.'),
              )
            else
              ...hasReadBooks.map((book) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(book.title),
                    subtitle: Text(book.authors.isNotEmpty ? book.authors.join(', ') : 'Unknown'),
                    onTap: () {
                      setState(() {
                        selectedHasReadBook = book;
                        _rating = 0.0;
                        _reviewTextController.clear();
                      });
                    },
                  )),
            if (selectedHasReadBook != null) ...[
              const SizedBox(height: 18),
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Writing review for: ${selectedHasReadBook!.title}',
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    color: AppTheme.dark,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              _ratingButtons(),
              const SizedBox(height: 12),
              TextField(
                controller: _reviewTextController,
                maxLines: 5,
                decoration: const InputDecoration(
                  hintText: 'Write your review...',
                ),
              ),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: _submittingReview ? null : _submitReview,
                child: Text(_submittingReview ? 'Submitting...' : 'Submit review'),
              ),
            ]
          ],
        ),
      ),
    );
  }

  Widget _selectedReviewsSection() {
    if (selectedBookSummary == null) return const SizedBox.shrink();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: _loadingView
            ? const Center(child: CircularProgressIndicator())
            : selectedViewData == null
                ? const Text('No review data loaded.')
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        selectedViewData!.book.title,
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.dark,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        selectedViewData!.book.authors.isNotEmpty
                            ? selectedViewData!.book.authors.join(', ')
                            : 'Unknown',
                        style: const TextStyle(color: Colors.black54),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Text(
                            selectedViewData!.averageRating.toStringAsFixed(2),
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              color: AppTheme.dark,
                            ),
                          ),
                          const SizedBox(width: 8),
                          _starDisplay(selectedViewData!.averageRating),
                          const SizedBox(width: 8),
                          Text('${selectedViewData!.reviewCount} review(s)'),
                        ],
                      ),
                      const SizedBox(height: 14),
                      DropdownButtonFormField<String>(
                        initialValue: _sort,
                        items: const [
                          DropdownMenuItem(value: 'newest', child: Text('Newest to oldest')),
                          DropdownMenuItem(value: 'oldest', child: Text('Oldest to newest')),
                          DropdownMenuItem(value: 'rating_desc', child: Text('Best to worst')),
                          DropdownMenuItem(value: 'rating_asc', child: Text('Worst to best')),
                        ],
                        onChanged: (value) {
                          if (value == null) return;
                          setState(() {
                            _sort = value;
                            _page = 1;
                          });
                          _fetchBookReviews(selectedBookSummary!.id);
                        },
                      ),
                      const SizedBox(height: 14),
                      if (selectedViewData!.reviews.isEmpty)
                        const Text('No reviews yet.')
                      else
                        ...selectedViewData!.reviews.map((review) {
                          final isMine =
                              review.user.firstName == widget.user.firstName &&
                              review.user.lastName == widget.user.lastName;

                          return Container(
                            width: double.infinity,
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.black12),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            review.user.fullName,
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w700,
                                              color: AppTheme.dark,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            review.createdAt,
                                            style: const TextStyle(
                                              fontSize: 12,
                                              color: Colors.black54,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      children: [
                                        Text(review.rating.toStringAsFixed(1)),
                                        _starDisplay(review.rating, size: 14),
                                      ],
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                Text(
                                  review.reviewText.isNotEmpty
                                      ? review.reviewText
                                      : 'No review text provided.',
                                  style: const TextStyle(color: AppTheme.dark),
                                ),
                                if (isMine) ...[
                                  const SizedBox(height: 10),
                                  Align(
                                    alignment: Alignment.centerRight,
                                    child: ElevatedButton(
                                      onPressed: () => _deleteReview(review.id),
                                      child: const Text('Delete'),
                                    ),
                                  ),
                                ]
                              ],
                            ),
                          );
                        }),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          OutlinedButton(
                            onPressed: selectedViewData!.page <= 1
                                ? null
                                : () {
                                    setState(() {
                                      _page -= 1;
                                    });
                                    _fetchBookReviews(selectedBookSummary!.id);
                                  },
                            child: const Text('Previous'),
                          ),
                          const SizedBox(width: 12),
                          Text(
                            'Page ${selectedViewData!.page} of ${selectedViewData!.totalPages}',
                            style: const TextStyle(
                              color: AppTheme.dark,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(width: 12),
                          OutlinedButton(
                            onPressed: selectedViewData!.page >= selectedViewData!.totalPages
                                ? null
                                : () {
                                    setState(() {
                                      _page += 1;
                                    });
                                    _fetchBookReviews(selectedBookSummary!.id);
                                  },
                            child: const Text('Next'),
                          ),
                        ],
                      ),
                    ],
                  ),
      ),
    );
  }

  @override
  void dispose() {
    _searchReviewedController.dispose();
    _searchHasReadController.dispose();
    _reviewTextController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: AppTheme.background,
        foregroundColor: AppTheme.whiteText,
        title: const Text('Reviews'),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _notice(),
            _sectionTitle('Search reviewed books'),
            _reviewedBooksSection(),
            const SizedBox(height: 18),
            _sectionTitle('Write a review'),
            _writeReviewSection(),
            const SizedBox(height: 18),
            if (selectedBookSummary != null) ...[
              _sectionTitle('View reviews'),
              _selectedReviewsSection(),
            ],
          ],
        ),
      ),
    );
  }
}