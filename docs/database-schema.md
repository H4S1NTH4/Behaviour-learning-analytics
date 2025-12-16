# Database Schema Design
## Behavioral Learning Analytics & Keystroke Dynamics System

---

## 1. Overview

This schema is designed for a behavioral learning analytics system capturing keystroke dynamics and IDE interaction data for programming education. The design prioritizes:

- **High-volume write performance** (thousands of events per second)
- **Time-series query efficiency** (temporal analysis of student behavior)
- **Real-time analytics capability** (LSTM model inference)
- **Data privacy and security** (GDPR/FERPA compliance)

---

## 2. Database Technology Recommendation

### Primary: **TimescaleDB** (PostgreSQL extension for time-series data)
- Native SQL support with time-series optimizations
- Automatic data partitioning (hypertables)
- Continuous aggregates for pre-computed analytics
- Full ACID compliance for critical data
- Excellent integration with existing tools

### Alternative: **InfluxDB**
- Purpose-built for time-series data
- High write throughput
- Tag-based indexing for multi-dimensional queries

---

## 3. Core Tables

### 3.1 `users`
Stores student/user information with privacy considerations.

```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anonymous_id VARCHAR(64) UNIQUE NOT NULL,  -- Non-identifiable hash
    institution_id VARCHAR(100),
    cohort VARCHAR(50),
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    consent_status BOOLEAN DEFAULT FALSE,
    consent_timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_anonymous ON users(anonymous_id);
CREATE INDEX idx_users_institution ON users(institution_id);
```

**Notes:**
- `anonymous_id`: Irreversible hash for linking data without exposing identity
- `consent_status`: GDPR/FERPA compliance tracking
- No PII (Personally Identifiable Information) stored

---

### 3.2 `coding_sessions`
Tracks individual IDE sessions for each student.

```sql
CREATE TABLE coding_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    assignment_id VARCHAR(100),
    assignment_type VARCHAR(50),  -- 'homework', 'exam', 'practice', 'project'
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    editor_type VARCHAR(50),  -- 'monaco', 'codemirror', etc.
    browser_info JSONB,
    device_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON coding_sessions(user_id);
CREATE INDEX idx_sessions_start ON coding_sessions(start_time DESC);
CREATE INDEX idx_sessions_assignment ON coding_sessions(assignment_id);
```

**Notes:**
- Links user activity to specific assignments
- Tracks session metadata for context
- `duration_seconds` computed on session end

---

### 3.3 `keystroke_events` (TimescaleDB Hypertable)
**The core table for all keystroke data capture.**

```sql
CREATE TABLE keystroke_events (
    event_id BIGSERIAL,
    session_id UUID NOT NULL REFERENCES coding_sessions(session_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    timestamp_ms BIGINT NOT NULL,  -- High-resolution timestamp (from performance.now())
    server_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    event_type VARCHAR(10) NOT NULL CHECK (event_type IN ('keyDown', 'keyUp')),
    key_code VARCHAR(50) NOT NULL,  -- KeyboardEvent.code (e.g., 'KeyA', 'Enter')
    key_value VARCHAR(50),  -- KeyboardEvent.key (e.g., 'a', 'Enter')
    cursor_offset INTEGER,
    shift_pressed BOOLEAN DEFAULT FALSE,
    ctrl_pressed BOOLEAN DEFAULT FALSE,
    alt_pressed BOOLEAN DEFAULT FALSE,
    meta_pressed BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (user_id, session_id, server_timestamp, event_id)
);

-- Convert to TimescaleDB hypertable (partitioned by time)
SELECT create_hypertable('keystroke_events', 'server_timestamp',
    chunk_time_interval => INTERVAL '1 day');

-- Indexes for common query patterns
CREATE INDEX idx_keystroke_session ON keystroke_events(session_id, server_timestamp DESC);
CREATE INDEX idx_keystroke_user_time ON keystroke_events(user_id, server_timestamp DESC);
CREATE INDEX idx_keystroke_type ON keystroke_events(event_type, server_timestamp DESC);
```

