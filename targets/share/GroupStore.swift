import Foundation

/// App Group layout shared with the app (src/data/sharedContainer.ts).
///   articles/<id>/meta.json · content.html · images/ · thumb.jpg
///   inbox/<id>              (marker: "ingest me", written last)
///   samples/welcome/        (seeded by the app for the practice save)
enum GroupStore {
  /// Must match APP_GROUP in app.config.ts.
  static let appGroup = "group.com.devesh.readr"

  static var root: URL? {
    FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroup)
  }

  static func articleDir(_ id: String) -> URL? { root?.appendingPathComponent("articles/\(id)", isDirectory: true) }
  static func inboxMarker(_ id: String) -> URL? { root?.appendingPathComponent("inbox/\(id)") }
  static var practiceSample: URL? { root?.appendingPathComponent("samples/welcome", isDirectory: true) }

  static func exists(_ id: String) -> Bool {
    guard let dir = articleDir(id) else { return false }
    return FileManager.default.fileExists(atPath: dir.appendingPathComponent("meta.json").path)
  }

  static func remove(_ id: String) {
    if let dir = articleDir(id) { try? FileManager.default.removeItem(at: dir) }
    if let marker = inboxMarker(id) { try? FileManager.default.removeItem(at: marker) }
  }
}
