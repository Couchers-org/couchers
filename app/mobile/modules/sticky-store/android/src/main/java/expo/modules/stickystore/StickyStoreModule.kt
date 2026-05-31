package expo.modules.stickystore

import com.google.android.gms.auth.blockstore.Blockstore
import com.google.android.gms.auth.blockstore.DeleteBytesRequest
import com.google.android.gms.auth.blockstore.RetrieveBytesRequest
import com.google.android.gms.auth.blockstore.StoreBytesData
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class StickyStoreModule : Module() {
  private val client by lazy {
    val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
    Blockstore.getClient(context)
  }

  override fun definition() = ModuleDefinition {
    Name("StickyStore")

    AsyncFunction("setItem") { key: String, value: String, promise: Promise ->
      val data = StoreBytesData.Builder()
        .setBytes(value.toByteArray(Charsets.UTF_8))
        .setKey(key)
        // Back up to the cloud so the value restores onto the user's next device,
        // not just across reinstalls on this one.
        .setShouldBackupToCloud(true)
        .build()
      client.storeBytes(data)
        .addOnSuccessListener { promise.resolve(null) }
        .addOnFailureListener { promise.reject("ERR_STICKY_STORE_WRITE", it.message, it) }
    }

    AsyncFunction("getItem") { key: String, promise: Promise ->
      val request = RetrieveBytesRequest.Builder()
        .setKeys(listOf(key))
        .build()
      client.retrieveBytes(request)
        .addOnSuccessListener { response ->
          val entry = response.blockstoreDataMap[key]
          promise.resolve(entry?.bytes?.toString(Charsets.UTF_8))
        }
        .addOnFailureListener { promise.reject("ERR_STICKY_STORE_READ", it.message, it) }
    }

    AsyncFunction("removeItem") { key: String, promise: Promise ->
      val request = DeleteBytesRequest.Builder()
        .setKeys(listOf(key))
        .build()
      client.deleteBytes(request)
        .addOnSuccessListener { promise.resolve(null) }
        .addOnFailureListener { promise.reject("ERR_STICKY_STORE_DELETE", it.message, it) }
    }
  }
}