**Key Design Decisions:**
- **Composite Primary Key**: Ensures uniqueness across time partitions
- **`timestamp_ms`**: Client-side high-res timer (for precise KD calculations)
- **`server_timestamp`**: Server receipt time (hypertable partitioning key)
- **Modifier Keys**: Separate boolean columns for efficient querying
- **Daily Chunks**: 1-day partitions balance write performance and query efficiency

---

### 3.4 `keystroke_features` (Pre-computed Analytics)
Derived metrics calculated from raw keystroke events.

```sql
CREATE TABLE keystroke_features (
    feature_id BIGSERIAL,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES coding_sessions(session_id) ON DELETE CASCADE,
    time_window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    time_window_end TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Static Features
    avg_dwell_time_ms DOUBLE PRECISION,
    std_dwell_time_ms DOUBLE PRECISION,
    avg_flight_time_ms DOUBLE PRECISION,
    std_flight_time_ms DOUBLE PRECISION,
    avg_press_press_time_ms DOUBLE PRECISION,

    -- Dynamic Features
    typing_speed_wpm DOUBLE PRECISION,
    backspace_frequency DOUBLE PRECISION,
    delete_frequency DOUBLE PRECISION,
    error_correction_rate DOUBLE PRECISION,

    -- Behavioral Indicators
    pause_count INTEGER,
    avg_pause_duration_ms DOUBLE PRECISION,
    burst_count INTEGER,

    -- Metadata
    total_keystrokes INTEGER,
    window_duration_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    PRIMARY KEY (user_id, session_id, time_window_start)
);

-- Convert to hypertable
SELECT create_hypertable('keystroke_features', 'time_window_start',
    chunk_time_interval => INTERVAL '1 week');

CREATE INDEX idx_features_session ON keystroke_features(session_id);
```

**Purpose:**
- Accelerates machine learning model training
- Reduces computational load for real-time analytics
- Pre-aggregated 30-second or 1-minute windows

---

### 3.5 `mouse_events` (Optional - For Multimodal Analysis)

```sql
CREATE TABLE mouse_events (
    event_id BIGSERIAL,
    session_id UUID NOT NULL REFERENCES coding_sessions(session_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    timestamp_ms BIGINT NOT NULL,
    server_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    event_type VARCHAR(20) NOT NULL,  -- 'move', 'click', 'scroll', 'hover'
    x_position INTEGER,
    y_position INTEGER,
    button VARCHAR(10),  -- 'left', 'right', 'middle' (for clicks)
    scroll_delta_x INTEGER,
    scroll_delta_y INTEGER,
    target_element VARCHAR(100),  -- CSS selector or element ID
    PRIMARY KEY (user_id, session_id, server_timestamp, event_id)
);

SELECT create_hypertable('mouse_events', 'server_timestamp',
    chunk_time_interval => INTERVAL '1 day');

CREATE INDEX idx_mouse_session ON mouse_events(session_id, server_timestamp DESC);
```

---

### 3.6 `code_snapshots`
Periodic snapshots of code state for session replay and forensic analysis.

```sql
CREATE TABLE code_snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES coding_sessions(session_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    file_path VARCHAR(500),
    code_content TEXT,
    language VARCHAR(50),
    cursor_position JSONB,  -- {line: 10, column: 5}
    compiler_errors JSONB[],  -- Array of error objects
    snapshot_trigger VARCHAR(50),  -- 'periodic', 'compile', 'save', 'paste'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_snapshots_session ON code_snapshots(session_id, timestamp DESC);
CREATE INDEX idx_snapshots_trigger ON code_snapshots(snapshot_trigger);
```

**Use Cases:**
- Session replay reconstruction
- Plagiarism detection (paste event analysis)
- Error pattern analysis

---

### 3.7 `paste_events` (Academic Integrity)
Explicit tracking of copy/paste operations for academic integrity monitoring.

