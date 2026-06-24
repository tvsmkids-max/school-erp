export const ATTENDANCE_STATUS = Object.freeze({
  PRESENT: "present",
  ABSENT: "absent",
  LEAVE: "leave",
});

export const ATTENDANCE_STATUS_OPTIONS = Object.freeze([
  { value: ATTENDANCE_STATUS.PRESENT, label: "Present" },
  { value: ATTENDANCE_STATUS.ABSENT, label: "Absent" },
  { value: ATTENDANCE_STATUS.LEAVE, label: "Leave" },
]);
