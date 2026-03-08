# Gatus Monitoring Configuration for VulnIQ

## 1. DB Health Check

- **Name:** DB outages
- **Type:** HTTP
- **Method:** GET
- **Target:** `https://vulniq.org/api/health/ready`
- **Interval:** 10m
- **Conditions:**

| Placeholder | Comparator | Value |
|---|---|---|
| `[STATUS]` | `==` | `200` |
| `[BODY].status` | `==` | `ok` |

**Expected response:**

```json
{
  "status": "ok",
  "db": "connected",
  "latency_ms": 33,
  "timestamp": "2026-03-08T16:57:10.609Z"
}
```

---

## 2. App Liveness

- **Name:** App liveness
- **Type:** HTTP
- **Method:** GET
- **Target:** `https://vulniq.org/api/health`
- **Interval:** 5m
- **Conditions:**

| Placeholder | Comparator | Value |
|---|---|---|
| `[STATUS]` | `==` | `200` |

---

## 3. Landing Page

- **Name:** Landing page
- **Type:** HTTP
- **Method:** GET
- **Target:** `https://vulniq.org`
- **Interval:** 5m
- **Conditions:**

| Placeholder | Comparator | Value |
|---|---|---|
| `[STATUS]` | `==` | `200` |

---

## 4. Login Page

- **Name:** Login page
- **Type:** HTTP
- **Method:** GET
- **Target:** `https://vulniq.org/login`
- **Interval:** 5m
- **Conditions:**

| Placeholder | Comparator | Value |
|---|---|---|
| `[STATUS]` | `==` | `200` |

---

## 5. Auth Providers

- **Name:** Auth providers
- **Type:** HTTP
- **Method:** GET
- **Target:** `https://vulniq.org/api/auth/providers`
- **Interval:** 10m
- **Conditions:**

| Placeholder | Comparator | Value |
|---|---|---|
| `[STATUS]` | `==` | `200` |

---

## 6. Blog

- **Name:** Blog
- **Type:** HTTP
- **Method:** GET
- **Target:** `https://vulniq.org/blog`
- **Interval:** 10m
- **Conditions:**

| Placeholder | Comparator | Value |
|---|---|---|
| `[STATUS]` | `==` | `200` |

---

## 7. About Page

- **Name:** About page
- **Type:** HTTP
- **Method:** GET
- **Target:** `https://vulniq.org/about`
- **Interval:** 10m
- **Conditions:**

| Placeholder | Comparator | Value |
|---|---|---|
| `[STATUS]` | `==` | `200` |

---

## 8. Demo Page

- **Name:** Demo page
- **Type:** HTTP
- **Method:** GET
- **Target:** `https://vulniq.org/demo`
- **Interval:** 10m
- **Conditions:**

| Placeholder | Comparator | Value |
|---|---|---|
| `[STATUS]` | `==` | `200` |

---

## 9. Sitemap

- **Name:** Sitemap
- **Type:** HTTP
- **Method:** GET
- **Target:** `https://vulniq.org/sitemap.xml`
- **Interval:** 30m
- **Conditions:**

| Placeholder | Comparator | Value |
|---|---|---|
| `[STATUS]` | `==` | `200` |

---

## 10. Demo API Health

- **Name:** Demo API health
- **Type:** HTTP
- **Method:** GET
- **Target:** `https://vulniq.org/demo/api/health`
- **Interval:** 10m
- **Conditions:**

| Placeholder | Comparator | Value |
|---|---|---|
| `[STATUS]` | `==` | `200` |

---

## 11. Changelog

- **Name:** Changelog
- **Type:** HTTP
- **Method:** GET
- **Target:** `https://vulniq.org/changelog`
- **Interval:** 30m
- **Conditions:**

| Placeholder | Comparator | Value |
|---|---|---|
| `[STATUS]` | `==` | `200` |

---

## 12. WWW Redirect

- **Name:** WWW redirect
- **Type:** HTTP
- **Method:** GET
- **Target:** `https://www.vulniq.org`
- **Interval:** 30m
- **Conditions:**

| Placeholder | Comparator | Value |
|---|---|---|
| `[STATUS]` | `==` | `200` |

---

## Suggested Groups

| Group | Endpoints |
|---|---|
| **Core** | DB outages, App liveness |
| **Pages** | Landing page, Login page, Blog, About page, Demo page, Changelog |
| **Auth** | Auth providers |
| **Infrastructure** | Sitemap, WWW redirect, Demo API health |

