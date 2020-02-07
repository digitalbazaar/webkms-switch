# webkms-switch ChangeLog

## 1.2.0 - TBD

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
