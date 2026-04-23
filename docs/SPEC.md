## Forensic Dental Claims Detection Framework (FDCDF)

**Document Status:** Draft
**Version:** 1.0
**Date:** April 9, 2026

---

## Revision History

| Version |       Date | Description                  |
| ------- | ---------: | ---------------------------- |
| 1.0     | 2026-04-09 | Initial IEEE-style SRS draft |

---

# 1. Introduction

## 1.1 Purpose

This Software Requirements Specification defines the functional and non-functional requirements for the **Forensic Dental Claims Detection Framework (FDCDF)**. The system is intended to support dental claims auditing by identifying suspicious claims through structured tooth-level analysis, rule-based forensic checks, clinical consistency validation, statistical surveillance, and explainable risk scoring.

This document is intended for:

* system developers
* project supervisors
* claims analysts
* fraud investigators
* auditors
* testers
* system administrators
* stakeholders responsible for approval and deployment

## 1.2 Scope

The FDCDF is a decision-support system for detecting suspicious dental insurance claims. The system uses **FDI / ISO 3950 tooth notation** as a structured method for representing tooth-level claim data. The system does not replace ISO 3950 and does not independently determine legal fraud. Instead, it integrates FDI-based tooth identification into a broader forensic analytics framework.

The system shall:

* ingest dental claim data and supporting evidence
* validate claim completeness and coding structure
* perform tooth-level and chronology-based consistency checks
* detect suspicious patterns such as upcoding, duplicates, unsupported claims, and impossible procedures
* generate explainable fraud-risk scores
* prioritize claims for audit and investigation
* maintain an auditable trail of decisions and outcomes

The system shall not:

* replace clinical judgment
* make final legal determinations of fraud
* deny claims autonomously unless explicitly authorized by external policy controls
* replace the underlying dental notation standard

## 1.3 Definitions, Acronyms, and Abbreviations

| Term                 | Meaning                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------- |
| FDCDF                | Forensic Dental Claims Detection Framework                                                    |
| FDI                  | Fédération Dentaire Internationale tooth numbering notation                                   |
| ISO 3950             | International standard used for tooth designation                                             |
| Claim                | A request for payment for one or more dental services                                         |
| Claim Line           | An individual service item within a claim                                                     |
| Documented Procedure | Procedure recorded in clinical evidence such as notes, treatment plan, or chart               |
| Verified Procedure   | Procedure confirmed after manual audit or investigation                                       |
| Upcoding             | Submission of a claim for a more complex or costly procedure than was documented or justified |
| Duplicate Claim      | Repeated submission of the same or materially identical claim                                 |
| Risk Score           | Numeric score representing the likelihood that a claim is suspicious                          |
| Alert                | System-generated notification indicating a suspicious condition                               |
| Audit Case           | A review package created for human investigation                                              |

## 1.4 References

The system shall be designed with reference to the following standards and concepts:

* ISO 3950 dental tooth notation
* IEEE software requirements specification practices
* payer or institutional claim coding rules
* dental clinical policy rules as configured by the organization

## 1.5 Overview

The remainder of this document is organized as follows:

* Section 2 describes the overall system context
* Section 3 defines external interface requirements
* Section 4 defines functional requirements
* Section 5 defines data requirements
* Section 6 defines non-functional requirements
* Section 7 defines verification and acceptance requirements
* Appendices provide supporting definitions and traceability guidance

---

# 2. Overall Description

## 2.1 Product Perspective

FDCDF is a standalone or integrated claims analytics application that operates between claim intake and human audit review. It may function as:

* a web-based application
* a module integrated into an insurer’s claims platform
* a batch-processing tool for retrospective audit
* a service connected to electronic health records or claim repositories

The system uses ISO 3950 as a tooth-level structuring mechanism and combines it with:

* validation rules
* clinical consistency rules
* forensic claim rules
* anomaly surveillance logic
* behavioral analytics
* audit workflow support

## 2.2 Product Functions

At a high level, the system shall provide the following functions:

* claim data ingestion
* input validation and normalization
* tooth-level verification using FDI notation
* rule-based suspicious-claim detection
* provider and trend analytics
* claim risk scoring
* alert generation
* audit case creation
* reporting and dashboarding
* case resolution and feedback capture
* rule administration and audit logging

