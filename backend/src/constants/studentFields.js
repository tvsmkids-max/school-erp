export const STUDENT_FIELD_DEFINITIONS = Object.freeze([
  {
    groupKey: "basic_details",
    groupLabel: "Basic Details",
    fields: [
      { fieldKey: "scholarNumber", label: "Scholar Number", defaultVisible: true, defaultMandatory: true, defaultReadOnly: false, sortOrder: 10 },
      { fieldKey: "studentName", label: "Student Name", defaultVisible: true, defaultMandatory: true, defaultReadOnly: false, sortOrder: 20 },
      { fieldKey: "gender", label: "Gender", defaultVisible: true, defaultMandatory: true, defaultReadOnly: false, sortOrder: 30 },
      { fieldKey: "dob", label: "Date of Birth", defaultVisible: true, defaultMandatory: false, defaultReadOnly: false, sortOrder: 40 },
      { fieldKey: "mobileNumber", label: "Mobile Number", defaultVisible: true, defaultMandatory: false, defaultReadOnly: false, sortOrder: 50 },
    ],
  },
  {
    groupKey: "academic_details",
    groupLabel: "Academic Details",
    fields: [
      { fieldKey: "classId", label: "Class", defaultVisible: true, defaultMandatory: true, defaultReadOnly: false, sortOrder: 110 },
     { fieldKey: "sectionId", label: "Section", defaultVisible: true, defaultMandatory: false, defaultReadOnly: false, sortOrder: 120 }, { fieldKey: "rollNumber", label: "Roll Number", defaultVisible: true, defaultMandatory: false, defaultReadOnly: false, sortOrder: 130 },
      { fieldKey: "admissionDate", label: "Admission Date", defaultVisible: true, defaultMandatory: true, defaultReadOnly: false, sortOrder: 140 },
      { fieldKey: "academicSessionId", label: "Academic Session", defaultVisible: true, defaultMandatory: true, defaultReadOnly: false, sortOrder: 150 },
    ],
  },
  {
    groupKey: "government_ids",
    groupLabel: "Government IDs",
    fields: [
      { fieldKey: "aadhaarNumber", label: "Aadhaar Number", defaultVisible: true, defaultMandatory: false, defaultReadOnly: false, sortOrder: 210 },
      { fieldKey: "samagraId", label: "Samagra ID", defaultVisible: true, defaultMandatory: false, defaultReadOnly: false, sortOrder: 220 },
      { fieldKey: "penNumber", label: "PEN Number", defaultVisible: true, defaultMandatory: false, defaultReadOnly: false, sortOrder: 230 },
    ],
  },
  {
    groupKey: "family_details",
    groupLabel: "Family Details",
    fields: [
      { fieldKey: "fatherName", label: "Father Name", defaultVisible: true, defaultMandatory: false, defaultReadOnly: false, sortOrder: 310 },
      { fieldKey: "motherName", label: "Mother Name", defaultVisible: true, defaultMandatory: false, defaultReadOnly: false, sortOrder: 320 },
      { fieldKey: "guardianName", label: "Guardian Name", defaultVisible: true, defaultMandatory: false, defaultReadOnly: false, sortOrder: 330 },
      { fieldKey: "parentMobile", label: "Parent Mobile", defaultVisible: true, defaultMandatory: false, defaultReadOnly: false, sortOrder: 340 },
    ],
  },
  {
    groupKey: "address",
    groupLabel: "Address",
    fields: [
      { fieldKey: "address", label: "Address", defaultVisible: true, defaultMandatory: false, defaultReadOnly: false, sortOrder: 410 },
      { fieldKey: "city", label: "City", defaultVisible: true, defaultMandatory: false, defaultReadOnly: false, sortOrder: 420 },
      { fieldKey: "state", label: "State", defaultVisible: true, defaultMandatory: false, defaultReadOnly: false, sortOrder: 430 },
      { fieldKey: "pin", label: "PIN", defaultVisible: true, defaultMandatory: false, defaultReadOnly: false, sortOrder: 440 },
    ],
  },
  {
    groupKey: "additional",
    groupLabel: "Additional Details",
    fields: [
      { fieldKey: "photoUrl", label: "Photo URL", defaultVisible: true, defaultMandatory: false, defaultReadOnly: false, sortOrder: 510 },
      { fieldKey: "category", label: "Category", defaultVisible: true, defaultMandatory: false, defaultReadOnly: false, sortOrder: 520 },
      { fieldKey: "religion", label: "Religion", defaultVisible: true, defaultMandatory: false, defaultReadOnly: false, sortOrder: 530 },
      { fieldKey: "bloodGroup", label: "Blood Group", defaultVisible: true, defaultMandatory: false, defaultReadOnly: false, sortOrder: 540 },
      { fieldKey: "status", label: "Status", defaultVisible: true, defaultMandatory: true, defaultReadOnly: false, sortOrder: 550 },
    ],
  },
]);

export const getFlatStudentFields = () => {
  return STUDENT_FIELD_DEFINITIONS.flatMap((group) =>
    group.fields.map((field) => ({
      groupKey: group.groupKey,
      groupLabel: group.groupLabel,
      ...field,
    }))
  );
};
