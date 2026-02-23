export interface Error {
  id: string;
  message: string;
  severity: "error" | "warning" | "info" | "success";
}