## 2.3 User Classes and Characteristics

| User Class           | Description                                              |
| -------------------- | -------------------------------------------------------- |
| Claims Analyst       | Reviews claim alerts and performs first-level assessment |
| Fraud Investigator   | Investigates high-risk claims and cases                  |
| Dental Auditor       | Validates clinical and procedural consistency            |
| Compliance Officer   | Reviews portfolio trends and audit outcomes              |
| System Administrator | Manages users, permissions, and configurations           |
| Rules Administrator  | Maintains rule catalogs, thresholds, and lookup tables   |
| Management User      | Reviews dashboards, summaries, and audit statistics      |

## 2.4 Operating Environment

The system shall support deployment in one or more of the following environments:

* secure web application environment
* on-premises or cloud-hosted application server
* relational database management system
* secure integration with claim processing and evidence repositories
* modern browser-based user interface

## 2.5 Design and Implementation Constraints

The system shall be constrained by:

* use of FDI / ISO 3950 notation for tooth-level references
* organizational coding rules and payer policies
* availability and quality of source data
* confidentiality requirements for patient and provider records
* auditability and explainability requirements
* clinical rule-base maintenance requirements

## 2.6 User Documentation

The system shall provide or be accompanied by:

* user manual
* administrator guide
* rules configuration guide
* audit workflow guide
* report interpretation guide
* data import specification

## 2.7 Assumptions and Dependencies

The system assumes that:

* dental claims contain at least one billable procedure
* tooth-level references are available for applicable procedures
* provider and patient identifiers are available
* procedure code catalogs and rule tables are maintained
* clinical evidence may be available for some but not all claims
* final fraud determination is performed by authorized humans

The system depends on:

* access to claim data sources
* access to configured dental procedure catalogs
* configured clinical rule sets
* configured user roles and permissions

---

# 3. External Interface Requirements

## 3.1 User Interfaces

### 3.1.1 Claim Review Interface

The system shall provide an interface for reviewing individual claims, including:

* claim identifiers
* patient and provider references
* date of service
* tooth number in FDI format
* claimed procedure and amount
* triggered rules
* evidence summary
* risk score
* recommended action

### 3.1.2 Alert Dashboard

The system shall provide an alert dashboard showing:

* low-, medium-, high-, and critical-risk claims
* sortable and filterable worklists
* provider risk summaries
* claim trends over time
* procedure categories with elevated suspicion rates

### 3.1.3 Audit Case Interface

The system shall provide an audit case view displaying:

* related claims and claim lines
* triggered alerts
* analyst notes
* evidence references
* action history
* final case resolution

### 3.1.4 Administration Interface

The system shall provide administration screens for:

* user management
* role assignment
* rule activation and deactivation
* threshold settings
* catalog maintenance
* audit-log review

## 3.2 Hardware Interfaces

The system shall not require specialized dental hardware. If external imaging or scanning systems are integrated, such interfaces shall be implemented through software APIs or secure file transfer mechanisms.

## 3.3 Software Interfaces

The system shall support integration with:

* claims databases
* EHR or dental charting systems
* procedure code catalogs
* provider master records
* patient master records
* document repositories
* reporting and analytics platforms
* authentication and identity management systems

## 3.4 Communications Interfaces

The system shall support secure communication using organization-approved encrypted network protocols for:

* API integrations
* data import/export
* dashboard access
* audit case retrieval

---

# 4. System Features and Functional Requirements

## 4.1 Data Ingestion and Validation

### 4.1.1 Description

The system shall accept claim and supporting data from configured sources and validate it before forensic analysis.

### 4.1.2 Functional Requirements

**FR-001** The system shall ingest claim data from manual entry, file import, database connection, or API integration.
**FR-002** The system shall capture, at minimum, Claim ID, Patient ID, Provider ID, Date of Service, Claim Submission Date, Claimed Procedure Code, Claimed Amount, and Tooth Number where applicable.
**FR-003** The system shall accept optional evidence fields including Documented Procedure, chart notes, image references, preauthorization references, and treatment history.
**FR-004** The system shall validate required fields for completeness before analysis.
**FR-005** The system shall validate tooth numbers against configured FDI notation rules.
**FR-006** The system shall validate procedure codes against configured procedure catalogs.
**FR-007** The system shall validate date logic, including the relationship among service date, submission date, and historical tooth events.
**FR-008** The system shall detect duplicate record ingestion during import.
**FR-009** The system shall normalize formatting for identifiers, procedure codes, dates, and tooth references.
**FR-010** The system shall mark records as accepted, accepted with warnings, or rejected.
**FR-011** The system shall preserve an import log for all processed records.

