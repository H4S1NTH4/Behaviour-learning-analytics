# Software Requirements Specification
## Keystroke Dynamics Data Capturing System

---

## 1. Project Overview and Goal

This module defines the requirements for capturing, buffering, and transmitting high-resolution keystroke data within a web-based code editor environment. The primary goal is to gather millisecond-accurate timing features necessary for Keystroke Dynamics (KD) User Profiling and behavioral analysis.

| Field | Description |
|-------|-------------|
| **Application** | Web-Based Code Editor (IDE) for student use (built upon Monaco Editor/Eclipse Theia) |
| **Objective** | Capture T<sub>P</sub> (Press Time) and T<sub>R</sub> (Release Time) data for every key event |
| **Scope** | Client-side JavaScript/TypeScript module for event capture and transmission |
| **Non-Functional** | Logging process must be non-intrusive and not slow down the user's typing experience |

---

## 2. Core Keystroke Event Schema

The logger module **MUST** record a single JSON object for every single `keydown` and `keyup` event that occurs while the code editor is in focus.

### 2.1 Event Data Structure

| Field Name | Data Type | Requirement / Source | Notes |
|------------|-----------|----------------------|-------|
| `session_id` | String | Unique ID generated at session start | Links all events to a single coding session |
| `user_id` | String | Unique, non-identifiable student identifier | Used for creating the biometric profile template |
| `event_type` | String | Mandatory values: `"keyDown"` or `"keyUp"` | Distinguishes key press from release for all KD feature calculations |
| `timestamp_ms` | Number (Float) | **MUST** be captured using `performance.now()` (or equivalent high-resolution timer) | **CRITICAL** for millisecond-accurate timing (Dwell, Press-Press, Release-Press times) |
| `key_code` | String | The physical key location code: `KeyboardEvent.code` (e.g., `"KeyA"`, `"ShiftLeft"`, `"Enter"`) | Identifies the exact key pressed (e.g., differentiates left vs. right Shift) |
| `key_value` | String | The character value of the key: `KeyboardEvent.key` (e.g., `"a"`, `"Enter"`, `" "` (Space)) | Human-readable content |
| `cursor_offset` | Number | The zero-indexed character position (offset) of the cursor at the moment of the event | Provides contextual data for revision analysis |
| `modifier_state` | Object | `{ shift: Boolean, ctrl: Boolean, alt: Boolean, meta: Boolean }` | State of all modifier keys during the event |

---

## 3. Data Transmission and Resiliency

Data transmission must prioritize performance (non-blocking) and reliability (data integrity).

### 3.1 Client-Side Batching (The Buffer)

- **Storage**: All raw event objects are stored in a temporary, in-memory JavaScript array (the buffer)
- **Batch Triggers**: The buffer contents must be transmitted and cleared when **EITHER** of the following limits is met:
  - **Time Limit**: 5 seconds have elapsed since the last successful transmission
  - **Size Limit**: The buffer contains 100 event records

### 3.2 Transmission Protocol

- **Endpoint**: Data must be sent via asynchronous HTTP POST to the dedicated logging endpoint (e.g., `/api/v1/keystrokes/log`)
- **Payload Format**: The request body must be a single JSON array containing the batched event objects
- **Asynchronicity**: Transmission logic **MUST** be non-blocking and use native asynchronous browser functions (`fetch()` or `navigator.sendBeacon()`) to ensure zero perceived typing lag
- **Session End**: The module must attempt a final, immediate transmission using `navigator.sendBeacon()` upon browser closure (`window.onbeforeunload`) to maximize data recovery

### 3.3 Error Handling

If a batch transmission fails (e.g., server timeout, network disconnect), the data **MUST** be retained in the buffer for re-attempting transmission with the next scheduled batch. Failed data must not be permanently lost on the client.

---

## 4. Implementation Guidance (Monaco Editor Integration)

The logger should hook into the editor's event model for high-fidelity capture:

### 4.1 Listener Registration

The `editor.onKeyDown` and `editor.onKeyUp` events must be registered on the Monaco Editor instance immediately after it mounts (via the `onMount` callback).

