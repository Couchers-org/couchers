import ExpoModulesCore

public class NativeBuildInfoModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NativeBuildInfo")

    Constants([
      "embeddedDisplayVersion":
        Bundle.main.infoDictionary?["CouchersNativeDisplayVersion"] as? String ?? "unknown",
      "embeddedDebugVersion":
        Bundle.main.infoDictionary?["CouchersNativeDebugVersion"] as? String ?? "unknown",
    ])
  }
}
