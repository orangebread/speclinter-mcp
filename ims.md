# Implementation Manifest Standard (IMS)

**Version:** 0.1.0-draft
**Spec URL:** [https://ims.speclinter.dev/v0.1.0](https://ims.speclinter.dev/v0.1.0)
**Status:** Experimental Draft

---

## 📌 Overview

The **Implementation Manifest Standard (IMS)** defines a structured, versioned format for recording and verifying how an AI agent or developer implements a software requirement. This format allows:

* Deterministic traceability between specs and code
* Self-verifying implementations
* Portable metadata for collaboration between tools, agents, and humans
* Interoperability across AI agent ecosystems
* **Composable, evolving specifications across time and context**

---

## 📁 File Format

* File extension: `.manifest.json`
* Encoding: UTF-8
* Format: JSON
* Schema versioning is required

---

## 🔧 Minimum Viable Schema

```json
{
  "schemaVersion": "0.1.0",
  "requirement": {
    "id": "REQ-001",
    "source": "https://tracker.acme.com/req-001"
  },
  "agent": {
    "identifier": "claude-3.5",
    "source": "anthropic"
  },
  "implementation": {
    "files": [
      {
        "path": "src/auth/auth.service.ts"
      }
    ]
  }
}
```

All other fields are optional and defined in the extended schema below.

---

## 🧱 Full Schema Fields

### `schemaVersion` (required)

```json
"schemaVersion": "0.1.0"
```

Defines the version of the IMS schema this file adheres to.

---

### `requirement` (required)

```json
"requirement": {
  "id": "REQ-001",
  "title": "User Authentication",
  "description": "Users must be able to log in with email/password.",
  "source": "https://tracker.acme.com/req-001",
  "composedOf": ["REQ-000", "REQ-003"],
  "version": "1.2.0"
}
```

* `id`: Unique requirement identifier (e.g. REQ-001)
* `title`: Optional human-readable name
* `description`: Optional summary
* `source`: URL or path to the spec definition
* `composedOf`: Optional array of subordinate requirement IDs
* `version`: Optional semantic versioning tag for the requirement itself

---

### `agent` (required)

```json
"agent": {
  "identifier": "claude-3.5",
  "source": "anthropic",
  "timestamp": "2025-07-16T03:45:00Z"
}
```

* Identifies the agent that produced this manifest (human or LLM)

---

### `implementation` (required)

```json
"implementation": {
  "status": "complete",  // optional: complete | partial | planned
  "completeness": 1.0,     // 0.0 - 1.0
  "files": [
    {
      "path": "src/auth/auth.service.ts",
      "hash": "sha256:abc123...",
      "purpose": "Authentication logic",
      "symbols": [
        { "name": "AuthService", "type": "class", "lines": [10, 145] },
        { "name": "login", "type": "method", "lines": [23, 67] }
      ]
    }
  ],
  "tests": {
    "unit": ["__tests__/auth.service.spec.ts"],
    "integration": ["__tests__/auth.integration.spec.ts"],
    "e2e": ["e2e/auth.e2e.ts"]
  },
  "coverage": {
    "statements": 92.5,
    "branches": 88.2,
    "functions": 95.0,
    "lines": 94.3
  }
}
```

---

### `verification` (optional)

```json
"verification": {
  "verifiedAt": "2025-07-16T04:20:00Z",
  "status": "pass",  // pass | fail | unknown
  "methods": ["hash-check", "test-run"],
  "tools": ["speclinter@0.5.2"]
}
```

---

### `relationships` (optional)

```json
"relationships": {
  "implements": ["REQ-001"],
  "depends_on": ["REQ-003"],
  "validates": ["SCENARIO-001"]
}
```

---

### `chain` (optional)

```json
"chain": {
  "previous": "sha256:def456...",
  "reason": "Refactored AuthService",
  "breaking": true
}
```

---

### `meta` (optional)

```json
"meta": {
  "tags": ["auth", "security"],
  "domain": "Identity",
  "project": "auth-service"
}
```

---

### `extensions` (optional)

```json
"extensions": {
  "speclinter": {
    "patterns": ["repository", "mvc"],
    "coverage_target": "90%"
  },
  "cursor": {
    "workspace_id": "abc123"
  }
}
```

Allows tools to add arbitrary data under their own namespace.

---

## 🌐 Hosting & Validation

* Canonical spec URL: [https://ims.speclinter.dev/v0.1.0](https://ims.speclinter.dev/v0.1.0)
* Schema file: `ims.schema.v0.1.0.json`
* Validator tool: `@speclinter/ims-validator`

---

## 🧭 Feature Evolution Support

IMS allows specs to evolve over time by chaining manifests, tracking composed features, and versioning spec references. When features change:

* Use `chain.previous` to reference the hash of the previous manifest
* Use `requirement.composedOf` to reflect composed or absorbed feature sets
* Increment semantic version via `requirement.version`

This enables Git-like composability and traceability at the **requirement level**, not just code level.

---

## 🏁 Roadmap

* v0.1.0-draft: Internal usage + community feedback
* v0.2.0: Real-world use cases from agents and human teams
* v1.0.0: Standardized validator + adoption by other tools

---

## 📜 License

Open spec, MIT licensed. Contributions welcome.
