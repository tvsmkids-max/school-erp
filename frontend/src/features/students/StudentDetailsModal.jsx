import Badge from "../../components/common/Badge.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";

const statusVariant = {
  active: "green",
  inactive: "red",
  tc_issued: "yellow",
  dropout: "red",
  passed_out: "blue",
};

const statusLabel = {
  active: "Active",
  inactive: "Inactive",
  tc_issued: "TC Issued",
  dropout: "Dropout",
  passed_out: "Passed Out",
};

export default function StudentDetailsModal({ open, onClose, student }) {
  if (!student) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Student Details - ${student.studentName}`}
      maxWidth="max-w-5xl"
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950 dark:text-white">
                {student.studentName}
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Scholar No: {student.scholarNumber}
              </p>
            </div>

            <Badge variant={statusVariant[student.status] || "slate"}>
              {statusLabel[student.status] || student.status}
            </Badge>
          </div>
        </section>

        <DetailSection
          title="Basic Details"
          rows={[
            ["Scholar Number", student.scholarNumber],
            ["Student Name", student.studentName],
            ["Gender", student.gender],
            ["Date of Birth", student.dob],
            ["Mobile Number", student.mobileNumber],
          ]}
        />

        <DetailSection
          title="Academic Details"
          rows={[
            ["Academic Session", student.academicSessionName],
            ["Class", student.className],
            ["Section", student.sectionName || "Not Assigned"],
            ["Roll Number", student.rollNumber],
            ["Admission Date", student.admissionDate],
          ]}
        />

        <DetailSection
          title="Government IDs"
          rows={[
            ["Aadhaar Number", student.aadhaarNumber],
            ["Samagra ID", student.samagraId],
            ["PEN Number", student.penNumber],
          ]}
        />

        <DetailSection
          title="Family Details"
          rows={[
            ["Father Name", student.fatherName],
            ["Mother Name", student.motherName],
            ["Guardian Name", student.guardianName],
            ["Parent Mobile", student.parentMobile],
          ]}
        />

        <DetailSection
          title="Address"
          rows={[
            ["Address", student.address],
            ["City", student.city],
            ["State", student.state],
            ["PIN", student.pin],
          ]}
        />

        <DetailSection
          title="Additional"
          rows={[
            ["Category", student.category],
            ["Religion", student.religion],
            ["Blood Group", student.bloodGroup],
            ["Photo URL", student.photoUrl],
          ]}
        />

        <div className="flex justify-end">
          <Button
            type="button"
            className="bg-slate-600 hover:bg-slate-700"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function DetailSection({ title, rows }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-4 text-lg font-black text-slate-950 dark:text-white">
        {title}
      </h3>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950"
          >
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">
              {label}
            </p>
            <p className="mt-1 break-words text-sm font-bold text-slate-800 dark:text-slate-100">
              {value || "-"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
