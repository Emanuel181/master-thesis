/**
 * Default Prompts for New Users
 * ==============================
 *
 * These prompts are automatically created when a user signs up.
 * They provide a starting point for each agent type.
 * Each prompt has a unique defaultKey for identification during reset.
 */

/**
 * Valid agent types (must match VALID_AGENTS from validators/prompts.js)
 */
export const AGENTS = ['reviewer', 'implementation', 'tester', 'report'];

/**
 * Default prompts for each agent type
 * These are created automatically when a new user account is created
 */
export const DEFAULT_PROMPTS = {
    reviewer: [
        {
            defaultKey: "reviewer-security-code-review",
            title: "Security Code Review",
            text: `Analyze the provided code for security vulnerabilities. Focus on OWASP Top 10 issues including:

- Injection flaws (SQL, NoSQL, LDAP, OS command injection)
- Broken authentication and session management
- Sensitive data exposure
- XML External Entities (XXE)
- Broken access control
- Security misconfigurations
- Cross-Site Scripting (XSS)
- Insecure deserialization
- Using components with known vulnerabilities
- Insufficient logging and monitoring

For each vulnerability found, produce a JSON object in the following schema. Every field must be populated — do not omit any field.

\`\`\`json
{
  "id": "<unique slug, e.g. vuln-sqli-001>",
  "title": "<short descriptive title, e.g. 'SQL Injection via unsanitised query parameter'>",
  "severity": "<Critical | High | Medium | Low>",
  "type": "<vulnerability category, e.g. 'Injection' | 'XSS' | 'IDOR' | ...>",
  "cweId": "<CWE identifier, e.g. 'CWE-89'>",
  "fileName": "<file path relative to repo root>",
  "lineNumber": <integer line number of the vulnerable code>,
  "confidence": <float 0.0–1.0>,
  "cvssScore": <CVSS v4.0 numeric score, e.g. 9.8>,
  "cvssVector": "<full CVSS v4.0 vector string, e.g. 'CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N'>",
  "cvssAnalysis": {
    "AV": "<1–2 sentence explanation of the Attack Vector score for this specific vulnerability>",
    "AC": "<1–2 sentence explanation of the Attack Complexity score>",
    "AT": "<1–2 sentence explanation of Attack Requirements>",
    "PR": "<1–2 sentence explanation of Privileges Required>",
    "UI": "<1–2 sentence explanation of User Interaction>",
    "VC": "<1–2 sentence explanation of Vulnerable System Confidentiality Impact>",
    "VI": "<1–2 sentence explanation of Vulnerable System Integrity Impact>",
    "VA": "<1–2 sentence explanation of Vulnerable System Availability Impact>"
  },
  "explanation": "<comprehensive multi-paragraph technical explanation of the vulnerability, root cause, and how it can be exploited. Use backtick-wrapped inline code for function names, parameters, and code snippets, e.g. \`req.query.id\`.>",
  "details": "<one-sentence summary>",
  "vulnerableCode": "<the exact vulnerable code snippet, multi-line>",
  "bestPractices": "<specific, actionable remediation advice with inline code examples>",
  "attackPath": "<numbered list of steps, one per line, showing how an attacker exploits this from discovery to full impact>",
  "dataFlow": {
    "nodes": [
      { "id": "n1", "type": "source", "label": "<function/param name>", "description": "<what this node is and why it is attacker-controlled>", "file": "<filename>", "line": <line number> },
      { "id": "n2", "type": "intermediate", "label": "<intermediate transform>", "description": "<what transformation happens and why it is dangerous>" },
      { "id": "n3", "type": "sink", "label": "<dangerous function/operation>", "description": "<why this is the dangerous sink and what the attacker achieves>" }
    ],
    "edges": [
      { "from": "n1", "to": "n2", "label": "<data flow label, e.g. 'unvalidated' | 'interpolated' | 'passed as arg'>", "dataFlowDetail": "<tainted | sanitized>" },
      { "from": "n2", "to": "n3", "label": "<data flow label>" }
    ]
  },
  "exploitSections": [
    {
      "heading": "<section title, e.g. 'Reconnaissance — Identify Injection Point'>",
      "text": "<1–3 sentences explaining what this step achieves and why it works>",
      "code": "<runnable exploit code or HTTP request>",
      "language": "<bash | http | python | javascript | json>"
    }
  ],
  "debateLog": {
    "verdict": "<confirmed | likely | uncertain | false_positive>",
    "confidence": <float 0.0–1.0>,
    "rounds": [
      { "id": "r1", "round": 1, "agentRole": "advocate", "argument": "<why this IS a real vulnerability>", "citations": [{ "excerpt": "<relevant security standard quote>", "source": "<OWASP / CWE / NIST reference>" }] },
      { "id": "r2", "round": 2, "agentRole": "skeptic", "argument": "<strongest counterargument — mitigating factors, false positive scenarios, or limited scope>" },
      { "id": "r3", "round": 3, "agentRole": "advocate", "argument": "<rebuttal with code evidence confirming the vulnerability>" },
      { "id": "r4", "round": 4, "agentRole": "judge", "argument": "<final verdict summarizing both sides and reaching a conclusion>", "verdict": "<confirmed | likely | uncertain | false_positive>", "confidence": <float 0.0–1.0> }
    ]
  }
}
\`\`\`

Output ONLY a valid JSON object with a top-level "vulnerabilities" array containing one entry per finding:

\`\`\`json
{
  "vulnerabilities": [ <vulnerability objects> ]
}
\`\`\`

Do not include any explanation text outside the JSON.`,
            order: 0,
        },
        {
            defaultKey: "reviewer-auth-review",
            title: "Authentication & Authorization Review",
            text: `Review the code specifically for authentication and authorization vulnerabilities:

Authentication checks:
- Password storage (hashing algorithms, salt usage)
- Session management (token generation, expiration, invalidation)
- Multi-factor authentication implementation
- Brute force protection mechanisms
- Password reset flow security

Authorization checks:
- Role-based access control (RBAC) implementation
- Resource-level permissions
- Privilege escalation vulnerabilities
- Insecure direct object references (IDOR)
- Missing function-level access control

For each vulnerability found, use the same comprehensive JSON schema as the Security Code Review prompt, including all fields: cvssScore, cvssVector, cvssAnalysis (per-metric), explanation, dataFlow (nodes/edges), exploitSections (structured steps), and debateLog (advocate/skeptic/judge rounds).

Output ONLY valid JSON: { "vulnerabilities": [ ... ] }`,
            order: 1,
        },
        {
            defaultKey: "reviewer-input-validation",
            title: "Input Validation Analysis",
            text: `Analyze all user input handling for security issues:

1. Identify all input entry points (forms, APIs, file uploads, URL parameters)
2. Check for proper input validation and sanitization
3. Look for injection vulnerabilities:
   - SQL/NoSQL injection
   - Command injection
   - LDAP injection
   - XPath injection
   - Template injection
4. Verify output encoding for XSS prevention
5. Check file upload restrictions (type, size, content validation)

For each vulnerability found, use the same comprehensive JSON schema as the Security Code Review prompt, including all fields: cvssScore, cvssVector, cvssAnalysis (per-metric), explanation, dataFlow (nodes/edges), exploitSections (structured steps), and debateLog (advocate/skeptic/judge rounds).

Output ONLY valid JSON: { "vulnerabilities": [ ... ] }`,
            order: 2,
        },
    ],
    implementation: [
        {
            defaultKey: "implementation-secure-fix",
            title: "Generate Secure Fix",
            text: `Generate secure code to remediate the identified vulnerabilities:

1. Follow security best practices and coding standards
2. Include detailed comments explaining each security improvement
3. Maintain existing code functionality while eliminating security risks
4. Use parameterized queries for database operations
5. Implement proper input validation and output encoding
6. Follow the principle of least privilege
7. Use secure defaults for all configurations

Format the response as a complete code block that can be directly applied.`,
            order: 0,
        },
        {
            defaultKey: "implementation-input-validation",
            title: "Implement Input Validation",
            text: `Add comprehensive input validation using a whitelist approach:

1. Implement schema validation for all inputs
2. Add type checking and type coercion where appropriate
3. Set reasonable length limits for string inputs
4. Validate format using regex patterns for emails, URLs, etc.
5. Sanitize special characters where necessary
6. Implement server-side validation (never trust client-side alone)
7. Add proper error messages that don't leak sensitive information

Provide complete, production-ready code with validation logic.`,
            order: 1,
        },
        {
            defaultKey: "implementation-secure-db",
            title: "Secure Database Queries",
            text: `Convert all database queries to use secure patterns:

1. Replace string concatenation with parameterized queries
2. Use ORM methods with proper escaping
3. Implement prepared statements
4. Add proper type casting for query parameters
5. Validate query inputs before execution
6. Implement query timeout limits
7. Add proper error handling without exposing database details

Provide the refactored code with secure database operations.`,
            order: 2,
        },
    ],
    tester: [
        {
            defaultKey: "tester-penetration-scan",
            title: "Full Penetration Test",
            text: `Run a comprehensive penetration test on the submitted code using all available scanning tools:

Scanning tools to execute:
1. **Semgrep (SAST)** — Rule-based static analysis for OWASP Top 10, injection flaws, auth issues, and framework-specific vulnerabilities
2. **njsscan (SAST)** — Node.js and JavaScript specific security scanner for insecure patterns
3. **Nuclei (DAST)** — Dynamic endpoint scanning with 9000+ community templates (if target URL provided)
4. **Bedrock Claude (AI)** — AI-powered exploit chain analysis, reasoning about attack paths, and identifying complex multi-step vulnerabilities

For each finding, output a JSON object using the full vulnerability schema below. Every field is mandatory.

\`\`\`json
{
  "id": "<unique slug>",
  "title": "<short descriptive title>",
  "severity": "<Critical | High | Medium | Low>",
  "type": "<vulnerability category>",
  "cweId": "<CWE identifier>",
  "fileName": "<file path>",
  "lineNumber": <integer>,
  "confidence": <float 0.0–1.0>,
  "cvssScore": <CVSS v4.0 numeric score>,
  "cvssVector": "<full CVSS v4.0 vector string>",
  "cvssAnalysis": {
    "AV": "<explanation>", "AC": "<explanation>", "AT": "<explanation>",
    "PR": "<explanation>", "UI": "<explanation>",
    "VC": "<explanation>", "VI": "<explanation>", "VA": "<explanation>"
  },
  "explanation": "<comprehensive multi-paragraph technical explanation with inline backtick code snippets>",
  "details": "<one-sentence summary>",
  "vulnerableCode": "<exact vulnerable code snippet>",
  "bestPractices": "<specific actionable remediation with inline code examples>",
  "attackPath": "<numbered steps showing attacker exploitation path>",
  "dataFlow": {
    "nodes": [
      { "id": "n1", "type": "source", "label": "<name>", "description": "<why attacker-controlled>", "file": "<filename>", "line": <number> },
      { "id": "n2", "type": "intermediate", "label": "<name>", "description": "<what happens>" },
      { "id": "n3", "type": "sink", "label": "<name>", "description": "<why dangerous>" }
    ],
    "edges": [
      { "from": "n1", "to": "n2", "label": "<data flow label>", "dataFlowDetail": "tainted" },
      { "from": "n2", "to": "n3", "label": "<data flow label>" }
    ]
  },
  "exploitSections": [
    {
      "heading": "<step title e.g. 'Reconnaissance — Confirm Injection'>",
      "text": "<1–3 sentences describing this exploit step>",
      "code": "<runnable exploit payload or HTTP request>",
      "language": "<bash | http | python | javascript | json>"
    }
  ],
  "debateLog": {
    "verdict": "<confirmed | likely | uncertain | false_positive>",
    "confidence": <float>,
    "rounds": [
      { "id": "r1", "round": 1, "agentRole": "advocate", "argument": "<why real>", "citations": [{ "excerpt": "<quote>", "source": "<OWASP/CWE/NIST>" }] },
      { "id": "r2", "round": 2, "agentRole": "skeptic", "argument": "<strongest counterargument>" },
      { "id": "r3", "round": 3, "agentRole": "judge", "argument": "<final verdict>", "verdict": "<confirmed | ...>", "confidence": <float> }
    ]
  }
}
\`\`\`

Output ONLY valid JSON: { "vulnerabilities": [ ... ] }`,
            order: 0,
        },
        {
            defaultKey: "tester-sast-deep-scan",
            title: "Deep SAST Analysis",
            text: `Focus on static application security testing (SAST) using Semgrep and njsscan:

Semgrep rules to prioritize:
- OWASP Top 10 patterns
- Framework-specific rules (Next.js, React, Express, Prisma)
- Cryptographic misuse patterns
- Hardcoded secrets and credentials
- Insecure deserialization
- Server-side request forgery (SSRF)

njsscan focus areas:
- Insecure use of eval(), Function(), and child_process
- Path traversal via unsanitized file operations
- Prototype pollution patterns
- Regex denial of service (ReDoS)
- Insecure randomness usage

Merge and deduplicate findings across both tools. Flag false positives with low confidence scores.

For each finding output the full vulnerability JSON schema (same as Full Penetration Test prompt), including all fields: cvssScore, cvssVector, cvssAnalysis, dataFlow, exploitSections, debateLog.

Output ONLY valid JSON: { "vulnerabilities": [ ... ] }`,
            order: 1,
        },
        {
            defaultKey: "tester-ai-exploit-analysis",
            title: "AI Exploit Chain Analysis",
            text: `Use the Bedrock Claude AI model to perform deep exploit reasoning on the submitted code:

Analysis tasks:
1. **Attack surface mapping** — Identify all entry points (API routes, form handlers, file uploads, WebSocket handlers)
2. **Exploit chain construction** — Reason about how multiple low-severity issues can be chained into critical exploits
3. **Business logic vulnerabilities** — Identify flaws that static tools miss (race conditions, TOCTOU, privilege escalation via workflow abuse)
4. **Dependency risk assessment** — Analyze imported packages for known CVEs and insecure usage patterns
5. **Data flow analysis** — Trace sensitive data from input to storage/output, identifying exposure points

For each finding output the full vulnerability JSON schema (same as Full Penetration Test prompt), including all fields: cvssScore, cvssVector, cvssAnalysis (per-metric explanations), dataFlow (nodes/edges showing taint propagation), exploitSections (structured step-by-step exploit), debateLog (advocate/skeptic/judge rounds with citations).

Output ONLY valid JSON: { "vulnerabilities": [ ... ] }`,
            order: 2,
        },
    ],
    report: [
        {
            defaultKey: "report-executive-summary",
            title: "Executive Summary Report",
            text: `Generate an executive summary of the security assessment:

Include the following sections:

1. **Overview**
   - Scope of the review
   - Date and duration
   - Summary of findings

2. **Risk Summary**
   - Critical findings count
   - High/Medium/Low findings count
   - Overall risk rating

3. **Key Findings**
   - Top 3-5 most critical issues
   - Business impact of each
   - Remediation status

4. **Recommendations**
   - Prioritized action items
   - Quick wins vs. long-term improvements
   - Resource estimates

5. **Conclusion**
   - Overall security posture assessment
   - Next steps`,
            order: 0,
        },
        {
            defaultKey: "report-technical-findings",
            title: "Technical Findings Report",
            text: `Create a detailed technical report of all findings:

For each vulnerability include:

1. **Finding Details**
   - Title and ID
   - Severity (CVSS score if applicable)
   - CWE/CVE references
   - Affected file(s) and line numbers

2. **Description**
   - Technical explanation
   - Root cause analysis
   - Attack scenario

3. **Evidence**
   - Vulnerable code snippet
   - Proof of concept (if safe)
   - Screenshots/logs if applicable

4. **Remediation**
   - Recommended fix
   - Secure code example
   - Verification steps

5. **References**
   - Related security standards
   - External documentation`,
            order: 1,
        },
        {
            defaultKey: "report-compliance-mapping",
            title: "Compliance Mapping Report",
            text: `Map security findings to compliance frameworks:

Include mappings to:

1. **OWASP Top 10**
   - Which category each finding belongs to
   - Coverage analysis

2. **CWE/SANS Top 25**
   - Relevant weakness identifiers
   - Impact classification

3. **PCI-DSS** (if applicable)
   - Affected requirements
   - Compliance gaps

4. **SOC 2 Controls** (if applicable)
   - Trust service criteria mapping
   - Control effectiveness

5. **Remediation Priority Matrix**
   - Compliance impact vs. effort
   - Recommended timeline`,
            order: 2,
        },
    ],
};

