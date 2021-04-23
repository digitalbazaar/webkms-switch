# webkms-switch ChangeLog

## 5.0.0 - 2021-04-TBD

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