---

## 4.2 FDI Tooth-Level Consistency Checking

### 4.2.1 Description

The system shall use FDI notation as a tooth-structuring mechanism for claim analysis.

### 4.2.2 Functional Requirements

**FR-012** The system shall determine whether a referenced tooth number is valid within the configured FDI model.
**FR-013** The system shall distinguish between primary and permanent dentition where required for rule evaluation.
**FR-014** The system shall maintain tooth-level treatment history for each patient where such data exists.
**FR-015** The system shall evaluate whether a claimed procedure is plausible for the referenced tooth.
**FR-016** The system shall detect repeated procedures on the same tooth within a configured interval.
**FR-017** The system shall detect procedure chronology conflicts on the same tooth.
**FR-018** The system shall identify claim lines that reference a tooth whose prior state conflicts with the claimed procedure.
**FR-019** The system shall record all tooth-level inconsistencies as structured alert evidence.

---

## 4.3 Rule-Based Forensic Detection

### 4.3.1 Description

The system shall execute deterministic rules to identify suspicious claim conditions.

### 4.3.2 Functional Requirements

**FR-020** The system shall evaluate each claim against a configurable rule catalog.
**FR-021** The system shall detect exact duplicate claims based on configurable field matching.
**FR-022** The system shall detect near-duplicate claims using configurable similarity rules.
**FR-023** The system shall flag upcoding suspicion when a claimed procedure exceeds the complexity or value of the documented procedure or clinical evidence.
**FR-024** The system shall flag unsupported-claim suspicion when required supporting evidence is absent or inconsistent.
**FR-025** The system shall flag impossible procedure conditions when the claim conflicts with configured clinical rules.
**FR-026** The system shall flag mutually inconsistent procedures billed together without allowable justification.
**FR-027** The system shall flag suspicious repeat treatments that violate configured repeat intervals or policy rules.
**FR-028** The system shall allow organizations to enable, disable, or modify rule thresholds through authorized administration.
**FR-029** The system shall store, for each triggered rule, a rule identifier, severity, explanation, evidence fields used, and execution timestamp.

---

## 4.4 Clinical Consistency Knowledge Base

### 4.4.1 Description

The system shall rely on a configured knowledge base for evaluating dental plausibility.

### 4.4.2 Functional Requirements

**FR-030** The system shall maintain configurable mappings between tooth types and allowable procedure categories.
**FR-031** The system shall support rules based on tooth existence, prior extraction, prior restoration, prior endodontic history, and chronology.
**FR-032** The system shall support configurable repeat intervals for procedures by tooth and procedure type.
**FR-033** The system shall support age-relevant plausibility checks where permitted by organizational policy.
**FR-034** The system shall maintain version history for all clinical rule configurations.
**FR-035** The system shall record the rule-base version used for each claim evaluation.

---

## 4.5 Statistical Surveillance and Trend Analysis

### 4.5.1 Description

The system shall perform aggregate analysis to identify abnormal patterns across claims, providers, procedures, and time.

### 4.5.2 Functional Requirements

**FR-036** The system shall compute frequency distributions of claims by provider, procedure, tooth, and time period.
**FR-037** The system shall support cross-tabulation analysis of selected claim variables.
**FR-038** The system shall support chi-square or equivalent association analysis for aggregate anomaly monitoring.
**FR-039** The system shall identify statistically unusual distributions relative to configured baselines.
**FR-040** The system shall ensure that statistical indicators contribute contextual risk rather than direct fraud determination.
**FR-041** The system shall present statistical findings in management reports and dashboards.

---

## 4.6 Pattern Recognition and Behavioral Analytics

### 4.6.1 Description

The system shall identify repeated suspicious behavior over time.

### 4.6.2 Functional Requirements