/**
 * Get all default prompts as a flat array with agent field and defaultKey
 * @returns {Array<{agent: string, defaultKey: string, title: string, text: string, order: number}>}
 */
export function getAllDefaultPrompts() {
    const prompts = [];
    for (const agent of AGENTS) {
        const agentPrompts = DEFAULT_PROMPTS[agent] || [];
        for (const prompt of agentPrompts) {
            prompts.push({
                agent,
                defaultKey: prompt.defaultKey,
                title: prompt.title,
                text: prompt.text,
                order: prompt.order,
            });
        }
    }
    return prompts;
}

/**
 * Get default prompts for a specific agent
 * @param {string} agent - The agent type
 * @returns {Array<{defaultKey: string, title: string, text: string, order: number}>}
 */
export function getDefaultPromptsForAgent(agent) {
    return DEFAULT_PROMPTS[agent] || [];
}

/**
 * Get a map of defaultKey to default prompt data
 * @returns {Map<string, {agent: string, title: string, text: string, order: number}>}
 */
export function getDefaultPromptsMap() {
    const map = new Map();
    for (const agent of AGENTS) {
        const agentPrompts = DEFAULT_PROMPTS[agent] || [];
        for (const prompt of agentPrompts) {
            map.set(prompt.defaultKey, {
                agent,
                title: prompt.title,
                text: prompt.text,
                order: prompt.order,
            });
        }
    }
    return map;
}

