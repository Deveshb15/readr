import UIKit

/// Mirrors src/design/haptics.ts semantics. Haptics may be suppressed in extensions on
/// some iOS versions; the card's visual state always carries the meaning.
enum Haptics {
  static func success() { UINotificationFeedbackGenerator().notificationOccurred(.success) }
  static func warning() { UINotificationFeedbackGenerator().notificationOccurred(.warning) }
  static func press() { UIImpactFeedbackGenerator(style: .light).impactOccurred() }
}
