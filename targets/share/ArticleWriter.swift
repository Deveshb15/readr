import Foundation

/// Mirrors ArticleMeta in src/data/articleMeta.ts (schema 1).
struct MetaImage: Codable {
  let index: Int
  let src: String
  let file: String
  let width: Int?
  let height: Int?
  var done: Bool
}

struct ArticleMeta: Codable {
  var schema = 1
  let id: String
  let url: String
  let canonicalUrl: String
  var title: String
  var byline: String?
  var site: String?
  var excerpt: String?
  var lang: String?
  let doodle: Int
  var minutes: Int
  var wordCount: Int
  var status: String  // ready | partial | link_only
  let source: String  // safari | share | practice
  let savedAt: String
  var leadImage: String?
  var hasThumb: Bool
  var images: [MetaImage]
}

/// Writes article folders atomically. Order matters: content + meta first,
/// inbox marker last, so the app never ingests a half-written folder.
enum ArticleWriter {
  static func makeMeta(identity: Identity, url: URL, source: String, extraction: Extraction?) -> ArticleMeta {
    let host = url.host?.replacingOccurrences(of: "www.", with: "")
    let ok = extraction?.ok == true
    let images: [MetaImage] = ok ? (extraction?.images ?? []).map {
      MetaImage(index: $0.index, src: $0.src, file: $0.file, width: $0.width, height: $0.height, done: false)
    } : []
    return ArticleMeta(
      id: identity.id ?? "",
      url: url.absoluteString,
      canonicalUrl: identity.canonicalUrl ?? url.absoluteString,
      title: (extraction?.title?.isEmpty == false ? extraction?.title : nil) ?? host ?? url.absoluteString,
      byline: ok ? extraction?.byline : nil,
      site: extraction?.siteName ?? host,
      excerpt: ok ? extraction?.excerpt : nil,
      lang: extraction?.lang,
      doodle: identity.doodle ?? 0,
      minutes: ok ? max(1, extraction?.minutes ?? 1) : 0,
      wordCount: ok ? (extraction?.wordCount ?? 0) : 0,
      status: ok ? (images.isEmpty ? "ready" : "partial") : "link_only",
      source: source,
      savedAt: ISO8601DateFormatter().string(from: Date()),
      leadImage: ok ? extraction?.leadImage : nil,
      hasThumb: false,
      images: images
    )
  }

  static func writeContent(_ meta: ArticleMeta, html: String?) throws {
    guard let dir = GroupStore.articleDir(meta.id) else { throw CocoaError(.fileNoSuchFile) }
    try FileManager.default.createDirectory(at: dir.appendingPathComponent("images"), withIntermediateDirectories: true)
    if let html { try Data(html.utf8).write(to: dir.appendingPathComponent("content.html"), options: .atomic) }
    try writeMeta(meta)
  }

  static func writeMeta(_ meta: ArticleMeta) throws {
    guard let dir = GroupStore.articleDir(meta.id) else { throw CocoaError(.fileNoSuchFile) }
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.sortedKeys]
    try encoder.encode(meta).write(to: dir.appendingPathComponent("meta.json"), options: .atomic)
  }

  static func markForIngest(_ id: String) {
    guard let marker = GroupStore.inboxMarker(id) else { return }
    try? FileManager.default.createDirectory(at: marker.deletingLastPathComponent(), withIntermediateDirectories: true)
    try? Data().write(to: marker, options: .atomic)
  }

  /// Practice save: copy the app-seeded sample instead of fetching (works offline).
  static func copyPracticeSample(to id: String) -> Bool {
    guard
      let sample = GroupStore.practiceSample,
      let dir = GroupStore.articleDir(id),
      FileManager.default.fileExists(atPath: sample.appendingPathComponent("meta.json").path)
    else { return false }
    do {
      try FileManager.default.createDirectory(at: dir.deletingLastPathComponent(), withIntermediateDirectories: true)
      try FileManager.default.copyItem(at: sample, to: dir)
      // Stamp id/savedAt so ingest treats it as a fresh practice save.
      let metaURL = dir.appendingPathComponent("meta.json")
      var meta = try JSONDecoder().decode(ArticleMeta.self, from: Data(contentsOf: metaURL))
      meta = ArticleMeta(
        id: id, url: meta.url, canonicalUrl: meta.canonicalUrl, title: meta.title, byline: meta.byline,
        site: meta.site, excerpt: meta.excerpt, lang: meta.lang, doodle: meta.doodle, minutes: meta.minutes,
        wordCount: meta.wordCount, status: meta.status, source: "practice",
        savedAt: ISO8601DateFormatter().string(from: Date()), leadImage: meta.leadImage,
        hasThumb: meta.hasThumb, images: meta.images)
      try writeMeta(meta)
      return true
    } catch {
      try? FileManager.default.removeItem(at: dir)
      return false
    }
  }
}
