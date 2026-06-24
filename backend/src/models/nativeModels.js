import mongoose from "mongoose";

const { Schema } = mongoose;

const baseOptions = {
  timestamps: true,
  versionKey: false,
};

const stringId = {
  type: String,
  required: true,
};

const TenantSchema = new Schema(
  {
    _id: stringId,
    name: { type: String, required: true },
    board: { type: String, default: "MPBSE" },
    code: { type: String, required: true, unique: true, index: true },
    status: { type: String, default: "active", index: true },
    settings: { type: Schema.Types.Mixed, default: {} },
  },
  baseOptions,
);

const BranchSchema = new Schema(
  {
    _id: stringId,
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "Madhya Pradesh" },
    pinCode: { type: String, default: "" },
    status: { type: String, default: "active", index: true },
  },
  baseOptions,
);
BranchSchema.index({ tenantId: 1, code: 1 }, { unique: true });

const PermissionSchema = new Schema(
  {
    _id: stringId,
    module: { type: String, required: true },
    moduleKey: { type: String, required: true, index: true },
    action: { type: String, required: true },
    actionKey: { type: String, required: true },
    permissionKey: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: "" },
    menuGroup: { type: String, default: "" },
    isMenuPermission: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
    status: { type: String, default: "active", index: true },
  },
  baseOptions,
);

const RoleSchema = new Schema(
  {
    _id: stringId,
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    key: { type: String, required: true },
    description: { type: String, default: "" },
    permissions: [{ type: String }],
    isSystemRole: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, default: "active", index: true },
    createdBy: { type: String, default: null },
    updatedBy: { type: String, default: null },
  },
  baseOptions,
);
RoleSchema.index({ tenantId: 1, key: 1 }, { unique: true });

const UserSchema = new Schema(
  {
    _id: stringId,
    tenantId: { type: String, required: true, index: true },
    branchId: { type: String, required: true, index: true },
    fullName: { type: String, required: true },
    username: { type: String, required: true, lowercase: true },
    email: { type: String, default: "", lowercase: true },
    mobile: { type: String, default: "" },
    passwordHash: { type: String, required: true },
    roleId: { type: String, required: true, index: true },
    roleKey: { type: String, required: true, index: true },
    assignedClasses: [{ type: String }],
    assignedSections: [{ type: String }],
    allowedPermissions: [{ type: String }],
    deniedPermissions: [{ type: String }],
    status: { type: String, default: "active", index: true },
    passwordChangedAt: { type: String, default: null },
    lastLoginAt: { type: String, default: null },
    lastLoginIp: { type: String, default: null },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: String, default: null },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: String, default: null },
    updatedBy: { type: String, default: null },
  },
  baseOptions,
);
UserSchema.index({ tenantId: 1, username: 1 }, { unique: true });
UserSchema.index({ tenantId: 1, email: 1 }, { sparse: true });
UserSchema.index({ tenantId: 1, mobile: 1 }, { sparse: true });

const UserSessionSchema = new Schema(
  {
    _id: stringId,
    tenantId: { type: String, required: true, index: true },
    branchId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    refreshTokenHash: { type: String, required: true },
    refreshTokenId: { type: String, required: true, unique: true },
    userAgent: { type: String, default: "" },
    ipAddress: { type: String, default: "" },
    expiresAt: { type: String, required: true },
    revokedAt: { type: String, default: null },
    revokedBy: { type: String, default: null },
    revokeReason: { type: String, default: null },
    isActive: { type: Boolean, default: true, index: true },
  },
  baseOptions,
);
UserSessionSchema.index({ userId: 1, isActive: 1 });

const AcademicSessionSchema = new Schema(
  {
    _id: stringId,
    tenantId: { type: String, required: true, index: true },
    branchId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    isCurrent: { type: Boolean, default: false, index: true },
    status: { type: String, default: "active", index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: String, default: null },
    updatedBy: { type: String, default: null },
  },
  baseOptions,
);
AcademicSessionSchema.index(
  { tenantId: 1, branchId: 1, name: 1 },
  { unique: true },
);

const ClassSchema = new Schema(
  {
    _id: stringId,
    tenantId: { type: String, required: true, index: true },
    branchId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    displayName: { type: String, required: true },
    code: { type: String, required: true },
    sortOrder: { type: Number, default: 0, index: true },
    status: { type: String, default: "active", index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: String, default: null },
    updatedBy: { type: String, default: null },
  },
  baseOptions,
);
ClassSchema.index({ tenantId: 1, branchId: 1, code: 1 }, { unique: true });
ClassSchema.index({ tenantId: 1, branchId: 1, name: 1 }, { unique: true });

const SectionSchema = new Schema(
  {
    _id: stringId,
    tenantId: { type: String, required: true, index: true },
    branchId: { type: String, required: true, index: true },
    classId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, default: "active", index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: String, default: null },
    updatedBy: { type: String, default: null },
  },
  baseOptions,
);
SectionSchema.index(
  { tenantId: 1, branchId: 1, classId: 1, code: 1 },
  { unique: true },
);

