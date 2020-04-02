# webkms-switch ChangeLog

## 2.0.0 - 2020-04-02

### Changed
- **BREAKING**: Use ocapld@2.
- **BREAKING**: Use Use http-signature-zcap-verify@3.

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
