export const STUDENT_STATUS = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
  TC_ISSUED: "tc_issued",
  DROPOUT: "dropout",
  PASSED_OUT: "passed_out",
});

export const STUDENT_STATUS_OPTIONS = Object.freeze([
  { value: STUDENT_STATUS.ACTIVE, label: "Active" },
  { value: STUDENT_STATUS.INACTIVE, label: "Inactive" },
  { value: STUDENT_STATUS.TC_ISSUED, label: "TC Issued" },
  { value: STUDENT_STATUS.DROPOUT, label: "Dropout" },
  { value: STUDENT_STATUS.PASSED_OUT, label: "Passed Out" },
]);

export const GENDER_OPTIONS = Object.freeze([
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
]);
