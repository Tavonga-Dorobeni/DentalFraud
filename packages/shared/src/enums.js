"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToothDentitionType = exports.AlertStatus = exports.RiskBand = exports.RuleSeverity = exports.ClaimStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["ANALYST"] = "ANALYST";
    UserRole["INVESTIGATOR"] = "INVESTIGATOR";
    UserRole["RULES_ADMIN"] = "RULES_ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
var ClaimStatus;
(function (ClaimStatus) {
    ClaimStatus["ACCEPTED"] = "ACCEPTED";
    ClaimStatus["ACCEPTED_WITH_WARNINGS"] = "ACCEPTED_WITH_WARNINGS";
    ClaimStatus["REJECTED"] = "REJECTED";
})(ClaimStatus || (exports.ClaimStatus = ClaimStatus = {}));
var RuleSeverity;
(function (RuleSeverity) {
    RuleSeverity["LOW"] = "LOW";
    RuleSeverity["MEDIUM"] = "MEDIUM";
    RuleSeverity["HIGH"] = "HIGH";
    RuleSeverity["CRITICAL"] = "CRITICAL";
})(RuleSeverity || (exports.RuleSeverity = RuleSeverity = {}));
var RiskBand;
(function (RiskBand) {
    RiskBand["LOW"] = "LOW";
    RiskBand["MEDIUM"] = "MEDIUM";
    RiskBand["HIGH"] = "HIGH";
    RiskBand["CRITICAL"] = "CRITICAL";
})(RiskBand || (exports.RiskBand = RiskBand = {}));
var AlertStatus;
(function (AlertStatus) {
    AlertStatus["OPEN"] = "OPEN";
    AlertStatus["ACKNOWLEDGED"] = "ACKNOWLEDGED";
    AlertStatus["CLOSED"] = "CLOSED";
})(AlertStatus || (exports.AlertStatus = AlertStatus = {}));
var ToothDentitionType;
(function (ToothDentitionType) {
    ToothDentitionType["PRIMARY"] = "PRIMARY";
    ToothDentitionType["PERMANENT"] = "PERMANENT";
})(ToothDentitionType || (exports.ToothDentitionType = ToothDentitionType = {}));
