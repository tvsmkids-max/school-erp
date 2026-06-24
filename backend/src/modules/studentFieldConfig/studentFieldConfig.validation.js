import { z } from "zod";
import { getFlatStudentFields } from "../../constants/studentFields.js";

const allowedFieldKeys = getFlatStudentFields().map((field) => field.fieldKey);

export const updateStudentFieldConfigValidation = z.object({
  body: z.object({
    fields: z
      .array(
        z.object({
          fieldKey: z.enum(allowedFieldKeys),
          label: z.string().trim().min(1).max(80).optional(),
          isVisible: z.boolean().optional(),
          isMandatory: z.boolean().optional(),
          isReadOnly: z.boolean().optional(),
          sortOrder: z.coerce.number().int().min(1).optional(),
        })
      )
      .min(1, "At least one field config is required"),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});
