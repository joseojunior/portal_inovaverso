export type TagActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialTagActionState: TagActionState = {
  status: "idle",
  message: ""
};
