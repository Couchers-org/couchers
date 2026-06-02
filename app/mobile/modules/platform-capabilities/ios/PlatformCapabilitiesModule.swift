import ExpoModulesCore

// Hardcoded registry for THIS native build. Bump the version and add a
// capability name in the same change as the underlying iOS native code; the
// matching Android list lives in PlatformCapabilitiesModule.kt and must be kept
// in lockstep (a capability that's present on one platform but missing on the
// other is reported as missing, since each device only sees its own list).
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
