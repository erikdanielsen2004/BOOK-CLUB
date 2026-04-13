import 'package:flutter/material.dart';
import '../models/book.dart';
import '../models/user.dart';
import '../services/user_books_service.dart';
import '../theme/app_theme.dart';
import 'landing_page.dart';

class BooksPage extends StatefulWidget {
  final UserModel user;

  const BooksPage({super.key, required this.user});

  @override
  State<BooksPage> createState() => _BooksPageState();
}

class _BooksPageState extends State<BooksPage> {
  final _booksService = UserBooksService();

  final _searchController = TextEditingController();

  bool _isLoadingShelf = true;
  bool _isSearching = false;
  String _error = '';
  String _message = '';
  bool _messageIsError = false;

  String _selectedCategory = '';
  int _page = 0;
  final int _maxResults = 12;

  List<BookModel> hasRead = [];
  List<BookModel> reading = [];
  List<BookModel> wantsToRead = [];
  List<BookModel> searchResults = [];

  final List<String> _categories = const [
    '',
    'Fiction',
    'Fantasy',
    'Romance',
    'Mystery',
    'Thriller',
    'Science Fiction',
    'Horror',
    'Biography',
    'History',
    'Business',
    'Young Adult',
    'Self-Help',
    'Comics',
    'Poetry',
    'Religion',
    'Travel',
    'Cooking',
    'Art',
    'Computers',
  ];

  final Map<String, bool> _expanded = {};

  @override
  void initState() {
    super.initState();
    _loadBooks();
  }

  Future<void> _loadBooks() async {
    try {
      final data = await _booksService.getUserBooks(widget.user.id);

      setState(() {
        hasRead = data['hasRead'] ?? [];
        reading = data['reading'] ?? [];
        wantsToRead = data['wantsToRead'] ?? [];
        _isLoadingShelf = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _isLoadingShelf = false;
      });
    }
  }

  Future<void> _runSearch([int nextPage = 0]) async {
    setState(() {
      _message = '';
      _messageIsError = false;
      searchResults = [];
    });

    if (_searchController.text.trim().isEmpty && _selectedCategory.trim().isEmpty) {
      setState(() {
        _message = 'Enter a search term or choose a category.';
        _messageIsError = true;
      });
      return;
    }

    setState(() {
      _isSearching = true;
    });

    try {
      final results = await _booksService.searchBooks(
        query: _searchController.text.trim(),
        category: _selectedCategory.trim(),
        startIndex: nextPage * _maxResults,
        maxResults: _maxResults,
      );

      setState(() {
        searchResults = results;
        _page = nextPage;
        if (results.isEmpty) {
          _message = 'No books found.';
          _messageIsError = true;
        }
      });
    } catch (e) {
      setState(() {
        _message = e.toString().replaceFirst('Exception: ', '');
        _messageIsError = true;
      });
    } finally {
      setState(() {
        _isSearching = false;
      });
    }
  }

  Future<void> _addToList(BookModel book, String list) async {
    try {
      final resultMessage = await _booksService.addBookToList(
        userId: widget.user.id,
        list: list,
        book: book,
      );

      await _loadBooks();

      setState(() {
        _message = resultMessage;
        _messageIsError = false;
      });
    } catch (e) {
      setState(() {
        _message = e.toString().replaceFirst('Exception: ', '');
        _messageIsError = true;
      });
    }
  }

