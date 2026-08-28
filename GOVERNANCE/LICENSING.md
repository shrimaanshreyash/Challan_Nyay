# Licensing plan

## Current legal status

No root `LICENSE` file has been added yet. The project is therefore not being presented as open source at this stage. The competition states that builders retain ownership, but a public repository does not by itself grant reuse rights.

## Recommendation

- **Original source code:** Apache License 2.0.
- **Original public documentation:** Creative Commons Attribution 4.0 International.
- **Brand name, logo, and visual identity:** reserve separately unless the user chooses to license them.
- **Synthetic fixture documents/images:** licence explicitly as original project assets or list their generator/source terms.
- **Third-party components/assets:** remain under their respective licences and are listed in `THIRD_PARTY_NOTICES.md`.

## Why Apache-2.0

- permissive reuse suitable for civic/public-service software;
- explicit patent licence and contribution terms;
- requires preservation of copyright and licence notices;
- compatible with many commercial and open-source environments.

Trade-off: anyone may reuse and redistribute the code under its terms. If retaining exclusive commercial control is more important, do not add Apache-2.0; keep the repository private and use an explicit proprietary notice. This choice must be confirmed before a root licence is created.

## Before publishing

- confirm every contributor agrees to the chosen outbound licence;
- create root `LICENSE` and copyright notice only after the decision is accepted;
- decide whether a Contributor Licence Agreement or Developer Certificate of Origin is needed;
- generate a dependency licence inventory from the actual lockfile;
- remove/replace any dependency or asset with incompatible or unclear terms;
- include source and modification notices where required;
- verify font embedding/subsetting rights;
- verify AI-generated asset/tool terms and register them;
- ensure no government emblem, trademark, or copied official creative is included;
- keep competition organizer branding out unless explicit terms allow it.

## Public disclaimer is not a licence

The statement “independent prototype” manages affiliation risk; it does not grant copyright permission. The licence and disclaimer must both be present where applicable.

## Proposed notices

### Code header/repository notice

> Copyright 2026 Challan Nyay contributors. Licensed under the Apache License, Version 2.0, only after the root LICENSE file is adopted.

### Documentation notice

> Original Challan Nyay documentation is licensed under CC BY 4.0 only after an explicit documentation licence notice is adopted. Linked official and third-party material is excluded.

This is a project-planning recommendation, not legal advice.

