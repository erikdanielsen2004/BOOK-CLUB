import 'package:flutter/material.dart';
import '../models/user.dart';
import '../models/book.dart';
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
  final _addBookController = TextEditingController();

  bool _isLoading = true;
  String _error = '';
  String _searchMessage = '';
  String _addMessage = '';

  List<BookModel> hasRead = [];
  List<BookModel> reading = [];
  List<BookModel> wantsToRead = [];
  List<BookModel> allBooks = [];
  List<BookModel> filteredBooks = [];

  @override
  void initState() {
    super.initState();
    _loadBooks();
  }

  Future<void> _loadBooks() async {
    try {
      final data = await _booksService.getUserBooks(widget.user.id);

      final all = <BookModel>[
        ...data['hasRead'] ?? [],
        ...data['reading'] ?? [],
        ...data['wantsToRead'] ?? [],
      ];

      setState(() {
        hasRead = data['hasRead'] ?? [];
        reading = data['reading'] ?? [];
        wantsToRead = data['wantsToRead'] ?? [];
        allBooks = all;
        filteredBooks = [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  void _searchBook() {
    final query = _searchController.text.trim().toLowerCase();
    if (query.isEmpty) {
      setState(() {
        filteredBooks = [];
        _searchMessage = '';
      });
      return;
    }

    final results = allBooks.where((book) {
      return book.title.toLowerCase().contains(query) ||
          book.authors.join(', ').toLowerCase().contains(query);
    }).toList();

    setState(() {
      filteredBooks = results;
      _searchMessage = results.isEmpty
          ? 'No books found'
          : 'Book(s) have been retrieved';
    });
  }

  void _addBook() {
    final text = _addBookController.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _addMessage = 'Book ready to add';
    });
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

  Widget _bookUISection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 6),
            TextField(
              controller: _searchController,
              decoration: const InputDecoration(
                hintText: 'Book To Search For',
              ),
            ),
            const SizedBox(height: 10),
            ElevatedButton(
              onPressed: _searchBook,
              child: const Text('Search Book'),
            ),
            const SizedBox(height: 8),
            Text(
              _searchMessage,
              style: const TextStyle(color: AppTheme.dark),
            ),
            if (filteredBooks.isNotEmpty) ...[
              const SizedBox(height: 10),
              ...filteredBooks.map(
                (book) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(book.title),
                  subtitle: Text(book.authors.join(', ')),
                ),
              ),
            ],
            const SizedBox(height: 18),
            TextField(
              controller: _addBookController,
              decoration: const InputDecoration(
                hintText: 'Book To Add',
              ),
            ),
            const SizedBox(height: 10),
            ElevatedButton(
              onPressed: _addBook,
              child: const Text('Add Book'),
            ),
            const SizedBox(height: 8),
            Text(
              _addMessage,
              style: const TextStyle(color: AppTheme.dark),
            ),
          ],
        ),
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
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: AppTheme.background,
        foregroundColor: AppTheme.whiteText,
        title: const Text('Welcome to the Book Club'),
        centerTitle: true,
      ),
      body: _isLoading
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
                      _bookUISection(),
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