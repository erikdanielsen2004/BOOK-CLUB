import 'package:flutter/material.dart';
import '../models/book.dart';
import '../models/group.dart';
import '../models/user.dart';
import '../services/group_service.dart';
import '../theme/app_theme.dart';

class GroupDetailPage extends StatefulWidget {
  final UserModel user;
  final GroupModel group;

  const GroupDetailPage({
    super.key,
    required this.user,
    required this.group,
  });

  @override
  State<GroupDetailPage> createState() => _GroupDetailPageState();
}

class _GroupDetailPageState extends State<GroupDetailPage>
    with SingleTickerProviderStateMixin {
  final _groupService = GroupService();

  late TabController _tabController;
  late GroupModel groupState;

  final _editNameController = TextEditingController();
  final _editDescriptionController = TextEditingController();
  final _bookSearchController = TextEditingController();

  List<BookModel> searchResults = [];

  bool _working = false;
  bool _searching = false;
  String _message = '';
  bool _messageIsError = false;
  int _durationDays = 3;

  @override
  void initState() {
    super.initState();
    groupState = widget.group;
    _editNameController.text = groupState.name;
    _editDescriptionController.text = groupState.description;
    _tabController = TabController(length: 3, vsync: this);
  }

  bool get isOwner => groupState.owner == widget.user.id;
  bool get isMember => groupState.members.any((m) => m.id == widget.user.id);

  bool get voteExpired {
    if (groupState.voteEndAt == null) return false;
    return DateTime.tryParse(groupState.voteEndAt!)?.isBefore(DateTime.now()) ?? false;
  }

  bool get canVote => isMember && groupState.voteSessionActive && !voteExpired;

  String? get myVote {
    try {
      return groupState.votes.firstWhere((v) => v.userId == widget.user.id).bookId;
    } catch (_) {
      return null;
    }
  }

  int voteCount(String bookId) {
    return groupState.votes.where((v) => v.bookId == bookId).length;
  }

  void _setMessage(String text, {bool isError = false}) {
    setState(() {
      _message = text;
      _messageIsError = isError;
    });
  }

  void _updateGroup(GroupModel updated) {
    setState(() {
      groupState = updated;
      _editNameController.text = updated.name;
      _editDescriptionController.text = updated.description;
    });
  }

  Future<void> _editGroup() async {
    try {
      setState(() => _working = true);

      final updated = await _groupService.editGroup(
        userId: widget.user.id,
        groupId: groupState.id,
        name: _editNameController.text.trim(),
        description: _editDescriptionController.text.trim(),
      );

      _updateGroup(updated);
      _setMessage('Group updated successfully.');
    } catch (e) {
      _setMessage(e.toString().replaceFirst('Exception: ', ''), isError: true);
    } finally {
      setState(() => _working = false);
    }
  }

  Future<void> _searchBooks() async {
    if (_bookSearchController.text.trim().isEmpty) return;

    try {
      setState(() {
        _searching = true;
        _message = '';
      });

      final results = await _groupService.searchBooks(
        query: _bookSearchController.text.trim(),
      );

      setState(() {
        searchResults = results;
      });
    } catch (e) {
      _setMessage(e.toString().replaceFirst('Exception: ', ''), isError: true);
    } finally {
      setState(() => _searching = false);
    }
  }

  Future<void> _addCandidate(BookModel book) async {
    try {
      setState(() => _working = true);

      final updated = await _groupService.addCandidateBook(
        userId: widget.user.id,
        groupId: groupState.id,
        book: book,
      );

      _updateGroup(updated);
      setState(() {
        searchResults = [];
        _bookSearchController.clear();
      });
      _setMessage('Book added successfully.');
    } catch (e) {
      _setMessage(e.toString().replaceFirst('Exception: ', ''), isError: true);
    } finally {
      setState(() => _working = false);
    }
  }

  Future<void> _removeCandidate(String bookId) async {
    try {
      setState(() => _working = true);

      final updated = await _groupService.removeCandidateBook(
        userId: widget.user.id,
        groupId: groupState.id,
        bookId: bookId,
      );

      _updateGroup(updated);
      _setMessage('Book removed.');
    } catch (e) {
      _setMessage(e.toString().replaceFirst('Exception: ', ''), isError: true);
    } finally {
      setState(() => _working = false);
    }
  }

  Future<void> _publishList() async {
    try {
      setState(() => _working = true);

      final updated = await _groupService.publishList(
        userId: widget.user.id,
        groupId: groupState.id,
      );

      _updateGroup(updated);
      _setMessage('List published successfully.');
    } catch (e) {
      _setMessage(e.toString().replaceFirst('Exception: ', ''), isError: true);
    } finally {
      setState(() => _working = false);
    }
  }

  Future<void> _startVote() async {
    try {
      setState(() => _working = true);

      final updated = await _groupService.startVote(
        userId: widget.user.id,
        groupId: groupState.id,
        durationDays: _durationDays,
      );

      _updateGroup(updated);
      _tabController.index = 2;
      _setMessage('Vote started.');
    } catch (e) {
      _setMessage(e.toString().replaceFirst('Exception: ', ''), isError: true);
    } finally {
      setState(() => _working = false);
    }
  }

  Future<void> _castVote(String bookId) async {
    try {
      setState(() => _working = true);

      final updated = await _groupService.castVote(
        userId: widget.user.id,
        groupId: groupState.id,
        bookId: bookId,
      );

      _updateGroup(updated);
      _setMessage('Vote saved.');
    } catch (e) {
      _setMessage(e.toString().replaceFirst('Exception: ', ''), isError: true);
    } finally {
      setState(() => _working = false);
    }
  }

  Future<void> _endVote() async {
    try {
      setState(() => _working = true);

      final updated = await _groupService.endVote(
        userId: widget.user.id,
        groupId: groupState.id,
      );

      _updateGroup(updated);
      _setMessage('Vote ended.');
    } catch (e) {
      _setMessage(e.toString().replaceFirst('Exception: ', ''), isError: true);
    } finally {
      setState(() => _working = false);
    }
  }

  Future<void> _leaveOrDelete() async {
    try {
      setState(() => _working = true);

      if (isOwner) {
        await _groupService.deleteGroup(
          userId: widget.user.id,
          groupId: groupState.id,
        );
      } else {
        await _groupService.leaveGroup(
          userId: widget.user.id,
          groupId: groupState.id,
        );
      }

      if (!mounted) return;
      Navigator.pop(context, true);
    } catch (e) {
      _setMessage(e.toString().replaceFirst('Exception: ', ''), isError: true);
    } finally {
      setState(() => _working = false);
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

  Widget _bookTile(BookModel book, {VoidCallback? onTap, Widget? trailing}) {
    return Card(
      child: ListTile(
        leading: book.thumbnail.isNotEmpty
            ? ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.network(
                  book.thumbnail,
                  width: 45,
                  height: 65,
                  fit: BoxFit.cover,
                ),
              )
            : const SizedBox(width: 45, height: 65),
        title: Text(book.title),
        subtitle: Text(book.authors.isNotEmpty ? book.authors.join(', ') : 'Unknown'),
        trailing: trailing,
        onTap: onTap,
      ),
    );
  }

  Widget _infoTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (groupState.currentBook != null) ...[
          const Text(
            'Assigned book',
            style: TextStyle(
              color: AppTheme.whiteText,
              fontSize: 20,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 10),
          _bookTile(groupState.currentBook!),
          const SizedBox(height: 18),
        ],
        if (isOwner) ...[
          const Text(
            'Edit group',
            style: TextStyle(
              color: AppTheme.whiteText,
              fontSize: 20,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 10),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  TextField(
                    controller: _editNameController,
                    decoration: const InputDecoration(hintText: 'Name'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _editDescriptionController,
                    maxLines: 4,
                    decoration: const InputDecoration(hintText: 'Description'),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: _working ? null : _editGroup,
                    child: const Text('Save group info'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 18),
        ],
        const Text(
          'Members',
          style: TextStyle(
            color: AppTheme.whiteText,
            fontSize: 20,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 10),
        ...groupState.members.map(
          (m) => Card(
            child: ListTile(
              title: Text(m.fullName),
              subtitle: Text(m.id == groupState.owner ? 'Owner' : 'Member'),
            ),
          ),
        ),
        const SizedBox(height: 18),
        ElevatedButton(
          onPressed: _working ? null : _leaveOrDelete,
          child: Text(isOwner ? 'Delete group' : 'Leave group'),
        ),
      ],
    );
  }

  Widget _booksTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (isOwner) ...[
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  TextField(
                    controller: _bookSearchController,
                    decoration: InputDecoration(
                      hintText: 'Search for a book...',
                      suffixIcon: IconButton(
                        onPressed: _searchBooks,
                        icon: const Icon(Icons.search),
                      ),
                    ),
                    onSubmitted: (_) => _searchBooks(),
                  ),
                  const SizedBox(height: 12),
                  if (_searching)
                    const CircularProgressIndicator()
                  else
                    ...searchResults.map(
                      (book) => _bookTile(
                        book,
                        onTap: () => _addCandidate(book),
                        trailing: const Text('+ Add'),
                      ),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  ElevatedButton(
                    onPressed: _working ? null : _publishList,
                    child: const Text('Publish list'),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<int>(
                    initialValue: _durationDays,
                    items: [1, 2, 3, 4, 5, 6, 7]
                        .map((d) => DropdownMenuItem(
                              value: d,
                              child: Text('$d day${d == 1 ? '' : 's'}'),
                            ))
                        .toList(),
                    onChanged: (value) {
                      if (value != null) {
                        setState(() {
                          _durationDays = value;
                        });
                      }
                    },
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: _working ? null : _startVote,
                    child: const Text('Start vote'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
        ],
        const Text(
          'Current candidates',
          style: TextStyle(
            color: AppTheme.whiteText,
            fontSize: 20,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 10),
        if (groupState.bookCandidates.isEmpty)
          const Text(
            'No candidates yet.',
            style: TextStyle(color: AppTheme.whiteText),
          )
        else
          ...groupState.bookCandidates.map(
            (book) => _bookTile(
              book,
              trailing: isOwner && !groupState.voteSessionActive
                  ? IconButton(
                      onPressed: _working ? null : () => _removeCandidate(book.id),
                      icon: const Icon(Icons.close),
                    )
                  : null,
            ),
          ),
      ],
    );
  }

  Widget _voteTab() {
    String statusText;
    if (!groupState.voteSessionActive || groupState.voteEndAt == null) {
      statusText = 'There is no active vote right now.';
    } else if (voteExpired) {
      statusText = 'Voting has expired. The owner can end the vote now.';
    } else {
      statusText = 'Voting ends ${groupState.voteEndAt}';
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          statusText,
          style: const TextStyle(
            color: AppTheme.whiteText,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 14),
        if (groupState.bookCandidates.isEmpty)
          const Text(
            'No candidate books yet.',
            style: TextStyle(color: AppTheme.whiteText),
          )
        else
          ...groupState.bookCandidates.map(
            (book) => Card(
              child: ListTile(
                leading: book.thumbnail.isNotEmpty
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.network(
                          book.thumbnail,
                          width: 45,
                          height: 65,
                          fit: BoxFit.cover,
                        ),
                      )
                    : const SizedBox(width: 45, height: 65),
                title: Text(book.title),
                subtitle: Text(
                  '${book.authors.isNotEmpty ? book.authors.join(', ') : 'Unknown'} • ${voteCount(book.id)} vote(s)',
                ),
                trailing: myVote == book.id
                    ? const Text('Voted')
                    : null,
                onTap: canVote ? () => _castVote(book.id) : null,
              ),
            ),
          ),
        if (isOwner && groupState.voteSessionActive) ...[
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _working ? null : _endVote,
            child: const Text('End vote now'),
          ),
        ]
      ],
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    _editNameController.dispose();
    _editDescriptionController.dispose();
    _bookSearchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: AppTheme.background,
        foregroundColor: AppTheme.whiteText,
        title: Text(groupState.name),
        centerTitle: true,
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppTheme.whiteText,
          unselectedLabelColor: Colors.white70,
          indicatorColor: Colors.white,
          tabs: const [
            Tab(text: 'Info'),
            Tab(text: 'Books'),
            Tab(text: 'Vote'),
          ],
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: _notice(),
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _infoTab(),
                _booksTab(),
                _voteTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}