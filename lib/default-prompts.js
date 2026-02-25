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

For each vulnerability found:
1. Identify the exact line numbers
2. Classify the severity (Critical, High, Medium, Low)
3. Explain the potential attack vector
4. Reference relevant CWE/CVE identifiers when applicable`,
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

Provide severity ratings and specific remediation recommendations.`,
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

Provide code-level findings with line numbers and severity ratings.`,
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
            defaultKey: "tester-security-tests",
            title: "Security Test Cases",
            text: `Generate comprehensive security test cases to verify the remediation:

Test Categories:
1. Positive tests - verify secure functionality works correctly
2. Negative tests - verify malicious inputs are properly rejected
3. Edge cases - boundary conditions and unusual inputs
4. Regression tests - ensure original vulnerabilities are fixed

For each test case include:
- Test name and description
- Prerequisites and setup
- Test steps
- Expected results
- Pass/fail criteria
- Sample payloads where applicable`,
            order: 0,
        },
        {
            defaultKey: "tester-injection-tests",
            title: "Injection Attack Tests",
            text: `Create injection attack test cases:

SQL Injection tests:
- Union-based injection payloads
- Boolean-blind injection payloads
- Time-based blind injection payloads
- Error-based injection payloads
- Stacked queries tests

NoSQL Injection tests:
- MongoDB operator injection
- JSON injection payloads

Command Injection tests:
- Shell metacharacter tests
- Chained command tests

Include both attack payloads and verification that they are properly blocked.`,
            order: 1,
        },
        {
            defaultKey: "tester-auth-tests",
            title: "Authentication Security Tests",
            text: `Generate authentication and session security tests:

Password Security:
- Brute force attack simulation
- Password complexity enforcement tests
- Password history/reuse prevention tests

Session Management:
- Session fixation tests
- Session timeout tests
- Concurrent session tests
- Session invalidation on logout tests

Token Security:
- JWT signature validation tests
- Token expiration tests
- Token refresh security tests

Include expected outcomes and pass/fail criteria for each test.`,
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
