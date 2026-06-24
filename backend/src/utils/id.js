import { nanoid } from "nanoid";

export const createId = (prefix = "id") => {
  return `${prefix}_${nanoid(20)}`;
};