```sql
CREATE TABLE paste_events (
    paste_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES coding_sessions(session_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    pasted_content TEXT,
    content_length INTEGER,
    cursor_offset INTEGER,
    source_metadata JSONB,  -- Steganographic tracking data (if implemented)
    preceding_activity JSONB,  -- Summary of 30s before paste
    flagged_for_review BOOLEAN DEFAULT FALSE,
    reviewed_by VARCHAR(100),
    review_outcome VARCHAR(50),
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_paste_session ON paste_events(session_id);
CREATE INDEX idx_paste_flagged ON paste_events(flagged_for_review) WHERE flagged_for_review = TRUE;
```

---

### 3.8 `behavioral_states` (ML Inference Results)
Stores predictions from LSTM/ML models about student cognitive state.

```sql
CREATE TABLE behavioral_states (
    state_id BIGSERIAL,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES coding_sessions(session_id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Model Predictions
    state_classification VARCHAR(50),  -- 'flow', 'productive_struggle', 'flailing', 'disengaged'
    confidence_score DOUBLE PRECISION,

    -- Contributing Factors
    cognitive_load_estimate DOUBLE PRECISION,  -- 0.0 to 1.0
    frustration_score DOUBLE PRECISION,
    engagement_score DOUBLE PRECISION,

    -- Intervention Tracking
    intervention_triggered BOOLEAN DEFAULT FALSE,
    intervention_type VARCHAR(100),
    intervention_timestamp TIMESTAMP WITH TIME ZONE,

    -- Model Metadata
    model_version VARCHAR(50),
    feature_vector JSONB,

    PRIMARY KEY (user_id, session_id, timestamp)
);

SELECT create_hypertable('behavioral_states', 'timestamp',
    chunk_time_interval => INTERVAL '1 day');

CREATE INDEX idx_states_session ON behavioral_states(session_id, timestamp DESC);
CREATE INDEX idx_states_classification ON behavioral_states(state_classification);
```

---

### 3.9 `biometric_profiles` (Keystroke Dynamics Authentication)
Baseline behavioral templates for continuous passive authentication (CPA).

```sql
CREATE TABLE biometric_profiles (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

    -- Profile Maturity
    enrollment_status VARCHAR(20) DEFAULT 'training',  -- 'training', 'active', 'inactive'
    training_sessions_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Feature Statistics (JSON for flexibility)
    dwell_time_distribution JSONB,
    flight_time_distribution JSONB,
    digraph_timings JSONB,  -- Common two-key sequences
    trigraph_timings JSONB,

    -- Authentication Thresholds
    similarity_threshold DOUBLE PRECISION,
    anomaly_threshold DOUBLE PRECISION,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_biometric_user ON biometric_profiles(user_id);
```

---

### 3.10 `authentication_events` (CPA Monitoring)
Logs for continuous authentication checks and anomalies.

```sql
CREATE TABLE authentication_events (
    auth_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES coding_sessions(session_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    similarity_score DOUBLE PRECISION,  -- How well current typing matches profile
    risk_score DOUBLE PRECISION,  -- Probability of impostor
    threshold_exceeded BOOLEAN DEFAULT FALSE,

    action_taken VARCHAR(50),  -- 'none', 'flagged', 'challenge', 'locked'
    challenge_result VARCHAR(20),  -- 'passed', 'failed', 'pending'

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_auth_session ON authentication_events(session_id);
CREATE INDEX idx_auth_risk ON authentication_events(risk_score DESC);
```

---

## 4. Continuous Aggregates (TimescaleDB)
Pre-computed materialized views for dashboard performance.

### 4.1 Hourly Session Summary

```sql
CREATE MATERIALIZED VIEW session_summary_hourly
WITH (timescaledb.continuous) AS
SELECT
    user_id,
    time_bucket('1 hour', start_time) AS hour,
    COUNT(*) AS session_count,
    SUM(duration_seconds) AS total_duration_seconds,
    AVG(duration_seconds) AS avg_session_duration
FROM coding_sessions
GROUP BY user_id, hour
WITH NO DATA;

SELECT add_continuous_aggregate_policy('session_summary_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');
```

### 4.2 Daily Keystroke Statistics

