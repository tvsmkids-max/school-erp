import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listAcademicSessionsApi } from "../../api/academicSessions.api.js";
import { listClassesApi } from "../../api/classes.api.js";
import { listSectionsApi } from "../../api/sections.api.js";
import { getStudentFieldConfigApi } from "../../api/studentFieldConfig.api.js";
import { createStudentApi, updateStudentApi } from "../../api/students.api.js";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";
import Modal from "../../components/common/Modal.jsx";
import Select from "../../components/common/Select.jsx";

const emptyForm = {
  scholarNumber: "",
  studentName: "",
  gender: "male",
  dob: "",
  mobileNumber: "",
  classId: "",
  sectionId: "",
  rollNumber: "",
  admissionDate: new Date().toISOString().slice(0, 10),
  academicSessionId: "",
  aadhaarNumber: "",
  samagraId: "",
  penNumber: "",
  fatherName: "",
  motherName: "",
  guardianName: "",
  parentMobile: "",
  address: "",
  city: "",
  state: "Madhya Pradesh",
  pin: "",
  photoUrl: "",
  category: "",
  religion: "",
  bloodGroup: "",
  status: "active",
};

export default function StudentFormModal({ open, onClose, student = null }) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(student?._id);
  const [form, setForm] = useState(emptyForm);

  const fieldConfigQuery = useQuery({
    queryKey: ["student-field-config"],
    queryFn: getStudentFieldConfigApi,
    enabled: open,
  });

  const sessionsQuery = useQuery({
    queryKey: ["academic-sessions", "student-form"],
    queryFn: () => listAcademicSessionsApi({ limit: 100, status: "all" }),
    enabled: open,
  });

  const classesQuery = useQuery({
    queryKey: ["classes", "student-form"],
    queryFn: () => listClassesApi({ limit: 100, status: "all" }),
    enabled: open,
  });

  const sectionsQuery = useQuery({
    queryKey: ["sections", "student-form", form.classId],
    queryFn: () =>
      listSectionsApi({
        limit: 100,
        status: "all",
        classId: form.classId,
      }),
    enabled: open && Boolean(form.classId),
  });

  const fieldGroups = fieldConfigQuery.data?.data || [];
  const sessions = sessionsQuery.data?.data || [];
  const classes = classesQuery.data?.data || [];
  const sections = form.classId ? sectionsQuery.data?.data || [] : [];

  const currentSession = useMemo(() => {
    return sessions.find((session) => session.isCurrent) || sessions[0] || null;
  }, [sessions]);

  useEffect(() => {
    if (!open) return;

    if (student) {
      setForm({
        ...emptyForm,
        ...student,
        dob: student.dob || "",
        mobileNumber: student.mobileNumber || "",
        rollNumber: student.rollNumber || "",
        aadhaarNumber: student.aadhaarNumber || "",
        samagraId: student.samagraId || "",
        penNumber: student.penNumber || "",
        fatherName: student.fatherName || "",
        motherName: student.motherName || "",
        guardianName: student.guardianName || "",
        parentMobile: student.parentMobile || "",
        address: student.address || "",
        city: student.city || "",
        state: student.state || "Madhya Pradesh",
        pin: student.pin || "",
        photoUrl: student.photoUrl || "",
        category: student.category || "",
        religion: student.religion || "",
        bloodGroup: student.bloodGroup || "",
        status: student.status || "active",
      });
    } else {
      setForm({
        ...emptyForm,
        academicSessionId: currentSession?._id || "",
      });
    }
  }, [open, student, currentSession?._id]);

  const saveMutation = useMutation({
    mutationFn: (payload) => {
      if (isEdit) {
        return updateStudentApi({ id: student._id, payload });
      }

      return createStudentApi(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      onClose();
    },
  });

  const setValue = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
      sectionId: key === "classId" ? "" : current.sectionId,
    }));
  };

  const submit = (event) => {
    event.preventDefault();

    saveMutation.mutate({
      ...form,
      scholarNumber: form.scholarNumber.trim(),
      studentName: form.studentName.trim(),
      rollNumber: form.rollNumber.trim(),
      fatherName: form.fatherName.trim(),
      motherName: form.motherName.trim(),
      guardianName: form.guardianName.trim(),
      category: form.category.trim(),
      religion: form.religion.trim(),
      bloodGroup: form.bloodGroup.trim(),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Student" : "Add Student"}
      maxWidth="max-w-6xl"
    >
      <form onSubmit={submit} className="space-y-6">
        {fieldGroups.map((group) => (
          <section
            key={group.groupKey}
            className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
          >
            <h3 className="mb-4 text-base font-black text-slate-950 dark:text-white">
              {group.groupLabel}
            </h3>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {group.fields.map((field) => (
                <StudentField
                  key={field.fieldKey}
                  field={field}
                  value={form[field.fieldKey] ?? ""}
                  form={form}
                  setValue={setValue}
                  sessions={sessions}
                  classes={classes}
                  sections={sections}
                  sectionsLoading={sectionsQuery.isLoading}
                />
              ))}
            </div>
          </section>
        ))}

        {fieldGroups.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 p-6 text-center text-sm font-bold text-slate-500 dark:border-slate-800">
            Loading student fields...
          </div>
        ) : null}

        {saveMutation.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {saveMutation.error.message}

            {saveMutation.error.errors?.length ? (
              <ul className="mt-2 list-inside list-disc">
                {saveMutation.error.errors.map((error) => (
                  <li key={`${error.field}-${error.message}`}>
                    {error.field}: {error.message}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            className="bg-slate-600 hover:bg-slate-700"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={saveMutation.isPending || fieldConfigQuery.isLoading}
          >
            {saveMutation.isPending ? "Saving..." : "Save Student"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function StudentField({
  field,
  value,
  form,
  setValue,
  sessions,
  classes,
  sections,
  sectionsLoading,
}) {
  if (!field.isVisible) return null;

  const valueText = value ?? "";

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-200">
        {field.label}
        {field.isMandatory && field.fieldKey !== "sectionId" ? (
          <span className="ml-1 text-red-600">*</span>
        ) : null}
      </span>

      {field.fieldKey === "gender" ? (
        <Select
          value={valueText}
          required={field.isMandatory}
          disabled={field.isReadOnly}
          onChange={(event) => setValue(field.fieldKey, event.target.value)}
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </Select>
      ) : field.fieldKey === "classId" ? (
        <Select
          value={valueText}
          required={field.isMandatory}
          disabled={field.isReadOnly}
          onChange={(event) => setValue("classId", event.target.value)}
        >
          <option value="">Select Class</option>
          {classes.map((item) => (
            <option key={item._id} value={item._id}>
              {item.displayName}
            </option>
          ))}
        </Select>
      ) : field.fieldKey === "sectionId" ? (
        <Select
          value={valueText}
          required={false}
          disabled={field.isReadOnly || !form.classId || sectionsLoading}
          onChange={(event) => setValue("sectionId", event.target.value)}
        >
          <option value="">
            {!form.classId
              ? "Select class first"
              : sectionsLoading
                ? "Loading sections..."
                : sections.length === 0
                  ? "No sections found"
                  : "Select Section"}
          </option>

          {sections.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name}
            </option>
          ))}
        </Select>
      ) : field.fieldKey === "academicSessionId" ? (
        <Select
          value={valueText}
          required={field.isMandatory}
          disabled={field.isReadOnly}
          onChange={(event) => setValue(field.fieldKey, event.target.value)}
        >
          <option value="">Select Session</option>
          {sessions.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name}
              {item.isCurrent ? " (Current)" : ""}
            </option>
          ))}
        </Select>
      ) : field.fieldKey === "status" ? (
        <Select
          value={valueText}
          required={field.isMandatory}
          disabled={field.isReadOnly}
          onChange={(event) => setValue(field.fieldKey, event.target.value)}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="tc_issued">TC Issued</option>
          <option value="dropout">Dropout</option>
          <option value="passed_out">Passed Out</option>
        </Select>
      ) : ["dob", "admissionDate"].includes(field.fieldKey) ? (
        <Input
          type="date"
          value={valueText}
          required={field.isMandatory}
          disabled={field.isReadOnly}
          onChange={(event) => setValue(field.fieldKey, event.target.value)}
        />
      ) : field.fieldKey === "address" ? (
        <textarea
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
          rows="3"
          value={valueText}
          required={field.isMandatory}
          disabled={field.isReadOnly}
          onChange={(event) => setValue(field.fieldKey, event.target.value)}
        />
      ) : (
        <Input
          value={valueText}
          required={field.isMandatory}
          disabled={field.isReadOnly}
          onChange={(event) => setValue(field.fieldKey, event.target.value)}
        />
      )}
    </label>
  );
}
