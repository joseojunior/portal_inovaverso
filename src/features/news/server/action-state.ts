export type NewsActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialNewsActionState: NewsActionState = {
  status: "idle",
  message: ""
};
