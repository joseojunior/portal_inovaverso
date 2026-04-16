export type MediaActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialMediaActionState: MediaActionState = {
  status: "idle",
  message: ""
};