**FR-042** The system shall compute provider-level risk indicators based on recurring suspicious patterns.
**FR-043** The system shall normalize provider indicators by claim volume, specialty, or other configured contextual factors.
**FR-044** The system shall identify repeated suspicious claim combinations across time.
**FR-045** The system shall identify concentration of suspicious claims by procedure category, tooth category, or provider.
**FR-046** The system shall support configurable thresholds for provider-level escalation.

---

## 4.7 Risk Scoring

### 4.7.1 Description

The system shall assign an explainable fraud-risk score to claims and optionally to providers.

### 4.7.2 Functional Requirements

**FR-047** The system shall calculate a claim-level risk score using triggered rules, severity weights, evidence strength, historical patterns, and contextual indicators.
**FR-048** The system shall support configurable score bands such as Low, Medium, High, and Critical.
**FR-049** The system shall ensure that every score is traceable to contributing factors.
**FR-050** The system shall support adjustment of weights and thresholds by authorized administrators.
**FR-051** The system shall assign a confidence indicator to each score where sufficient data exists.
**FR-052** The system shall preserve score history for re-evaluation and audit.

---

## 4.8 Alerting and Triage

### 4.8.1 Description

The system shall generate alerts and route claims for review based on risk thresholds.

### 4.8.2 Functional Requirements

**FR-053** The system shall generate an alert when one or more suspicious conditions are detected.
**FR-054** The system shall categorize alerts according to configured severity and score thresholds.
**FR-055** The system shall support triage queues for analyst review, priority audit, and investigation.
**FR-056** The system shall include claim details, triggered rules, score, and recommended action in each alert.
**FR-057** The system shall allow authorized users to assign, reassign, acknowledge, or close alerts.
**FR-058** The system shall preserve alert history and status changes.

---

## 4.9 Audit Case Management

### 4.9.1 Description

The system shall support human review and case resolution.

### 4.9.2 Functional Requirements

**FR-059** The system shall allow users to create an audit case from one or more alerts or claims.
**FR-060** The system shall allow users to attach notes, supporting evidence references, and investigation comments to a case.
**FR-061** The system shall support case statuses such as Open, In Review, Escalated, Closed, and Referred.
**FR-062** The system shall support resolution outcomes including Confirmed Fraud, Suspected Fraud, Legitimate Claim, Coding Error, Insufficient Evidence, and Provider Education Required.
**FR-063** The system shall preserve the full action history of each case.
**FR-064** The system shall support exporting a case summary for formal audit or compliance use.

---

## 4.10 Reporting and Dashboarding

### 4.10.1 Description

The system shall produce operational, analytical, and audit reports.

### 4.10.2 Functional Requirements

**FR-065** The system shall generate claim-level risk reports.
**FR-066** The system shall generate provider-level risk summaries.
**FR-067** The system shall generate trend reports by time period, provider, procedure, and tooth category.
**FR-068** The system shall generate lists of flagged claims and case statuses.
**FR-069** The system shall provide summary statistics for management review.
**FR-070** The system shall allow authorized users to filter, sort, and export reports.
**FR-071** The system shall display the reasons underlying reported risks and alerts.

---

## 4.11 Audit Trail and Traceability

### 4.11.1 Description

The system shall maintain a defensible audit trail of all inputs, analyses, actions, and outcomes.

### 4.11.2 Functional Requirements

**FR-072** The system shall log the data source and processing time for every ingested claim.
**FR-073** The system shall log the rules executed and rule outcomes for every evaluated claim.
**FR-074** The system shall log score inputs and resulting risk levels.
**FR-075** The system shall log all user actions affecting alerts, cases, and configuration.
**FR-076** The system shall preserve historical snapshots sufficient to reproduce prior decisions.
**FR-077** The system shall support retrieval of audit logs by authorized users.

---

## 4.12 Configuration and Administration

### 4.12.1 Description

The system shall support secure administration of users, rules, thresholds, and lookup tables.

### 4.12.2 Functional Requirements

**FR-078** The system shall support role-based access control.
**FR-079** The system shall allow authorized administrators to manage users and permissions.
**FR-080** The system shall allow authorized rules administrators to maintain rule catalogs, weights, thresholds, and baselines.
**FR-081** The system shall maintain version control for rules and scoring configurations.
**FR-082** The system shall require administrative actions to be audited.

