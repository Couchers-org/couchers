package expo.modules.platformcapabilities

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Keep in lockstep with ios/PlatformCapabilitiesModule.swift.
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