function normalizePromptValue(value) {
    return String(value || '').replace(/\r\n/g, '\n').trim();
}

export function inferDefaultPromptMatch(prompt, usedDefaultKeys = new Set()) {
    if (!prompt?.agent || !AGENTS.includes(prompt.agent)) return null;

    const defaultsForAgent = DEFAULT_PROMPTS[prompt.agent] || [];
    if (defaultsForAgent.length === 0) return null;

    const defaultPromptsMap = getDefaultPromptsMap();
    if (prompt.defaultKey && defaultPromptsMap.has(prompt.defaultKey)) {
        const existing = defaultPromptsMap.get(prompt.defaultKey);
        return { defaultKey: prompt.defaultKey, ...existing };
    }

    const normalizedTitle = normalizePromptValue(prompt.title);
    const titleMatch = defaultsForAgent.find(candidate =>
        normalizePromptValue(candidate.title) === normalizedTitle && !usedDefaultKeys.has(candidate.defaultKey)
    );
    if (titleMatch) {
        return { defaultKey: titleMatch.defaultKey, agent: prompt.agent, title: titleMatch.title, text: titleMatch.text, order: titleMatch.order };
    }

    const orderMatch = defaultsForAgent.find(candidate =>
        candidate.order === (prompt.order ?? -1) && !usedDefaultKeys.has(candidate.defaultKey)
    );
    if (orderMatch) {
        return { defaultKey: orderMatch.defaultKey, agent: prompt.agent, title: orderMatch.title, text: orderMatch.text, order: orderMatch.order };
    }

    return null;
}

