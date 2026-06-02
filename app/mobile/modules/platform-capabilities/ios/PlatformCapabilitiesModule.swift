import ExpoModulesCore

// Keep in lockstep with android/.../PlatformCapabilitiesModule.kt.
private let CAPABILITY_PLATFORM_VERSION: Int = 1
private let CAPABILITIES: [String] = []

public class PlatformCapabilitiesModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PlatformCapabilities")

    Constants([
      "capabilityPlatformVersion": CAPABILITY_PLATFORM_VERSION,
      "capabilities": CAPABILITIES,
    ])
  }
}
