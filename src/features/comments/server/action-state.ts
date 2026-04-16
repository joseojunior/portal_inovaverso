export type CommentActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialCommentActionState: CommentActionState = {
  status: "idle",
  message: ""
};
