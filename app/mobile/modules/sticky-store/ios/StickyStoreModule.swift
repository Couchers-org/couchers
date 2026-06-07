import ExpoModulesCore
import Security

// Keychain operation failed with a non-recoverable OSStatus.
internal class KeychainException: GenericException<OSStatus> {
  override var reason: String {
    "Keychain operation failed with status \(param)"
  }
}

// The value passed in could not be represented as UTF-8 bytes.
internal class EncodingException: Exception {
  override var reason: String {
    "Value could not be encoded as UTF-8"
  }
}

public class StickyStoreModule: Module {
  // Shared keychain service namespace for every sticky-store item.
  private let service = "org.couchers.stickystore"

  public func definition() -> ModuleDefinition {
    Name("StickyStore")

    AsyncFunction("setItem") { (key: String, value: String) in
      try self.set(key: key, value: value)
    }

    AsyncFunction("getItem") { (key: String) -> String? in
      try self.get(key: key)
    }

    AsyncFunction("removeItem") { (key: String) in
      try self.remove(key: key)
    }
  }

  private func baseQuery(_ key: String) -> [String: Any] {
    return [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: key,
      // Sync this item to the user's other devices via iCloud Keychain.
      kSecAttrSynchronizable as String: kCFBooleanTrue as Any,
    ]
  }

  private func set(key: String, value: String) throws {
    guard let data = value.data(using: .utf8) else {
      throw EncodingException()
    }
    let attributes: [String: Any] = [
      kSecValueData as String: data,
      // AfterFirstUnlock (not ...ThisDeviceOnly) so the item is readable at launch
      // and remains eligible for iCloud Keychain sync.
      kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock,
    ]

    let query = baseQuery(key)
    var status = SecItemAdd(query.merging(attributes) { $1 } as CFDictionary, nil)
    if status == errSecDuplicateItem {
      status = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
    }
    guard status == errSecSuccess else {
      throw KeychainException(status)
    }
  }

  private func get(key: String) throws -> String? {
    var query = baseQuery(key)
    query[kSecReturnData as String] = kCFBooleanTrue
    query[kSecMatchLimit as String] = kSecMatchLimitOne

    var item: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &item)
    if status == errSecItemNotFound {
      return nil
    }
    guard status == errSecSuccess else {
      throw KeychainException(status)
    }
    guard let data = item as? Data else {
      return nil
    }
    return String(data: data, encoding: .utf8)
  }

  private func remove(key: String) throws {
    let status = SecItemDelete(baseQuery(key) as CFDictionary)
    guard status == errSecSuccess || status == errSecItemNotFound else {
      throw KeychainException(status)
    }
  }
}
