import Foundation
import UniformTypeIdentifiers

enum SaveOutcome: Equatable {
  case preparing
  case saved
  case alreadySaved
  case linkOnly
  case failed
}

/// What the card shows. Filled progressively: host immediately, title once known.
struct CardModel {
  var host: String = ""
  var title: String?
  var meta: String?
  var doodle: Int?
  var outcome: SaveOutcome = .preparing
}

/// The capture pipeline (plan U4). Text is written before any image work so the
/// card can report "saved" fast; images run under the remaining budget.
@MainActor
final class SaveCoordinator: ObservableObject {
  static let totalBudget: TimeInterval = 2.0
  static let savedLinger: TimeInterval = 0.9

  @Published private(set) var card = CardModel()

  private let context: NSExtensionContext?
  private let core = CoreJS()
  private let start = Date()
  private var savedAt: Date?
  private var savedId: String?
  private var work: Task<Void, Never>?
  private var finished = false

  init(context: NSExtensionContext?) {
    self.context = context
  }

  func begin() {
    work = Task { await run() }
  }

  func undo() {
    work?.cancel()
    if let id = savedId { GroupStore.remove(id) }
    complete()
  }

  func close() { complete() }

  // MARK: Pipeline

  private func run() async {
    let input = await SharedInput.resolve(context)
    guard let rawURL = input.url else { return fail() }
    card.host = rawURL.host?.replacingOccurrences(of: "www.", with: "") ?? ""

    guard
      let identity = core.identify(rawURL.absoluteString, canonicalHint: input.safari?.canonical),
      identity.ok, let id = identity.id
    else { return fail() }
    card.doodle = identity.doodle

    if GroupStore.exists(id) { return alreadySaved() }

    if identity.isPractice == true, ArticleWriter.copyPracticeSample(to: id) {
      savedId = id
      ArticleWriter.markForIngest(id)
      card.title = "welcome to readr"
      return saved(linkOnly: false)
    }

    // Safari hands us the extraction; other apps need a fetch + off-screen extract.
    var extraction = input.safari
    var source = "safari"
    var finalIdentity = identity
    if extraction == nil {
      source = "share"
      extraction = await WebExtractor().extract(url: rawURL)
      if Task.isCancelled { return }
      // rel=canonical may reveal this is a duplicate after all.
      if let canonical = extraction?.canonical,
        let refined = core.identify(rawURL.absoluteString, canonicalHint: canonical),
        let refinedId = refined.id, refinedId != id
      {
        if GroupStore.exists(refinedId) { return alreadySaved() }
        finalIdentity = refined
      }
    }

    var meta = ArticleWriter.makeMeta(identity: finalIdentity, url: rawURL, source: source, extraction: extraction)
    do {
      try ArticleWriter.writeContent(meta, html: extraction?.ok == true ? extraction?.html : nil)
    } catch {
      return fail()
    }
    savedId = meta.id
    card.title = meta.title
    card.meta = meta.status == "link_only" ? "needs internet" : "\(meta.minutes) min · \(card.host)"
    saved(linkOnly: meta.status == "link_only")

    // Images and thumbnail within what's left of the budget.
    if meta.status != "link_only", let dir = GroupStore.articleDir(meta.id) {
      let deadline = start.addingTimeInterval(Self.totalBudget)
      let done = await ImageFetcher.fetch(meta.images, into: dir, deadline: deadline)
      for i in meta.images.indices where done.contains(meta.images[i].index) { meta.images[i].done = true }
      meta.hasThumb = await makeThumbnail(meta: meta, dir: dir, deadline: deadline)
      meta.status = meta.images.allSatisfy(\.done) ? "ready" : "partial"
      try? ArticleWriter.writeMeta(meta)
    }
    ArticleWriter.markForIngest(meta.id)
    await lingerThenComplete()
  }

  private func makeThumbnail(meta: ArticleMeta, dir: URL, deadline: Date) async -> Bool {
    let thumb = dir.appendingPathComponent("thumb.jpg")
    if let first = meta.images.first(where: \.done) {
      return ImageFetcher.makeThumbnail(from: dir.appendingPathComponent(first.file), to: thumb)
    }
    if meta.images.isEmpty, let lead = meta.leadImage,
      let tmp = await ImageFetcher.fetchLeadOnly(lead, into: dir, deadline: deadline)
    {
      defer { try? FileManager.default.removeItem(at: tmp) }
      return ImageFetcher.makeThumbnail(from: tmp, to: thumb)
    }
    return false
  }

  // MARK: Outcomes

  private func saved(linkOnly: Bool) {
    savedAt = Date()
    card.outcome = linkOnly ? .linkOnly : .saved
    linkOnly ? Haptics.warning() : Haptics.success()
  }

  private func alreadySaved() {
    card.outcome = .alreadySaved
    Haptics.warning()
    Task { await lingerThenComplete() }
  }

  private func fail() {
    card.outcome = .failed
    Haptics.warning()
    Task { await lingerThenComplete() }
  }

  private func lingerThenComplete() async {
    let shownAt = savedAt ?? Date()
    let lingerUntil = max(shownAt.addingTimeInterval(Self.savedLinger), Date())
    let cap = start.addingTimeInterval(Self.totalBudget + Self.savedLinger)
    let wait = min(lingerUntil, max(cap, Date())).timeIntervalSinceNow
    if wait > 0 { try? await Task.sleep(nanoseconds: UInt64(wait * 1_000_000_000)) }
    complete()
  }

  private func complete() {
    guard !finished else { return }
    finished = true
    context?.completeRequest(returningItems: nil)
  }
}

/// Resolves the shared item: Safari preprocessing results > URL > URL in text.
struct SharedInput {
  var url: URL?
  var safari: Extraction?

  static func resolve(_ context: NSExtensionContext?) async -> SharedInput {
    let providers = (context?.inputItems as? [NSExtensionItem] ?? []).flatMap { $0.attachments ?? [] }
    var result = SharedInput()

    for p in providers where p.hasItemConformingToTypeIdentifier(UTType.propertyList.identifier) {
      if let dict = try? await p.loadItem(forTypeIdentifier: UTType.propertyList.identifier) as? NSDictionary,
        let results = dict[NSExtensionJavaScriptPreprocessingResultsKey] as? NSDictionary,
        let json = results["result"] as? String,
        let extraction = Extraction.decode(json)
      {
        result.safari = extraction
        result.url = URL(string: extraction.url)
        return result
      }
    }
    for p in providers where p.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
      if let url = try? await p.loadItem(forTypeIdentifier: UTType.url.identifier) as? URL,
        ["http", "https"].contains(url.scheme?.lowercased() ?? "")
      {
        result.url = url
        return result
      }
    }
    for p in providers where p.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
      if let text = try? await p.loadItem(forTypeIdentifier: UTType.plainText.identifier) as? String,
        let url = Self.firstURL(in: text)
      {
        result.url = url
        return result
      }
    }
    return result
  }

  static func firstURL(in text: String) -> URL? {
    let detector = try? NSDataDetector(types: NSTextCheckingResult.CheckingType.link.rawValue)
    let range = NSRange(text.startIndex..., in: text)
    return detector?.matches(in: text, range: range)
      .compactMap(\.url)
      .first { ["http", "https"].contains($0.scheme?.lowercased() ?? "") }
  }
}
