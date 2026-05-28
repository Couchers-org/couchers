package expo.modules.nativebuildinfo

import android.content.pm.PackageManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NativeBuildInfoModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("NativeBuildInfo")

    Constants {
      val context = appContext.reactContext ?: return@Constants mapOf(
        "nativeDisplayVersion" to "unknown",
        "nativeGitHash" to "unknown",
        "nativeBuiltAt" to "unknown",
      )

      val metaData = try {
        context.packageManager
          .getApplicationInfo(context.packageName, PackageManager.GET_META_DATA)
          .metaData
      } catch (e: Exception) {
        null
      }

      mapOf(
        "nativeDisplayVersion" to (metaData?.getString("CouchersNativeDisplayVersion") ?: "unknown"),
        "nativeGitHash" to (metaData?.getString("CouchersNativeGitHash") ?: "unknown"),
        "nativeBuiltAt" to (metaData?.getString("CouchersNativeBuiltAt") ?: "unknown"),
      )
    }
  }
}
