# @digitalbazaar/webkms-switch ChangeLog

## 10.2.0 - 2022-05-16

### Added
- Allow webkms application servers to set `req.webkms` keystore config.
  Only ensure that the value matches what is expected and augment
  `req.webkms` with the parsed KMS operation.

## 10.1.0 - 2022-05-16

### Added
- Add option to pass a custom `getRootController` for KMS operation zcap
  authorization.

## 10.0.0 - 2022-03-03

### Changed
- **BREAKING**: Move zcap revocations to `/zcaps/revocations` to better
  future proof.
- **BREAKING**: Use `@digitalbazaar/ezcap-express@6`.
- **BREAKING**: This version is compatible with
  `@digitalbazaar/webkms-client@10`.

## 9.2.0 - 2022-02-08

### Added
- Allow `maxChainLength`, `maxClockSkew`, and `maxDelegationTtl` to be
  passed when creating operation middleware.

## 9.1.0 - 2022-01-14

### Added
- Allow `maxCapabilityChainLength` to be included in generate
  and update key operations.
- Pass `zcapInvocation` from ezcap-express (`req.zcap`) through
  to `runOperation` and called `method`. This information allows
  specific key operations to consider how the key was invoked
  in determining whether to complete the key operation or not;
  one use case is to prohibit invocations that use zcap chains
  that are too long.

### Fixed
- Ensure `onError` is called when an error occurs during a
  KMS operation.

## 9.0.3 - 2022-01-11

### Fixed
- Fix imports.

## 9.0.2 - 2022-01-11

### Fixed
- Fix linting errors.

## 9.0.1 - 2022-01-11

### Changed
- Update dependencies.

### Fixed
- Fix schema warning.

## 9.0.0 - 2022-01-11

### Added
- Pass `controller` (controller of the key) to KMS module key operation
  methods. This value must be included to enable `publicAliasTemplate`
  processing when generating keys and getting key descriptions.
- Optionally accept `publicAlias` and `publicAliasTemplate` in generate key
  operations.
- Define `UpdateKeyOperation` schema.

### Changed
- **BREAKING**: `createMiddleware` has been renamed to
  `createOperationMiddleware` to more clearly express what it is a middleware
  for KMS operations.
- **BREAKING**: Use new versions of ezcap-express and zcapld. This means that
  `suiteFactory` is now a required parameter for `createOperationMiddleware`,
  replacing `suite`.
- **BREAKING**: `runOperation` now returns the `keyId` for the key from the
  operation that was run.

### Removed
- **BREAKING**: Remove unused and out-of-date `capabilityInvocationProof`
  JSON schema.

## 8.0.0 - 2021-10-07

### Changed
- **BREAKING**: Always use `https://` protocol prefix when generating key IDs
  during a `GenerateKeyOperation` operation. Although the local KMS server
  instance may be running in HTTP mode (behind a firewall/proxy) and received
  the request from a proxy/firewall via HTTP, the URLs for keys should always
  be HTTPS. External parties will always access the key via HTTPS.

## 7.0.0 - 2021-07-22

### Added
- Auto-generate key ID when not present in key gen operations.
- Added `onSuccess` optional handler that will be called after a WebKMS
  operation has succeeded and a response has been scheduled.

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
- Old `validateOperation` function. Use `createMiddleware` instead on a
  keystore's `/keys` route to both validate and run a WebKMS operation. A
  `runOperation` method is still exposed for testing purposes, but it does
  no validation of the operation passed to it.
- **BREAKING**: Do not allow `controller` when generating a key, this
  value will be determined by the keystore.

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