### 4.2 Timing and Key Code Capture

```javascript
// Example of capturing key down event data
editor.onKeyDown((e) => {
  const eventTime = performance.now();
  const position = editor.getPosition();

  const logRecord = {
    event_type: "keyDown",
    timestamp_ms: eventTime,
    key_code: e.code,
    key_value: e.key,
    cursor_offset: calculateOffset(position), // Custom function needed
    // ... include user_id, session_id, and modifier_state
  };

  buffer.push(logRecord);
});
```

### 4.3 Ethical Requirement

The system must implement a visible notification or clear consent procedure to inform students that their typing patterns are being recorded for research purposes.

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Data capture must not introduce perceptible latency to the typing experience
- Target: < 1ms overhead per keystroke event
- Transmission operations must be fully asynchronous

### 5.2 Reliability
- Zero data loss for captured events under normal operating conditions
- Graceful degradation during network failures
- Persistent retry mechanism for failed transmissions

### 5.3 Privacy & Security
- All data transmission must use HTTPS
- Data must be anonymized where possible
- Compliance with FERPA, GDPR, and institutional data policies
- Clear opt-in consent mechanism required

### 5.4 Scalability
- System must handle concurrent sessions from 1000+ students
- Server-side infrastructure must scale to process high-volume event streams
- Time-series database recommended for efficient storage and querying

---

## 6. System Architecture

### 6.1 Client-Side Components
- **Event Capture Module**: Hooks into Monaco Editor events
- **Buffer Manager**: In-memory storage with size and time-based triggers
- **Transmission Manager**: Handles async HTTP requests and retry logic
- **Session Manager**: Generates and maintains session identifiers

### 6.2 Server-Side Components
- **Ingestion API**: RESTful endpoint for receiving batched events
- **Data Validation Layer**: Schema validation and sanitization
- **Storage Layer**: Time-series database (e.g., InfluxDB, TimescaleDB)
- **Processing Pipeline**: Feature extraction and analytics modules

---

## 7. Future Considerations

### 7.1 Enhanced Data Capture
- Mouse dynamics (movements, clicks, scrolls)
- Code compilation events
- Debugging actions
- Copy/paste operations
- IDE navigation patterns

### 7.2 Advanced Analytics
- Real-time behavioral anomaly detection
- Keystroke dynamics authentication
- Cognitive load estimation
- Struggle detection using LSTM models
- Academic integrity monitoring

### 7.3 Integration Points
- LMS integration (Canvas, Moodle)
- Learning analytics dashboards
- Intelligent tutoring systems
- Adaptive scaffolding mechanisms

---

## 8. Acceptance Criteria

### 8.1 Functional
- [ ] All keydown/keyup events captured with millisecond precision
- [ ] Events contain all required fields per schema
- [ ] Batching triggers work correctly (time and size limits)
- [ ] Successful transmission to server endpoint
- [ ] Failed transmissions are retried appropriately
- [ ] Session end transmissions complete before page unload

### 8.2 Non-Functional
- [ ] No perceptible typing lag introduced
- [ ] Zero data loss under normal conditions
- [ ] HTTPS encryption for all transmissions
- [ ] Consent mechanism implemented and visible
- [ ] System handles 1000+ concurrent users
- [ ] Compliant with relevant privacy regulations

---

## 9. Glossary

| Term | Definition |
|------|------------|
| **Dwell Time** | Duration a key is held down (time between keydown and keyup) |
| **Flight Time** | Time between releasing one key and pressing the next |
| **Press-Press Time** | Time between two consecutive keydown events |
| **KD** | Keystroke Dynamics - behavioral biometric based on typing patterns |
| **CPA** | Continuous Passive Authentication - seamless identity verification |
| **LSTM** | Long Short-Term Memory - neural network for sequence modeling |
| **Monaco Editor** | Open-source code editor (powers VS Code) |

---

**Document Version**: 1.0
**Last Updated**: 2025-10-05
**Status**: Draft
