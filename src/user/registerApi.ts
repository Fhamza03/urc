import { CustomError } from "../model/CustomError";

export interface RegisterData {
  login: string;
  email: string;
  password: string;
}

type SuccessCallback = () => void;
type ErrorCallback = (err: CustomError) => void;

export function registerApi(
  data: RegisterData,
  onSuccess: SuccessCallback,
  onError: ErrorCallback
) {
  fetch("/api/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: data.login,
      email: data.email,
      password: data.password,
    }),
  })
    .then(async (response) => {
      if (response.ok) {
        const result = await response.json();
        console.log("Register success:", result);
        onSuccess();
      } else {
        const error = await response.json();
        console.log("Register error:", error);
        onError({ name: "ApiError", message: error.message || "Erreur lors de l'inscription" });
      }
    })
    .catch((err) => {
      console.error(err);
      onError({ name: "NetworkError", message: "Erreur réseau ou serveur" });
    });
}