export function getDefaultPromptMetadataUpdates(prompts = []) {
    const usedDefaultKeys = new Set();

    for (const prompt of prompts) {
        const match = inferDefaultPromptMatch(prompt);
        if (match?.defaultKey) {
            usedDefaultKeys.add(match.defaultKey);
        }
    }

    const updates = [];
    const reservedDefaultKeys = new Set(
        prompts
            .filter(prompt => prompt.isDefault && prompt.defaultKey)
            .map(prompt => prompt.defaultKey)
    );

    for (const prompt of prompts) {
        const hasValidMetadata = prompt.isDefault === true && !!prompt.defaultKey;
        if (hasValidMetadata) continue;

        const match = inferDefaultPromptMatch(prompt, reservedDefaultKeys);
        if (!match?.defaultKey) continue;

        updates.push({
            id: prompt.id,
            isDefault: true,
            defaultKey: match.defaultKey,
        });
        reservedDefaultKeys.add(match.defaultKey);
    }

    return updates;
}

export function getEffectiveDefaultKeys(prompts = []) {
    const keys = new Set();

    for (const prompt of prompts) {
        const match = inferDefaultPromptMatch(prompt, keys);
        if (match?.defaultKey) {
            keys.add(match.defaultKey);
        }
    }

    return keys;
}

