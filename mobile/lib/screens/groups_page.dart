import 'package:flutter/material.dart';
import '../models/group.dart';
import '../models/user.dart';
import '../services/group_service.dart';
import '../theme/app_theme.dart';
import 'group_detail_page.dart';

class GroupsPage extends StatefulWidget {
  final UserModel user;

  const GroupsPage({super.key, required this.user});

  @override
  State<GroupsPage> createState() => _GroupsPageState();
}

class _GroupsPageState extends State<GroupsPage> with SingleTickerProviderStateMixin {
  final _groupService = GroupService();

  late TabController _tabController;

  final _searchController = TextEditingController();
  final _createNameController = TextEditingController();
  final _createDescriptionController = TextEditingController();

  bool _loadingMyGroups = true;
  bool _loadingDiscover = true;
  bool _creating = false;
  String _message = '';
  bool _messageIsError = false;

  List<GroupModel> myGroups = [];
  List<GroupModel> discoverGroups = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadAllGroups();
  }

  Future<void> _loadAllGroups() async {
    await Future.wait([
      _loadMyGroups(),
      _loadDiscoverGroups(),
    ]);
  }

  Future<void> _loadMyGroups({String search = ''}) async {
    try {
      final groups = await _groupService.getMyGroups(
        widget.user.id,
        search: search,
      );

      setState(() {
        myGroups = groups;
        _loadingMyGroups = false;
      });
    } catch (e) {
      setState(() {
        _message = e.toString().replaceFirst('Exception: ', '');
        _messageIsError = true;
        _loadingMyGroups = false;
      });
    }
  }

  Future<void> _loadDiscoverGroups({String search = ''}) async {
    try {
      final groups = await _groupService.getDiscoverGroups(search: search);

      setState(() {
        discoverGroups = groups;
        _loadingDiscover = false;
      });
    } catch (e) {
      setState(() {
        _message = e.toString().replaceFirst('Exception: ', '');
        _messageIsError = true;
        _loadingDiscover = false;
      });
    }
  }

  Future<void> _createGroup() async {
    final name = _createNameController.text.trim();
    final description = _createDescriptionController.text.trim();

    if (name.isEmpty) {
      setState(() {
        _message = 'Group name cannot be empty.';
        _messageIsError = true;
      });
      return;
    }

    setState(() {
      _creating = true;
      _message = '';
    });

    try {
      await _groupService.createGroup(
        userId: widget.user.id,
        name: name,
        description: description,
      );

      _createNameController.clear();
      _createDescriptionController.clear();

      setState(() {
        _message = 'Group created successfully.';
        _messageIsError = false;
        _tabController.index = 0;
      });

      await _loadAllGroups();
    } catch (e) {
      setState(() {
        _message = e.toString().replaceFirst('Exception: ', '');
        _messageIsError = true;
      });
    } finally {
      setState(() {
        _creating = false;
      });
    }
  }

  Future<void> _joinGroup(String groupId) async {
    try {
      await _groupService.joinGroup(
        userId: widget.user.id,
        groupId: groupId,
      );

      setState(() {
        _message = 'Joined group successfully.';
        _messageIsError = false;
      });

      await _loadAllGroups();
    } catch (e) {
      setState(() {
        _message = e.toString().replaceFirst('Exception: ', '');
        _messageIsError = true;
      });
    }
  }

  Future<void> _openGroup(GroupModel group) async {
    final changed = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => GroupDetailPage(
          user: widget.user,
          group: group,
        ),
      ),
    );

    if (changed == true) {
      await _loadAllGroups();
    } else {
      await _loadAllGroups();
    }
  }

  void _searchCurrentTab() {
    final value = _searchController.text.trim();

    if (_tabController.index == 0) {
      _loadMyGroups(search: value);
    } else if (_tabController.index == 1) {
      _loadDiscoverGroups(search: value);
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

  Widget _groupCard(GroupModel group, {bool discover = false}) {
    final isOwner = group.owner == widget.user.id;
    final isMember = group.members.any((m) => m.id == widget.user.id);

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: () => _openGroup(group),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      group.name,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.dark,
                      ),
                    ),
                  ),
                  if (isOwner)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.background,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: const Text(
                        'Owner',
                        style: TextStyle(color: Colors.white, fontSize: 12),
                      ),
                    )
                  else if (isMember)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black12,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: const Text(
                        'Joined',
                        style: TextStyle(color: AppTheme.dark, fontSize: 12),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                '${group.members.length} members',
                style: const TextStyle(
                  color: Colors.black54,
                  fontWeight: FontWeight.w600,
                ),
              ),
              if (group.description.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  group.description,
                  style: const TextStyle(color: AppTheme.dark),
                ),
              ],
              const SizedBox(height: 10),
              Text(
                group.currentBook != null
                    ? 'Assigned book: ${group.currentBook!.title}'
                    : group.voteSessionActive
                        ? 'Vote in progress for next book'
                        : 'No assigned book yet',
                style: const TextStyle(
                  color: AppTheme.dark,
                  fontWeight: FontWeight.w600,
                ),
              ),
              if (discover && !isMember) ...[
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () => _joinGroup(group.id),
                  child: const Text('Join'),
                ),
              ]
            ],
          ),
        ),
      ),
    );
  }

  Widget _myGroupsTab() {
    if (_loadingMyGroups) {
      return const Center(child: CircularProgressIndicator());
    }

    if (myGroups.isEmpty) {
      return const Center(
        child: Text(
          'No groups yet.',
          style: TextStyle(color: AppTheme.whiteText, fontSize: 16),
        ),
      );
    }

    return ListView.builder(
      itemCount: myGroups.length,
      itemBuilder: (context, index) => _groupCard(myGroups[index]),
    );
  }

  Widget _discoverTab() {
    if (_loadingDiscover) {
      return const Center(child: CircularProgressIndicator());
    }

    if (discoverGroups.isEmpty) {
      return const Center(
        child: Text(
          'No matching groups.',
          style: TextStyle(color: AppTheme.whiteText, fontSize: 16),
        ),
      );
    }

    return ListView.builder(
      itemCount: discoverGroups.length,
      itemBuilder: (context, index) => _groupCard(discoverGroups[index], discover: true),
    );
  }

  Widget _createTab() {
    return SingleChildScrollView(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Create a new group',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.dark,
                ),
              ),
              const SizedBox(height: 10),
              const Text(
                'Start a reading group and invite people to join.',
                style: TextStyle(color: AppTheme.dark),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _createNameController,
                decoration: const InputDecoration(
                  hintText: 'Example: Fantasy Fridays',
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _createDescriptionController,
                maxLines: 5,
                decoration: const InputDecoration(
                  hintText: 'What does your group read or focus on?',
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _creating ? null : _createGroup,
                child: Text(_creating ? 'Creating...' : 'Create Group'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    _createNameController.dispose();
    _createDescriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: AppTheme.background,
        foregroundColor: AppTheme.whiteText,
        title: const Text('Groups'),
        centerTitle: true,
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppTheme.whiteText,
          unselectedLabelColor: Colors.white70,
          indicatorColor: Colors.white,
          tabs: const [
            Tab(text: 'My Groups'),
            Tab(text: 'Discover'),
            Tab(text: 'Create'),
          ],
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _notice(),
            TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: _tabController.index == 1
                    ? 'Search all groups...'
                    : 'Search my groups...',
                suffixIcon: IconButton(
                  onPressed: _searchCurrentTab,
                  icon: const Icon(Icons.search),
                ),
              ),
              onSubmitted: (_) => _searchCurrentTab(),
            ),
            const SizedBox(height: 14),
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _myGroupsTab(),
                  _discoverTab(),
                  _createTab(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}