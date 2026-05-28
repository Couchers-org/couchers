import ExpoModulesCore

public class NativeBuildInfoModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NativeBuildInfo")

    Constants([
      "nativeDisplayVersion":
        Bundle.main.infoDictionary?["CouchersNativeDisplayVersion"] as? String ?? "unknown",
      "nativeGitHash":
        Bundle.main.infoDictionary?["CouchersNativeGitHash"] as? String ?? "unknown",
      "nativeBuiltAt":
        Bundle.main.infoDictionary?["CouchersNativeBuiltAt"] as? String ?? "unknown",
    ])
  }
}