  Widget _userHeader() {
    return Padding(
      padding: const EdgeInsets.only(top: 12, bottom: 16),
      child: Column(
        children: [
          Text(
            'Logged In As ${widget.user.firstName} ${widget.user.lastName}',
            style: const TextStyle(
              color: AppTheme.whiteText,
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 10),
          OutlinedButton(
            style: OutlinedButton.styleFrom(
              foregroundColor: AppTheme.whiteText,
              side: const BorderSide(color: AppTheme.whiteText),
            ),
            onPressed: () {
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (_) => const LandingPage()),
                (route) => false,
              );
            },
            child: const Text('Log Out'),
          )
        ],
      ),
    );
  }

  Widget _notice() {
    if (_message.isEmpty) return const SizedBox.shrink();

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 12),
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

  Widget _searchSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Books',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w700,
                color: AppTheme.dark,
              ),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _searchController,
              decoration: const InputDecoration(
                hintText: 'Search by title, author, or keyword...',
              ),
              onSubmitted: (_) => _runSearch(0),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _selectedCategory,
              items: _categories
                  .map(
                    (cat) => DropdownMenuItem(
                      value: cat,
                      child: Text(cat.isEmpty ? 'All categories' : cat),
                    ),
                  )
                  .toList(),
              onChanged: (value) {
                setState(() {
                  _selectedCategory = value ?? '';
                });
              },
              decoration: const InputDecoration(),
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: _isSearching ? null : () => _runSearch(0),
              child: Text(_isSearching ? 'Searching...' : 'Search'),
            ),
            _notice(),
            if (searchResults.isNotEmpty) ...[
              const SizedBox(height: 18),
              ...searchResults.map(_bookCard),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  OutlinedButton(
                    onPressed: _page == 0 ? null : () => _runSearch(_page - 1),
                    child: const Text('Previous'),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'Page ${_page + 1}',
                    style: const TextStyle(
                      color: AppTheme.dark,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(width: 12),
                  OutlinedButton(
                    onPressed: searchResults.length < _maxResults
                        ? null
                        : () => _runSearch(_page + 1),
                    child: const Text('Next'),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _bookCard(BookModel book) {
    final expanded = _expanded[book.googleBooksId] ?? false;
    final hasLongDesc = book.description.length > 180;
    final description = expanded || !hasLongDesc
        ? book.description
        : '${book.description.substring(0, 180)}...';

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (book.thumbnail.isNotEmpty)
            Center(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.network(
                  book.thumbnail,
                  height: 150,
                  fit: BoxFit.cover,
                ),
              ),
            ),
          if (book.thumbnail.isNotEmpty) const SizedBox(height: 12),
          Text(
            book.title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppTheme.dark,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Author(s): ${book.authors.isNotEmpty ? book.authors.join(', ') : 'Unknown'}',
            style: const TextStyle(color: AppTheme.dark),
          ),
          const SizedBox(height: 4),
          Text(
            'Category: ${book.categories.isNotEmpty ? book.categories.join(', ') : 'None'}',
            style: const TextStyle(color: AppTheme.dark),
          ),
          const SizedBox(height: 4),
          Text(
            'Published: ${book.publishedDate.isNotEmpty ? book.publishedDate : 'Unknown'}',
            style: const TextStyle(color: AppTheme.dark),
          ),
          const SizedBox(height: 4),
          Text(
            'Pages: ${book.pageCount == 0 ? 'N/A' : book.pageCount}',
            style: const TextStyle(color: AppTheme.dark),
          ),
          if (book.description.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              description,
              style: const TextStyle(color: AppTheme.dark),
            ),
            if (hasLongDesc)
              TextButton(
                onPressed: () {
                  setState(() {
                    _expanded[book.googleBooksId] = !expanded;
                  });
                },
                child: Text(expanded ? 'Read less' : 'Read more'),
              ),
          ],
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ElevatedButton(
                onPressed: () => _addToList(book, 'reading'),
                child: const Text('Reading'),
              ),
              ElevatedButton(
                onPressed: () => _addToList(book, 'hasRead'),
                child: const Text('Has Read'),
              ),
              ElevatedButton(
                onPressed: () => _addToList(book, 'wantsToRead'),
                child: const Text('Want to Read'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _shelf(String title, List<BookModel> books) {
    return Card(
      child: ExpansionTile(
        title: Text('$title (${books.length})'),
        children: books
            .map(
              (book) => ListTile(
                title: Text(book.title),
                subtitle: Text(book.authors.join(', ')),
              ),
            )
            .toList(),
      ),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: AppTheme.background,
        foregroundColor: AppTheme.whiteText,
        title: const Text('Welcome to the Book Club'),
        centerTitle: true,
      ),
      body: _isLoadingShelf
          ? const Center(child: CircularProgressIndicator())
          : _error.isNotEmpty
              ? Center(
                  child: Text(
                    _error,
                    style: const TextStyle(color: AppTheme.whiteText),
                  ),
                )
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    children: [
                      _userHeader(),
                      _searchSection(),
                      const SizedBox(height: 14),
                      _shelf('Has Read', hasRead),
                      _shelf('Reading', reading),
                      _shelf('Wants To Read', wantsToRead),
                    ],
                  ),
                ),
    );
  }
}