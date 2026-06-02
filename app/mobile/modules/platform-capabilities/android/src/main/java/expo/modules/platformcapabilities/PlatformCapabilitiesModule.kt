package expo.modules.platformcapabilities

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Hardcoded registry for THIS native build. Bump the version and add a
// capability name in the same change as the underlying Android native code; the
// matching iOS list lives in PlatformCapabilitiesModule.swift and must be kept
// in lockstep (a capability that's present on one platform but missing on the
// other is reported as missing, since each device only sees its own list).
private const val CAPABILITY_PLATFORM_VERSION: Int = 1
private val CAPABILITIES: List<String> = emptyList()

class PlatformCapabilitiesModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PlatformCapabilities")

    Constants(
      "capabilityPlatformVersion" to CAPABILITY_PLATFORM_VERSION,
      "capabilities" to CAPABILITIES,
    )
  }
}
