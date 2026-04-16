export type AIConfigActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialAIConfigActionState: AIConfigActionState = {
  status: "idle",
  message: ""
};

export type AIDraftReviewActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialAIDraftReviewActionState: AIDraftReviewActionState = {
  status: "idle",
  message: ""
};