const StudentSchema = new Schema(
  {
    _id: stringId,
    tenantId: { type: String, required: true, index: true },
    branchId: { type: String, required: true, index: true },
    scholarNumber: { type: String, required: true },
    studentName: { type: String, required: true, index: true },
    gender: { type: String, required: true, index: true },
    dob: { type: String, default: "" },
    mobileNumber: { type: String, default: "" },
    classId: { type: String, required: true, index: true },
    sectionId: { type: String, default: "", index: true },
    rollNumber: { type: String, default: "" },
    admissionDate: { type: String, required: true, index: true },
    academicSessionId: { type: String, required: true, index: true },
    aadhaarNumber: { type: String, default: "" },
    samagraId: { type: String, default: "" },
    penNumber: { type: String, default: "" },
    fatherName: { type: String, default: "" },
    motherName: { type: String, default: "" },
    guardianName: { type: String, default: "" },
    parentMobile: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pin: { type: String, default: "" },
    photoUrl: { type: String, default: "" },
    category: { type: String, default: "", index: true },
    religion: { type: String, default: "" },
    bloodGroup: { type: String, default: "" },
    status: { type: String, default: "active", index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: String, default: null },
    updatedBy: { type: String, default: null },
  },
  baseOptions,
);
StudentSchema.index(
  { tenantId: 1, branchId: 1, scholarNumber: 1 },
  { unique: true },
);
StudentSchema.index({
  tenantId: 1,
  branchId: 1,
  academicSessionId: 1,
  classId: 1,
  sectionId: 1,
});

const StudentFieldConfigSchema = new Schema(
  {
    _id: stringId,
    tenantId: { type: String, required: true, index: true },
    branchId: { type: String, required: true, index: true },
    groupKey: { type: String, required: true },
    groupLabel: { type: String, required: true },
    fieldKey: { type: String, required: true },
    label: { type: String, required: true },
    isVisible: { type: Boolean, default: true },
    isMandatory: { type: Boolean, default: false },
    isReadOnly: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, default: "active" },
    createdBy: { type: String, default: null },
    updatedBy: { type: String, default: null },
  },
  baseOptions,
);
StudentFieldConfigSchema.index(
  { tenantId: 1, branchId: 1, fieldKey: 1 },
  { unique: true },
);

const AttendanceRecordSchema = new Schema(
  {
    _id: stringId,
    tenantId: { type: String, required: true, index: true },
    branchId: { type: String, required: true, index: true },
    academicSessionId: { type: String, required: true, index: true },
    classId: { type: String, required: true, index: true },
    sectionId: { type: String, default: "", index: true },
    studentId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    status: { type: String, required: true, index: true },
    remarks: { type: String, default: "" },
    isDeleted: { type: Boolean, default: false, index: true },
    markedBy: { type: String, default: null },
    updatedBy: { type: String, default: null },
  },
  baseOptions,
);
AttendanceRecordSchema.index(
  {
    tenantId: 1,
    branchId: 1,
    academicSessionId: 1,
    studentId: 1,
    date: 1,
  },
  { unique: true },
);
AttendanceRecordSchema.index({
  tenantId: 1,
  branchId: 1,
  date: 1,
  classId: 1,
  sectionId: 1,
});

const MixedRecordSchema = new Schema(
  {
    _id: stringId,
    tenantId: { type: String, index: true },
    branchId: { type: String, index: true },
  },
  { strict: false, timestamps: true, versionKey: false },
);

export const Tenant =
  mongoose.models.Tenant || mongoose.model("Tenant", TenantSchema, "tenants");

export const Branch =
  mongoose.models.Branch || mongoose.model("Branch", BranchSchema, "branches");

export const Permission =
  mongoose.models.Permission ||
  mongoose.model("Permission", PermissionSchema, "permissions");

export const Role =
  mongoose.models.Role || mongoose.model("Role", RoleSchema, "roles");

export const User =
  mongoose.models.User || mongoose.model("User", UserSchema, "users");

export const UserSession =
  mongoose.models.UserSession ||
  mongoose.model("UserSession", UserSessionSchema, "user_sessions");

export const AcademicSession =
  mongoose.models.AcademicSession ||
  mongoose.model("AcademicSession", AcademicSessionSchema, "academic_sessions");

export const ClassModel =
  mongoose.models.ClassModel ||
  mongoose.model("ClassModel", ClassSchema, "classes");

export const Section =
  mongoose.models.Section ||
  mongoose.model("Section", SectionSchema, "sections");

export const Student =
  mongoose.models.Student ||
  mongoose.model("Student", StudentSchema, "students");

export const StudentFieldConfig =
  mongoose.models.StudentFieldConfig ||
  mongoose.model(
    "StudentFieldConfig",
    StudentFieldConfigSchema,
    "student_field_configs",
  );

export const AttendanceRecord =
  mongoose.models.AttendanceRecord ||
  mongoose.model(
    "AttendanceRecord",
    AttendanceRecordSchema,
    "attendance_records",
  );

export const ActivityLog =
  mongoose.models.ActivityLog ||
  mongoose.model("ActivityLog", MixedRecordSchema, "activity_logs");

export const StudentImportBatch =
  mongoose.models.StudentImportBatch ||
  mongoose.model(
    "StudentImportBatch",
    MixedRecordSchema,
    "student_import_batches",
  );

export const BackupHistory =
  mongoose.models.BackupHistory ||
  mongoose.model("BackupHistory", MixedRecordSchema, "backup_history");

export const nativeCollections = Object.freeze({
  tenants: Tenant,
  branches: Branch,
  permissions: Permission,
  roles: Role,
  users: User,
  user_sessions: UserSession,
  academic_sessions: AcademicSession,
  classes: ClassModel,
  sections: Section,
  students: Student,
  student_field_configs: StudentFieldConfig,
  attendance_records: AttendanceRecord,
  activity_logs: ActivityLog,
  student_import_batches: StudentImportBatch,
  backup_history: BackupHistory,
});