---

## 4.13 Feedback and Continuous Improvement

### 4.13.1 Description

The system shall support learning from investigation outcomes.

### 4.13.2 Functional Requirements

**FR-083** The system shall store final case outcomes for closed investigations.
**FR-084** The system shall allow authorized users to mark alerts as true positive, false positive, or unresolved.
**FR-085** The system shall support the use of outcome data for threshold tuning and rule refinement.
**FR-086** The system shall preserve a record of changes made as a result of feedback.

---

# 5. Data Requirements

## 5.1 Logical Data Model

The system shall maintain data entities including:

* Patient
* Provider
* Claim
* Claim Line
* Tooth History
* Procedure Catalog
* Clinical Rule
* Alert
* Risk Score
* Audit Case
* Investigation Outcome
* Audit Log
* Configuration Version

## 5.2 Mandatory Data Elements

The minimum claim record shall include:

* Claim ID
* Patient ID
* Provider ID
* Date of Service
* Claim Submission Date
* Claimed Procedure Code
* Claimed Procedure Description
* Claimed Amount
* Tooth Number where applicable

## 5.3 Optional Data Elements

The system shall support optional fields including:

* Documented Procedure Code
* Tooth surface
* chart notes
* radiograph reference
* treatment plan reference
* preauthorization reference
* provider specialty
* patient age or date of birth
* benefit plan information
* encounter ID

## 5.4 Data Quality Requirements

**DR-001** The system shall reject records missing mandatory identifiers unless the record is explicitly allowed into an exception queue.
**DR-002** The system shall preserve data provenance for all imported evidence fields.
**DR-003** The system shall distinguish source claim data from verified audit data.
**DR-004** The system shall support historical storage of tooth-level events where available.
**DR-005** The system shall maintain referential integrity across claims, claim lines, patients, providers, and alerts.

## 5.5 Data Retention

The system shall support configurable retention rules for:

* claims
* alerts
* audit cases
* logs
* configuration versions
* investigation outcomes

## 5.6 Data Privacy

The system shall protect personally identifiable and sensitive claim information through role-based restrictions and secure storage controls.

---

# 6. Non-Functional Requirements

## 6.1 Performance

**NFR-001** The system shall process claims within organization-defined operational response times.
**NFR-002** The system shall support batch analysis for large claim volumes.
**NFR-003** The system shall support interactive retrieval of alerts and cases for normal operational workloads.

## 6.2 Reliability and Availability

**NFR-004** The system shall preserve data integrity during partial failures or interrupted imports.
**NFR-005** The system shall provide error handling and recovery for failed processing jobs.
**NFR-006** The system shall maintain consistent scoring behavior for the same inputs and configuration version.
**NFR-007** The system shall be available according to organizational service requirements.

## 6.3 Security

**NFR-008** The system shall enforce authentication for all users.
**NFR-009** The system shall enforce role-based authorization.
**NFR-010** The system shall encrypt data in transit using approved secure protocols.
**NFR-011** The system shall protect stored sensitive data using approved security controls.
**NFR-012** The system shall log security-relevant events.
**NFR-013** The system shall prevent unauthorized access to patient, provider, and case data.

## 6.4 Usability

**NFR-014** The system shall present alerts and claims in a clear, reviewer-friendly format.
**NFR-015** The system shall display reasons for alerts and scores in understandable language.
**NFR-016** The system shall support filtering and navigation for high-volume review queues.

## 6.5 Maintainability

**NFR-017** The system shall allow rule and threshold changes without requiring full system redesign.
**NFR-018** The system shall separate business rules from source code where feasible.
**NFR-019** The system shall maintain configuration version histories.
**NFR-020** The system shall support modular replacement or extension of rule sets and analytics modules.

## 6.6 Scalability

**NFR-021** The system shall support growth in claim volume, users, providers, and rule complexity.
**NFR-022** The system shall support horizontal or vertical scaling consistent with the deployment architecture.

## 6.7 Explainability and Auditability