```sql
CREATE MATERIALIZED VIEW keystroke_stats_daily
WITH (timescaledb.continuous) AS
SELECT
    user_id,
    time_bucket('1 day', server_timestamp) AS day,
    COUNT(*) AS total_keystrokes,
    COUNT(*) FILTER (WHERE event_type = 'keyDown') AS keydown_count,
    COUNT(*) FILTER (WHERE key_code = 'Backspace') AS backspace_count,
    COUNT(*) FILTER (WHERE key_code = 'Delete') AS delete_count
FROM keystroke_events
GROUP BY user_id, day
WITH NO DATA;

SELECT add_continuous_aggregate_policy('keystroke_stats_daily',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 day');
```

---

## 5. Data Retention Policies

### 5.1 Raw Event Data Retention
```sql
-- Retain raw keystroke events for 90 days, then compress
SELECT add_retention_policy('keystroke_events', INTERVAL '90 days');

-- Compress chunks older than 7 days
SELECT add_compression_policy('keystroke_events', INTERVAL '7 days');
```

### 5.2 Feature Data Retention
```sql
-- Retain feature data for 1 year
SELECT add_retention_policy('keystroke_features', INTERVAL '1 year');
SELECT add_compression_policy('keystroke_features', INTERVAL '30 days');
```

---

## 6. Security & Privacy Measures

### 6.1 Row-Level Security (RLS)
```sql
-- Enable RLS on sensitive tables
ALTER TABLE keystroke_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_states ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own data
CREATE POLICY user_data_isolation ON keystroke_events
    FOR SELECT
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Policy: Instructors can access data for their students
CREATE POLICY instructor_access ON keystroke_events
    FOR SELECT
    USING (
        user_id IN (
            SELECT student_id FROM instructor_students
            WHERE instructor_id = current_setting('app.current_user_id')::UUID
        )
    );
```

### 6.2 Encryption
- **At Rest**: Enable PostgreSQL transparent data encryption (TDE)
- **In Transit**: Enforce SSL/TLS connections
- **Column-Level**: Encrypt `pasted_content` and `code_content` fields

```sql
-- Example using pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt sensitive columns
ALTER TABLE paste_events
    ADD COLUMN pasted_content_encrypted BYTEA;

-- Insert with encryption
INSERT INTO paste_events (pasted_content_encrypted)
VALUES (pgp_sym_encrypt('sensitive code', 'encryption_key'));
```

---

## 7. Performance Optimization

### 7.1 Partitioning Strategy
- **keystroke_events**: 1-day chunks (high write volume)
- **keystroke_features**: 1-week chunks (moderate volume)
- **behavioral_states**: 1-day chunks (real-time ML inference)

### 7.2 Index Maintenance
```sql
-- Regularly monitor index bloat
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Reindex periodically
REINDEX TABLE CONCURRENTLY keystroke_events;
```

### 7.3 Query Optimization
```sql
-- Use time_bucket for aggregations
SELECT
    time_bucket('5 minutes', server_timestamp) AS five_min,
    COUNT(*) AS event_count
FROM keystroke_events
WHERE user_id = 'target_user_uuid'
  AND server_timestamp >= NOW() - INTERVAL '1 hour'
GROUP BY five_min
ORDER BY five_min DESC;
```

---

## 8. Backup & Disaster Recovery

### 8.1 Backup Strategy
- **Full Backup**: Weekly full PostgreSQL dump
- **Incremental**: Daily WAL archiving
- **Point-in-Time Recovery**: Enabled with 30-day retention

```bash
# Full backup command
pg_dump -Fc -d behavioral_analytics > backup_$(date +%Y%m%d).dump

# Restore command
pg_restore -d behavioral_analytics backup_20251005.dump
```

### 8.2 Replication
- **Streaming Replication**: Hot standby for read replicas
- **Logical Replication**: For analytics warehouse sync

---

## 9. Monitoring & Alerting

### 9.1 Key Metrics to Monitor
- Write throughput (events/second)
- Query latency (p50, p95, p99)
- Database size growth rate
- Connection pool utilization
- Replication lag

### 9.2 Alert Conditions
- Write failure rate > 1%
- Query latency p95 > 500ms
- Disk usage > 80%
- Replication lag > 60 seconds

