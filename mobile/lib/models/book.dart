class BookModel {
  final String id;
  final String googleBooksId;
  final String title;
  final List<String> authors;
  final String description;
  final List<String> categories;
  final String thumbnail;

  BookModel({
    required this.id,
    required this.googleBooksId,
    required this.title,
    required this.authors,
    required this.description,
    required this.categories,
    required this.thumbnail,
  });

  factory BookModel.fromJson(Map<String, dynamic> json) {
    return BookModel(
      id: json['_id'] ?? '',
      googleBooksId: json['googleBooksId'] ?? '',
      title: json['title'] ?? '',
      authors: List<String>.from(json['authors'] ?? []),
      description: json['description'] ?? '',
      categories: List<String>.from(json['categories'] ?? []),
      thumbnail: json['thumbnail'] ?? '',
    );
  }
}