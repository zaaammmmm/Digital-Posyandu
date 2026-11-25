import { VerificationStatus, Role } from "./verification";

export interface Posyandu {
  id: string;
  name: string;
  addressArea: string;
  village: string;
  district: string;
  regency: string;
  province: string;
  serviceSchedule: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface Child {
  id: string;
  posyanduId: string;
  registrationNumber: string;
  fullName: string;
  dateOfBirth: string;
  sex: "male" | "female";
  birthWeightKg?: number;
  guardianUid?: string;
  guardianName: string;
  guardianContact: string;
  recordStatus: "active" | "archived" | "needs_verification";
  createdAt: string;
  updatedAt: string;
}

export interface Visit {
  id: string;
  childId: string;
  posyanduId: string;
  guardianUid?: string;
  visitDate: string;
  recordedBy: string;
  verificationStatus: VerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface AnthropometryMeasurement {
  id: string;
  visitId: string;
  childId: string;
  weightKg: number;
  lengthHeightCm: number;
  measurementType: "recumbent_length" | "standing_height";
  headCircumferenceCm?: number;
  muacCm?: number;
  qualityFlags: string[];
  verificationStatus: VerificationStatus;
  measuredAt: string;
  recordedBy: string;
}

export interface GrowthAssessment {
  id: string;
  measurementId: string;
  childId: string;
  indicator: "WAZ" | "LAZ_HAZ" | "WLZ_WHZ";
  zScore: number | null;
  classificationCode: string;
  referenceStandard: string;
  referenceVersion: string;
  calculationEngineVersion: string;
  reviewStatus: string;
  calculatedAt: string;
}

export interface AiSummary {
  id: string;
  childId: string;
  visitId: string;
  inputRecordVersion: number;
  modelProvider: string;
  modelVersion: string;
  promptVersion: string;
  knowledgeSourceIds: string[];
  generatedText: string;
  safetyStatus: "passed" | "fallback_template";
  reviewStatus: "auto_checked" | "verified_by_reviewer";
  generatedAt: string;
}

export interface AuditLog {
  id: string;
  actorUserId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  beforeSnapshot: Record<string, unknown> | null;
  afterSnapshot: Record<string, unknown> | null;
  reason: string;
  timestamp: string;
}

export interface EducationContent {
  id: string;
  title: string;
  topic: string;
  body: string;
  sourceTitle: string;
  publisher: string;
  version: string;
  status: "published" | "draft" | "deprecated";
}
