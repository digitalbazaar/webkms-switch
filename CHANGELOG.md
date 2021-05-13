# webkms-switch ChangeLog

## 7.0.0 - 2021-05-xx

### Changed
- **BREAKING**: This module has undergone a significant rewrite to simplify
  webkms server implementations. It now exposes a `createMiddleware` function
  that is to be used as the main handler for a keystore's `/keys` route. The
  handler will validate KMS operations and attempt to execute them by relying
  on provided the interfaces: `KeystoreConfigStorage` and `ModuleManager`.
- **BREAKING**: Key descriptions must now be stored independently by individual
  WebKMS modules. These modules already had to store key information, this
  change consolidates all key description information in one place to simplify
  implementations. This module instead now requires the user to implement a
  storage interface (`KeystoreConfigStorage`) for getting keystore
  configuration. The `get` function in this interface will be passed the HTTP
  request object and `keyId` for the key that is (or is to be generated) in the
  requested keystore. It must return the keystore config which must contain the
  `kmsModule` identifier to use for all keys in that keystore. It may perform
  additional security checks on the request (such as IP security measures)
  and throw exceptions if the keystore config should not be returned.
- **BREAKING**: This module now relies on `ezcap-express` and the
  `urn:zcap:root` identifier scheme for root zcaps. A keystore's root zcap
  is now the root zcap for all keys in the keystore.
- Now HTTP digests will be computed for KMS operations that travel in HTTP
  request bodies and checked against the HTTP Digest header value. Users of
  this library need not perform that check on their own.

### Removed
- Old `validateOperation` and `runOperation` functions. Use `createMiddleware`
  instead on a keystore's `/keys` route.

## 6.0.0 - 2021-05-10

### Changed
- **BREAKING**: Remove key-type specific contexts. This package should be
  key-type agnostic. The key-type specific contexts were being used for
  validation; this has been replaced with a new required
  `validateKeyType` function that must be passed to `validateOperation`.
  This function must return `{valid: true/false, error: Error/undefined/null}`
  and will receive `{operation}` as a parameter -- when the operation type
  is a key generation operation.

## 5.0.0 - 2021-05-04

### Changed
- **BREAKING**: Context for GenerateKeyOperation is now type array.
- Update dependencies.
  - **BREAKING**: Remove `security-context` and Use [webkms-context@1.0](https://github.com/digitalbazaar/webkms-context/blob/main/CHANGELOG.md).
  - Use [`ed25519-signature-2020-context@1.1.0`](https://github.com/digitalbazaar/ed25519-signature-2020-context/blob/master/CHANGELOG.md).
  - Use [`aes-key-wrapping-2019-context@1.0.3`](https://github.com/digitalbazaar/aes-key-wrapping-2019-context/blob/main/CHANGELOG.md).
  - Use [`sha256-hmac-key-2019-context@1.0.3`](https://github.com/digitalbazaar/sha256-hmac-key-2019-context/blob/main/CHANGELOG.md).
  - Use [`http-signature-zcap-verify@7.0.0`](https://github.com/digitalbazaar/http-signature-zcap-verify/blob/main/CHANGELOG.md)

## 4.0.0 - 2021-04-08

### Changed
- **BREAKING**: Use `http-signature-zcap-verify@6`.
  - Only support `Ed25519Signature2020` proofs.
  - Node.js >= 12 is required
  - https://github.com/digitalbazaar/http-signature-zcap-verify/blob/main/CHANGELOG.md
- Remove unused dependencies (`ocapld`, `jsonld-signatures`).

## 3.0.0 - 2021-03-09

### Changed
- **BREAKING**: Use http-signature-zcap-verify@4.
- Use jsonld-signatures@7.

## 2.0.0 - 2020-04-02

### Changed
- **BREAKING**: Use ocapld@2.
- **BREAKING**: Use http-signature-zcap-verify@3.

## 1.4.0 - 2020-02-19

### Changed
- Use http-signature-zcap-verify@2.

## 1.3.0 - 2020-02-14

### Changed
- Use jsonld-signatures@5.

## 1.2.0 - 2020-02-07

### Added
- Add support for `inspectCapabilityChain` handler in `validateOperation`. This
  handler can be used to check for revocations in a capability chain.

## 1.1.0 - 2020-02-04

### Changed
- Do not require `controller` when generating a key. The controller
  must match the keystore for the key regardless, so do not require
  it to be sent in a key generation operation.

## 1.0.0 - 2019-12-20

### Added
- Add core files.

- See git history for changes previous to this release.
