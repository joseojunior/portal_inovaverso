export type AuthorActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialAuthorActionState: AuthorActionState = {
  status: "idle",
  message: ""
};
