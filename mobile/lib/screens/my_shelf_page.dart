import 'package:flutter/material.dart';
import '../models/book.dart';
import '../models/user.dart';
import '../services/user_books_service.dart';
import '../theme/app_theme.dart';

class MyShelfPage extends StatefulWidget {
  final UserModel user;

  const MyShelfPage({super.key, required this.user});

  @override
  State<MyShelfPage> createState() => _MyShelfPageState();
}

class _MyShelfPageState extends State<MyShelfPage>
    with SingleTickerProviderStateMixin {
  final _booksService = UserBooksService();
  final _searchController = TextEditingController();

  late TabController _tabController;

  bool _loading = true;
  String _message = '';
  bool _messageIsError = false;

  List<BookModel> hasRead = [];
  List<BookModel> reading = [];
  List<BookModel> wantsToRead = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadShelf();
  }

  Future<void> _loadShelf() async {
    try {
      final data = await _booksService.getUserBooks(widget.user.id);

      setState(() {
        hasRead = data['hasRead'] ?? [];
        reading = data['reading'] ?? [];
        wantsToRead = data['wantsToRead'] ?? [];
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _message = e.toString().replaceFirst('Exception: ', '');
        _messageIsError = true;
        _loading = false;
      });
    }
  }

  Future<void> _moveBook(String bookId, String target) async {
    try {
      final msg = await _booksService.moveBook(
        userId: widget.user.id,
        bookId: bookId,
        to: target,
      );

      setState(() {
        _message = msg;
        _messageIsError = false;
      });

      await _loadShelf();
    } catch (e) {
      setState(() {
        _message = e.toString().replaceFirst('Exception: ', '');
        _messageIsError = true;
      });
    }
  }

  Future<void> _removeBook(String list, String bookId) async {
    try {
      final msg = await _booksService.removeBook(
        userId: widget.user.id,
        list: list,
        bookId: bookId,
      );

      setState(() {
        _message = msg;
        _messageIsError = false;
      });

      await _loadShelf();
    } catch (e) {
      setState(() {
        _message = e.toString().replaceFirst('Exception: ', '');
        _messageIsError = true;
      });
    }
  }

  List<BookModel> _currentBooks() {
    switch (_tabController.index) {
      case 0:
        return hasRead;
      case 1:
        return reading;
      case 2:
        return wantsToRead;
      default:
        return reading;
    }
  }

  String _currentListKey() {
    switch (_tabController.index) {
      case 0:
        return 'hasRead';
      case 1:
        return 'reading';
      case 2:
        return 'wantsToRead';
      default:
        return 'reading';
    }
  }

  List<BookModel> _filteredBooks() {
    final query = _searchController.text.trim().toLowerCase();
    final books = _currentBooks();

    if (query.isEmpty) return books;

    return books.where((book) {
      return book.title.toLowerCase().contains(query) ||
          book.authors.join(', ').toLowerCase().contains(query);
    }).toList();
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

  Widget _statCard(int count, String label) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            Text(
              '$count',
              style: const TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w800,
                color: AppTheme.dark,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.black54,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _bookCard(BookModel book) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 72,
              height: 100,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(12),
                image: book.thumbnail.isNotEmpty
                    ? DecorationImage(
                        image: NetworkImage(book.thumbnail),
                        fit: BoxFit.cover,
                      )
                    : null,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    book.title,
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.dark,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    book.authors.isNotEmpty ? book.authors.join(', ') : 'Unknown',
                    style: const TextStyle(
                      color: Colors.black54,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      OutlinedButton(
                        onPressed: () => _moveBook(book.id, 'hasRead'),
                        child: const Text('Has read'),
                      ),
                      OutlinedButton(
                        onPressed: () => _moveBook(book.id, 'reading'),
                        child: const Text('Reading'),
                      ),
                      OutlinedButton(
                        onPressed: () => _moveBook(book.id, 'wantsToRead'),
                        child: const Text('Want to read'),
                      ),
                      ElevatedButton(
                        onPressed: () => _removeBook(_currentListKey(), book.id),
                        child: const Text('Remove'),
                      ),
                    ],
                  )
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _tabContent() {
    final books = _filteredBooks();

    if (books.isEmpty) {
      return const Center(
        child: Text(
          'No books found.',
          style: TextStyle(
            color: AppTheme.whiteText,
            fontSize: 16,
          ),
        ),
      );
    }

    return ListView.builder(
      itemCount: books.length,
      itemBuilder: (context, index) => _bookCard(books[index]),
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
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
        title: const Text('My Shelf'),
        centerTitle: true,
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppTheme.whiteText,
          unselectedLabelColor: Colors.white70,
          indicatorColor: Colors.white,
          onTap: (_) {
            setState(() {});
          },
          tabs: const [
            Tab(text: 'Has read'),
            Tab(text: 'Reading'),
            Tab(text: 'Want to read'),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  _notice(),
                  Row(
                    children: [
                      _statCard(hasRead.length, 'Books read'),
                      const SizedBox(width: 10),
                      _statCard(reading.length, 'Currently reading'),
                      const SizedBox(width: 10),
                      _statCard(wantsToRead.length, 'Want to read'),
                    ],
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _searchController,
                    decoration: const InputDecoration(
                      hintText: 'Search your shelf',
                      suffixIcon: Icon(Icons.search),
                    ),
                    onChanged: (_) {
                      setState(() {});
                    },
                  ),
                  const SizedBox(height: 14),
                  Expanded(child: _tabContent()),
                ],
              ),
            ),
    );
  }
}