---

## 10. Migration Path

### 10.1 Initial Setup
```sql
-- Create database
CREATE DATABASE behavioral_analytics;

-- Install extensions
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Run schema creation scripts in order:
-- 1. users
-- 2. coding_sessions
-- 3. keystroke_events (+ convert to hypertable)
-- 4. keystroke_features (+ convert to hypertable)
-- 5. Additional tables
-- 6. Indexes
-- 7. Continuous aggregates
-- 8. Retention policies
```

### 10.2 Data Migration from Legacy System
```sql
-- Example migration from flat CSV/JSON files
COPY keystroke_events(session_id, user_id, timestamp_ms, event_type, key_code)
FROM '/path/to/legacy_data.csv'
WITH (FORMAT csv, HEADER true);
```

---

## 11. ER Diagram Summary

```
users (1) ──< (M) coding_sessions
              │
              ├──< keystroke_events
              ├──< mouse_events
              ├──< code_snapshots
              ├──< paste_events
              └──< behavioral_states

users (1) ──── (1) biometric_profiles

coding_sessions (1) ──< (M) authentication_events

keystroke_events (aggregates to) ──> keystroke_features
```

---

## 12. Sample Queries

### 12.1 Calculate Dwell Time for a Session
```sql
SELECT
    kd.key_code,
    kd.timestamp_ms AS press_time,
    ku.timestamp_ms AS release_time,
    (ku.timestamp_ms - kd.timestamp_ms) AS dwell_time_ms
FROM keystroke_events kd
JOIN keystroke_events ku
    ON kd.session_id = ku.session_id
    AND kd.key_code = ku.key_code
    AND kd.event_type = 'keyDown'
    AND ku.event_type = 'keyUp'
    AND ku.timestamp_ms > kd.timestamp_ms
WHERE kd.session_id = 'target_session_uuid'
ORDER BY kd.timestamp_ms
LIMIT 1000;
```

### 12.2 Detect Paste Events by Code Velocity
```sql
WITH code_velocity AS (
    SELECT
        session_id,
        time_bucket('10 seconds', server_timestamp) AS time_window,
        COUNT(*) AS keystrokes_per_window,
        LAG(COUNT(*)) OVER (ORDER BY time_bucket('10 seconds', server_timestamp)) AS prev_keystrokes
    FROM keystroke_events
    WHERE session_id = 'target_session_uuid'
    GROUP BY session_id, time_window
)
SELECT *
FROM code_velocity
WHERE keystrokes_per_window > 200  -- Suspiciously high
   OR (prev_keystrokes < 10 AND keystrokes_per_window > 100);  -- Sudden spike
```

### 12.3 Generate Feature Vector for ML Model
```sql
SELECT
    user_id,
    session_id,
    AVG(CASE WHEN event_type = 'keyDown'
            THEN LEAD(timestamp_ms) OVER (ORDER BY timestamp_ms) - timestamp_ms
        END) AS avg_dwell_time,
    STDDEV(CASE WHEN event_type = 'keyDown'
                THEN LEAD(timestamp_ms) OVER (ORDER BY timestamp_ms) - timestamp_ms
            END) AS std_dwell_time,
    COUNT(*) FILTER (WHERE key_code = 'Backspace') * 1.0 / COUNT(*) AS backspace_ratio
FROM keystroke_events
WHERE session_id = 'target_session_uuid'
  AND server_timestamp >= NOW() - INTERVAL '2 minutes'
GROUP BY user_id, session_id;
```

---

## 13. Next Steps

1. **Schema Implementation**: Execute SQL scripts in test environment
2. **Load Testing**: Simulate 1000+ concurrent users writing events
3. **Query Optimization**: Profile slow queries and add missing indexes
4. **Security Audit**: Engage security team for PII/compliance review
5. **Monitoring Setup**: Configure Prometheus + Grafana dashboards
6. **Documentation**: Create API documentation for data ingestion endpoints

---

**Document Version**: 1.0
**Last Updated**: 2025-10-05
**Database**: TimescaleDB (PostgreSQL 15+)
**Status**: Production-Ready