**NFR-023** The system shall provide traceable explanations for all triggered alerts and risk scores.
**NFR-024** The system shall support reconstruction of prior evaluations based on stored inputs and configuration versions.
**NFR-025** The system shall clearly distinguish suspicion indicators from confirmed fraud outcomes.

## 6.8 Interoperability

**NFR-026** The system shall support structured import and export formats approved by the organization.
**NFR-027** The system shall support integration with external systems through documented interfaces.

---

# 7. Verification and Acceptance Requirements

## 7.1 General Verification Approach

Requirements shall be verified using one or more of the following:

* inspection
* analysis
* demonstration
* test

## 7.2 Functional Acceptance Criteria

**AC-001** The system shall successfully ingest valid claim records and reject or warn on invalid records.
**AC-002** The system shall correctly validate tooth numbers and procedure codes using configured catalogs.
**AC-003** The system shall detect configured duplicate scenarios.
**AC-004** The system shall flag configured tooth-procedure mismatches.
**AC-005** The system shall produce risk scores with visible contributing factors.
**AC-006** The system shall generate alerts and route them to the appropriate review queue.
**AC-007** The system shall allow users to create, update, and close audit cases.
**AC-008** The system shall generate reports showing flagged claims, provider summaries, and trend information.
**AC-009** The system shall preserve audit logs for claim analysis and user actions.
**AC-010** The system shall allow authorized administrators to update rules, thresholds, and user permissions.

## 7.3 Non-Functional Acceptance Criteria

**AC-011** The system shall meet approved security requirements for authentication, authorization, and encrypted communication.
**AC-012** The system shall demonstrate reproducible results for the same inputs under the same configuration version.
**AC-013** The system shall meet approved operational performance targets under representative workloads.
**AC-014** The system shall provide understandable explanations for alerts and scores during user testing.

---

# Appendix A. High-Level Use Cases

## UC-01: Import Claim Data

**Primary Actor:** Claims Analyst or external claims system
**Precondition:** User or integration is authorized
**Main Flow:**

1. Claim data is submitted to the system.
2. The system validates the data.
3. The system accepts, warns, or rejects the record.
4. Accepted claims are forwarded for forensic analysis.

## UC-02: Analyze Claim for Suspicion

**Primary Actor:** System
**Precondition:** Claim is accepted into the system
**Main Flow:**

1. The system runs tooth-level consistency checks.
2. The system executes rule-based detection.
3. The system computes contextual indicators.
4. The system calculates the risk score.
5. The system creates alerts if thresholds are exceeded.

## UC-03: Review Alert

**Primary Actor:** Claims Analyst
**Precondition:** Alert exists
**Main Flow:**

1. The analyst opens the alert.
2. The system displays claim details, rule hits, and score explanation.
3. The analyst acknowledges, comments on, escalates, or closes the alert.

## UC-04: Investigate Audit Case

**Primary Actor:** Fraud Investigator or Dental Auditor
**Precondition:** Case is created
**Main Flow:**

1. Investigator reviews linked claims and evidence.
2. Investigator records findings and outcome.
3. System stores resolution and preserves case history.

## UC-05: Manage Rules and Thresholds

**Primary Actor:** Rules Administrator
**Precondition:** Authorized access
**Main Flow:**

1. Administrator edits rule or threshold configuration.
2. System validates the change.
3. System stores the new version and logs the action.

---

# Appendix B. Sample Alert Categories

| Category                 | Description                                               |
| ------------------------ | --------------------------------------------------------- |
| Exact Duplicate          | Same claim or claim line submitted more than once         |
| Near Duplicate           | Materially similar resubmission or split billing scenario |
| Upcoding Suspicion       | Claimed procedure exceeds documented justification        |
| Unsupported Claim        | Required evidence is absent or inconsistent               |
| Tooth-Procedure Mismatch | Procedure conflicts with tooth identity or state          |
| Chronology Conflict      | Procedure sequence on the tooth is implausible            |
| Suspicious Repeat        | Same procedure repeated outside allowable logic           |
| Provider Pattern Risk    | Recurrent suspicious behavior by provider                 |

---

# Appendix C. Statement of Intended Use

The FDCDF is an **audit-support and risk-screening system**. It is intended to identify claims requiring human review. A system-generated alert or score shall not by itself constitute proof of fraud.

---
