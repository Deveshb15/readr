import SwiftUI
import UIKit

/// Entry point (NSExtensionPrincipalClass). Shows the card on the first frame,
/// then starts the pipeline. No React Native in this process (plan P1, P2).
final class ShareViewController: UIViewController {
  private lazy var coordinator = SaveCoordinator(context: extensionContext)

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = .clear
    overrideUserInterfaceStyle = .light

    let host = UIHostingController(rootView: SaveCardView(coordinator: coordinator))
    host.view.backgroundColor = .clear
    addChild(host)
    view.addSubview(host.view)
    host.view.translatesAutoresizingMaskIntoConstraints = false
    NSLayoutConstraint.activate([
      host.view.topAnchor.constraint(equalTo: view.topAnchor),
      host.view.bottomAnchor.constraint(equalTo: view.bottomAnchor),
      host.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
      host.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
    ])
    host.didMove(toParent: self)
  }

  override func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)
    coordinator.begin()
  }
}
