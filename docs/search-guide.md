# [WIP]🔍 Search Guide

This guide covers BunSqStat's powerful search capabilities powered by Redis Search.

## Quick Start

### Basic Search
```
# Search in all fields
google

# Search specific field
@url:google.com

# Combine searches
@user:alice @method:GET
```

### Advanced Search
```
# Numeric ranges
@resultStatus:[200 299] @size:[1000 +inf]

# Wildcards and patterns
@clientIP:192.168.*

# Complex queries
(@url:facebook.com | @url:twitter.com) @resultStatus:[400 499]
```

## Search Field Types

BunSqStat uses different field types for optimal search performance:

| Field | Type | Description | Search Examples |
|-------|------|-------------|-----------------|
| `clientIP` | TAG | IP addresses | `@clientIP:{192.168.1.1}` |
| `user` | TAG | User identifiers | `@user:alice` |  
| `method` | TAG | HTTP methods | `@method:GET` |
| `url` | TEXT | URLs (full-text) | `@url:google` |
| `contentType` | TEXT | MIME types | `@contentType:image` |
| `resultStatus` | NUMERIC | HTTP status codes | `@resultStatus:[200 299]` |
| `size` | NUMERIC | Response sizes | `@size:[1000 +inf]` |
| `timestamp` | NUMERIC | Unix timestamps | `@timestamp:[1640995200 1641081600]` |
| `duration` | NUMERIC | Request duration | `@duration:[0 1000]` |

## Field-Specific Search Syntax

### TAG Fields (Exact Matching)

TAG fields require exact matching and special character escaping.

#### IP Addresses (`clientIP`)
```
# Exact IP
@clientIP:{192\\.168\\.1\\.1}

# IP range with wildcards (use TEXT search instead)
@clientIP:192*168*1*

# Multiple IPs
@clientIP:{192\\.168\\.1\\.1|10\\.0\\.0\\.1}
```

#### Users (`user`)
```
# Exact user
@user:alice

# Multiple users
@user:{alice|bob|charlie}

# Users with special characters
@user:{user\\@domain\\.com}
```

#### HTTP Methods (`method`)
```
# Single method
@method:GET

# Multiple methods  
@method:{GET|POST|PUT}

# Exclude method
-@method:OPTIONS
```

### TEXT Fields (Full-Text Search)

TEXT fields support full-text search with stemming and fuzzy matching.

#### URLs (`url`)
```
# Contains word
@url:google

# Exact phrase
@url:"google.com"

# Wildcard
@url:*.google.com

# Multiple terms (AND)
@url:(facebook social)

# Multiple terms (OR)
@url:(facebook|twitter)

# Fuzzy search (up to 2 character differences)
@url:%googl%
```

#### Content Type (`contentType`)
```
# Image files
@contentType:image

# Specific MIME type
@contentType:"image/jpeg"

# Text content
@contentType:(text|html|css|javascript)
```

### NUMERIC Fields (Range Queries)

NUMERIC fields use range syntax for filtering.

#### Status Codes (`resultStatus`)
```
# Exact status
@resultStatus:[200 200]

# Success codes (2xx)
@resultStatus:[200 299]

# Client errors (4xx)
@resultStatus:[400 499]

# Server errors (5xx)  
@resultStatus:[500 599]

# Not found
@resultStatus:[404 404]

# Greater than 400
@resultStatus:[400 +inf]

# Less than 400
@resultStatus:[-inf 399]
```

#### Response Size (`size`)
```
# Exact size
@size:[1024 1024]

# Small responses (< 1KB)
@size:[0 1023]

# Medium responses (1KB - 1MB)
@size:[1024 1048576]

# Large responses (> 1MB)
@size:[1048577 +inf]

# Empty responses
@size:[0 0]
```

#### Timestamps (`timestamp`)
```
# Last hour (Unix timestamps)
@timestamp:[1640995200 1640998800]

# Today (assuming current timestamp is 1641081600)
@timestamp:[1641081600 +inf]

# Specific date range
@timestamp:[1640995200 1641081600]
```

## Advanced Query Syntax

### Boolean Operators

#### AND (Default)
```
# All conditions must match (default behavior)
@user:alice @method:GET
@user:alice AND @method:GET
```

#### OR
```
# Any condition can match
@user:alice | @user:bob
@method:{GET|POST}
```

#### NOT
```
# Exclude results
-@method:OPTIONS
NOT @resultStatus:[404 404]

# Complex exclusion
@url:google -@resultStatus:[400 499]
```

### Grouping and Precedence

```
# Group conditions with parentheses
(@user:alice | @user:bob) @method:GET

# Complex grouping
(@url:facebook.com | @url:twitter.com) (@resultStatus:[200 299] | @resultStatus:[300 399])

# Nested groups
((@user:alice @method:GET) | (@user:bob @method:POST)) -@resultStatus:[500 599]
```

### Wildcards and Patterns

#### Wildcards in TAG Fields
```
# Use TEXT-style search for wildcards in TAG fields
@clientIP:192*168*1*

# Or escape and use exact matching
@clientIP:{192\\.168\\.1\\.*}
```

#### Patterns in TEXT Fields  
```
# Prefix matching
@url:http*

# Suffix matching  
@url:*.com

# Contains pattern
@url:*google*

# Single character wildcard
@url:googl?
```

### Fuzzy Search

