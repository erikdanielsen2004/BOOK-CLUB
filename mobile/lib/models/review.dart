class ReviewUserModel {
  final String firstName;
  final String lastName;

  ReviewUserModel({
    required this.firstName,
    required this.lastName,
  });

  factory ReviewUserModel.fromJson(Map<String, dynamic> json) {
    return ReviewUserModel(
      firstName: (json['firstName'] ?? '').toString(),
      lastName: (json['lastName'] ?? '').toString(),
    );
  }

  String get fullName {
    final name = '$firstName $lastName'.trim();
    return name.isEmpty ? 'Unknown User' : name;
  }
}

class ReviewModel {
  final String id;
  final double rating;
  final String reviewText;
  final String createdAt;
  final ReviewUserModel user;

  ReviewModel({
    required this.id,
    required this.rating,
    required this.reviewText,
    required this.createdAt,
    required this.user,
  });

  factory ReviewModel.fromJson(Map<String, dynamic> json) {
    return ReviewModel(
      id: (json['_id'] ?? '').toString(),
      rating: (json['rating'] ?? 0).toDouble(),
      reviewText: (json['reviewText'] ?? '').toString(),
      createdAt: (json['createdAt'] ?? '').toString(),
      user: ReviewUserModel.fromJson(
        Map<String, dynamic>.from(json['user'] ?? {}),
      ),
    );
  }
}