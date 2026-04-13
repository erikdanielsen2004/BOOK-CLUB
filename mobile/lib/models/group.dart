import 'book.dart';

class GroupMember {
  final String id;
  final String firstName;
  final String lastName;

  GroupMember({
    required this.id,
    required this.firstName,
    required this.lastName,
  });

  String get fullName {
    final name = '$firstName $lastName'.trim();
    return name.isEmpty ? 'Unknown User' : name;
  }

  factory GroupMember.fromJson(Map<String, dynamic> json) {
    return GroupMember(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      firstName: (json['firstName'] ?? '').toString(),
      lastName: (json['lastName'] ?? '').toString(),
    );
  }
}

class GroupVote {
  final String id;
  final String userId;
  final String bookId;

  GroupVote({
    required this.id,
    required this.userId,
    required this.bookId,
  });

  factory GroupVote.fromJson(Map<String, dynamic> json) {
    return GroupVote(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      userId: (json['user'] is Map ? json['user']['_id'] : json['user'] ?? '').toString(),
      bookId: (json['book'] is Map ? json['book']['_id'] : json['book'] ?? '').toString(),
    );
  }
}

class GroupModel {
  final String id;
  final String name;
  final String description;
  final String owner;
  final List<GroupMember> members;
  final BookModel? currentBook;
  final List<BookModel> bookCandidates;
  final List<GroupVote> votes;
  final bool voteSessionActive;
  final String? voteStartAt;
  final String? voteEndAt;
  final String? createdAt;

  GroupModel({
    required this.id,
    required this.name,
    required this.description,
    required this.owner,
    required this.members,
    required this.currentBook,
    required this.bookCandidates,
    required this.votes,
    required this.voteSessionActive,
    required this.voteStartAt,
    required this.voteEndAt,
    required this.createdAt,
  });

  factory GroupModel.fromJson(Map<String, dynamic> json) {
    return GroupModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      name: (json['name'] ?? 'Untitled Group').toString(),
      description: (json['description'] ?? '').toString(),
      owner: (json['owner'] is Map ? json['owner']['_id'] : json['owner'] ?? '').toString(),
      members: List<Map<String, dynamic>>.from(json['members'] ?? [])
          .map((m) => GroupMember.fromJson(m))
          .toList(),
      currentBook: json['currentBook'] != null
          ? BookModel.fromJson(Map<String, dynamic>.from(json['currentBook']))
          : null,
      bookCandidates: List<Map<String, dynamic>>.from(json['bookCandidates'] ?? [])
          .map((b) => BookModel.fromJson(b))
          .toList(),
      votes: List<Map<String, dynamic>>.from(json['votes'] ?? [])
          .map((v) => GroupVote.fromJson(v))
          .toList(),
      voteSessionActive: json['voteSessionActive'] == true,
      voteStartAt: json['voteStartAt']?.toString(),
      voteEndAt: json['voteEndAt']?.toString(),
      createdAt: json['createdAt']?.toString(),
    );
  }
}