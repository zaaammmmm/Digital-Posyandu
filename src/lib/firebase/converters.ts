import {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from "firebase/firestore";
import { Child, Visit } from "@/types/domain";

export const childConverter: FirestoreDataConverter<Child> = {
  toFirestore: (child: Child) => ({ ...child }),
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Child => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      posyanduId: data.posyanduId,
      registrationNumber: data.registrationNumber,
      fullName: data.fullName,
      dateOfBirth: data.dateOfBirth,
      sex: data.sex,
      birthWeightKg: data.birthWeightKg,
      guardianUid: data.guardianUid,
      guardianName: data.guardianName,
      guardianContact: data.guardianContact,
      recordStatus: data.recordStatus,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  },
};

export const visitConverter: FirestoreDataConverter<Visit> = {
  toFirestore: (visit: Visit) => ({ ...visit }),
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Visit => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      childId: data.childId,
      posyanduId: data.posyanduId,
      guardianUid: data.guardianUid,
      visitDate: data.visitDate,
      recordedBy: data.recordedBy,
      verificationStatus: data.verificationStatus,
      verifiedBy: data.verifiedBy,
      verifiedAt: data.verifiedAt,
      notes: data.notes,
      version: data.version ?? 1,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  },
};
