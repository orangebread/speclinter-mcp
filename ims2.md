Implementation Manifest Standard (IMS)

Version: 0.2.0-draft
Spec URL: https://ims.speclinter.dev/v0.2.0
Status: Experimental Draft

⸻

📌 Overview

The Implementation Manifest Standard (IMS) defines a structured, versioned format for recording and verifying how an AI agent or developer implements a software requirement. This format allows:
	•	Deterministic traceability between specs and code
	•	Self-verifying implementations
	•	Portable metadata for collaboration between tools, agents, and humans
	•	Interoperability across AI agent ecosystems
	•	Composable, evolving specifications across time and context
	•	Environment-aware and semantically annotated features inspired by biological systems
	•	Classification of all developer activity, not just feature work

⸻

📁 File Format
	•	File extension: .manifest.json
	•	Encoding: UTF-8
	•	Format: JSON
	•	Schema versioning is required

⸻

🔧 Minimum Viable Schema

{
  "schemaVersion": "0.2.0",
  "requirement": {
    "id": "REQ-001",
    "source": "https://tracker.acme.com/req-001"
  },
  "type": "feature",
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

All other fields are optional and defined in the extended schema below.

⸻

🧱 Full Schema Fields

schemaVersion (required)

"schemaVersion": "0.2.0"

Defines the version of the IMS schema this file adheres to.

⸻

type (recommended)

"type": "feature"

Defines the purpose of the change. Suggested canonical values:
	•	feature
	•	refactor
	•	maintenance
	•	test-addition
	•	test-refactor
	•	docs
	•	infra
	•	security
	•	devxp
	•	compliance

⸻

requirement (required)

"requirement": {
  "id": "REQ-001",
  "title": "User Authentication",
  "description": "Users must be able to log in with email/password.",
  "source": "https://tracker.acme.com/req-001",
  "composedOf": ["REQ-000", "REQ-003"],
  "version": "1.2.0"
}

	•	id: Unique requirement identifier (e.g. REQ-001)
	•	title: Optional human-readable name
	•	description: Optional summary
	•	source: URL or path to the spec definition
	•	composedOf: Optional array of subordinate requirement IDs
	•	version: Optional semantic versioning tag for the requirement itself

⸻

agent (required)

"agent": {
  "identifier": "claude-3.5",
  "source": "anthropic",
  "timestamp": "2025-07-16T03:45:00Z"
}

Identifies the agent that produced this manifest (human or LLM)

⸻

implementation (required)

"implementation": {
  "status": "complete",
  "completeness": 1.0,
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


⸻

verification (optional)

"verification": {
  "verifiedAt": "2025-07-16T04:20:00Z",
  "status": "pass",
  "methods": ["hash-check", "test-run"],
  "tools": ["speclinter@0.5.2"]
}


⸻

expression (optional)

"expression": {
  "enabledIn": ["staging", "beta-users"],
  "flag": "fileUploadV2"
}

Indicates when and where a feature is actively deployed or toggled on.

⸻

relationships (optional)

"relationships": {
  "implements": ["REQ-001"],
  "depends_on": ["REQ-003"],
  "validates": ["SCENARIO-001"]
}


⸻

chain (optional)

"chain": {
  "previous": "sha256:def456...",
  "reason": "Refactored AuthService",
  "breaking": true
}

Tracks evolution lineage, and whether change is semantically breaking.

⸻

origin (optional)

"origin": {
  "importedFrom": "https://github.com/org/oss-manifests/REQ-007.json",
  "license": "MIT",
  "trusted": true
}

Used to trace manifests borrowed or reused from external sources.

⸻

meta (optional)

"meta": {
  "tags": ["auth", "security"],
  "domain": "Identity",
  "function": ["access-control", "login"],
  "project": "auth-service"
}

	•	function: describes purpose like “sync”, “storage”, “validation”

⸻

extensions (optional)

"extensions": {
  "speclinter": {
    "patterns": ["repository", "mvc"],
    "coverage_target": "90%"
  },
  "bio": {
    "expression": {
      "enabledIn": ["production"],
      "flag": "adaptiveUpload"
    },
    "lineage": {
      "ancestry": ["REQ-001", "REQ-002"]
    },
    "annotations": {
      "classification": "adaptive",
      "function": ["validate", "transform"]
    }
  }
}

Allows tools to add arbitrary biological metaphor extensions.

⸻

🌐 Hosting & Validation
	•	Canonical spec URL: https://ims.speclinter.dev/v0.2.0
	•	Schema file: ims.schema.v0.2.0.json
	•	Validator tool: @speclinter/ims-validator

⸻

🧭 Feature Evolution Support

IMS allows specs to evolve over time by chaining manifests, tracking composed features, and versioning spec references. When features change:
	•	Use chain.previous to reference the hash of the previous manifest
	•	Use requirement.composedOf to reflect composed or absorbed feature sets
	•	Increment semantic version via requirement.version
	•	Add functional lineage and annotations in meta or extensions.bio
	•	Use type to classify all code activities (e.g. docs, infra, refactor, test)

This enables Git-like composability and traceability at the requirement level, not just code level.

⸻

📋 System-Level Maintenance IDs

Use SYS-* IDs for changes unrelated to specific features:
	•	SYS-MAINT-001 — visual polish, typos
	•	SYS-TEST-001 — test-only additions
	•	SYS-INFRA-001 — CI/CD, build updates
	•	SYS-DOCS-001 — documentation improvements

⸻

📜 License

Open spec, MIT licensed. Contributions welcome.