```
# Fuzzy search (Levenshtein distance)
@url:%googl%      # Matches "google", "goggle", etc.
@user:%alic%      # Matches "alice", "alica", etc.

# Control fuzzy distance
@url:%{googl}%1   # Max 1 character difference
@url:%{googl}%2   # Max 2 character differences
```

## Query Examples

### Common Use Cases

#### Monitor Specific Users
```
# All requests from user alice
@user:alice

# Multiple users
@user:{alice|bob|charlie}

# User activity in last hour
@user:alice @timestamp:[1640995200 +inf]
```

#### Track Errors
```
# All 4xx errors
@resultStatus:[400 499]

# 5xx server errors
@resultStatus:[500 599]

# Specific error
@resultStatus:[404 404]

# Errors from specific IP
@clientIP:{192\\.168\\.1\\.1} @resultStatus:[400 599]
```

#### Monitor High Traffic
```
# Large responses (>1MB)
@size:[1048577 +inf]

# Slow requests (>5 seconds, assuming duration in ms)
@duration:[5000 +inf]

# High volume IPs (combine with aggregation)
@clientIP:{192\\.168\\.1\\.*}
```

#### Content Analysis
```
# Image requests
@contentType:image

# JavaScript and CSS  
@contentType:(javascript|css)

# Video streaming
@contentType:video @size:[10485760 +inf]

# Social media sites
@url:(facebook|twitter|instagram|linkedin)
```

#### Security Monitoring
```
# Suspicious activity patterns
@method:POST @resultStatus:[401 403]

# Potential attacks
@url:(*admin*|*login*|*wp-admin*) @resultStatus:[401 404]

# Large POST requests
@method:POST @size:[1048576 +inf]

# Multiple error attempts from same IP
@clientIP:{192\\.168\\.1\\.1} @resultStatus:[400 499]
```

### Complex Queries

#### Business Hours Analysis
```
# Business hours (9 AM - 5 PM UTC, adjust timestamps accordingly)
@timestamp:[1640962800 1640995200]

# Weekend traffic
@timestamp:[1640995200 1641168000]

# Combine with user activity
@timestamp:[1640962800 1640995200] (@user:alice | @user:bob)
```

#### Performance Analysis
```
# Fast successful requests
@resultStatus:[200 299] @duration:[0 1000]

# Slow requests to specific domain
@url:*.example.com @duration:[5000 +inf]

# Large successful downloads
@resultStatus:[200 299] @method:GET @size:[10485760 +inf]
```

#### Content Delivery Analysis
```
# Static content
@url:(*.css|*.js|*.png|*.jpg|*.gif) @method:GET

# Dynamic content
-@url:(*.css|*.js|*.png|*.jpg|*.gif) @method:{GET|POST}

# CDN effectiveness
@url:cdn.* @resultStatus:[200 299] @size:[1024 +inf]
```

## Search Performance Tips

### Field Selection
- Use TAG fields for exact matching (IPs, users, methods)
- Use TEXT fields for partial/fuzzy matching (URLs, content)
- Use NUMERIC fields for ranges (status, size, timestamp)

### Query Optimization
```
# Good: Specific field searches
@user:alice @method:GET

# Better: Use TAG fields for exact matches
@user:alice @method:GET @resultStatus:[200 200]

# Best: Combine with time ranges to limit scope
@user:alice @method:GET @timestamp:[1640995200 +inf]
```

### Index Considerations
- TAG fields are fastest for exact matching
- TEXT fields support full-text features but are slower
- NUMERIC fields are optimized for range queries
- Combine field types strategically

## Error Handling

### Common Search Errors

```
# Syntax error in query
Query syntax error near '@user:alice @method:'

# Invalid field name
No such field 'invalidField'

# Invalid numeric range
Invalid numeric range: [invalid +inf]

# Unmatched parentheses
Query syntax error: unmatched parentheses
```

### Debugging Queries

```
# Test simple field searches first
@user:alice

# Build complexity gradually
@user:alice @method:GET

# Add ranges last
@user:alice @method:GET @timestamp:[1640995200 +inf]
```

## Search API Integration

### REST API Queries
```bash
# Basic search
curl "http://localhost:3001/api/search?q=@user:alice"

# With pagination
curl "http://localhost:3001/api/search?q=@user:alice&offset=0&limit=50"

# Complex query (URL encoded)
curl "http://localhost:3001/api/search?q=%40user%3Aalice%20%40method%3AGET"
```

### Frontend Integration
```javascript
// Using the search utility
import { buildSearchQuery } from '@/utils/search'

const query = buildSearchQuery({
  user: 'alice',
  method: 'GET',
  resultStatus: [200, 299]
})
// Results: "@user:alice @method:GET @resultStatus:[200 299]"
```

## Aggregation and Analytics

While Redis Search provides the base querying, BunSqStat extends with analytics:

### Time-based Analysis
```
# Group by hour
@timestamp:[1640995200 +inf] GROUP_BY timestamp

# Daily trends
@user:alice GROUP_BY DATE(timestamp)
```

### Statistical Analysis  
```
# Top users by request count
GROUP_BY user ORDER_BY COUNT DESC

# Average response sizes
@method:GET AVG(size)

# Error rate analysis
@resultStatus:[400 599] / @resultStatus:[200 599]
```

For more advanced analytics, see [API Reference](./api.md) and [Testing Guide](./testing.md).
