// src/user/Register.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, TextField, Typography, Alert, Fade, Link } from "@mui/material";
import { registerApi, RegisterData } from "./registerApi";
import { CustomError } from "../model/CustomError";

export function Register() {
  const [error, setError] = useState({} as CustomError);
  const [success, setSuccess] = useState(false);
  const [loaded, setLoaded] = useState(true);

  const router = useNavigate();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const registerData: RegisterData = {
      login: data.get("login") as string,
      email: data.get("email") as string,
      password: data.get("password") as string,
    };

    registerApi(
      registerData,
      () => {
        setSuccess(true);
        setError({ name: "", message: "" });
        form.reset();
        setTimeout(() => router("/login"), 1500);
      },
      (err: CustomError) => {
        setError(err);
        setSuccess(false);
      }
    );
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #CAF0F8, #ADE8F4, #90E0EF)",
      }}
    >
      <Fade in={loaded} timeout={800}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            p: 6,
            bgcolor: "white",
            borderRadius: 4,
            boxShadow: 10,
            width: "100%",
            maxWidth: 450,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Typography
            variant="h4"
            textAlign="center"
            fontWeight="bold"
            sx={{ color: "#0077B6", mb: 2 }}
          >
            Inscription
          </Typography>

          <TextField
            fullWidth
            label="Nom d'utilisateur"
            name="login"
            variant="outlined"
            required
            sx={{
              "& .MuiOutlinedInput-root": {
                "&.Mui-focused fieldset": { borderColor: "#48CAE4", borderWidth: 2 },
              },
            }}
          />

          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            variant="outlined"
            required
            sx={{
              "& .MuiOutlinedInput-root": {
                "&.Mui-focused fieldset": { borderColor: "#48CAE4", borderWidth: 2 },
              },
            }}
          />

          <TextField
            fullWidth
            label="Mot de passe"
            name="password"
            type="password"
            variant="outlined"
            required
            sx={{
              "& .MuiOutlinedInput-root": {
                "&.Mui-focused fieldset": { borderColor: "#48CAE4", borderWidth: 2 },
              },
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              py: 1.5,
              fontWeight: "bold",
              background: "linear-gradient(45deg, #00B4D8 30%, #0096C7 90%)",
              color: "white",
              "&:hover": {
                background: "linear-gradient(45deg, #0096C7 30%, #0077B6 90%)",
                transform: "scale(1.03)",
              },
              transition: "all 0.3s ease",
            }}
          >
            S'inscrire
          </Button>

          {error.message && <Alert severity="error">{error.message}</Alert>}
          {success && <Alert severity="success">Inscription réussie ! Redirection…</Alert>}

          {/* Lien vers la page de connexion */}
          <Typography textAlign="center" sx={{ mt: 1 }}>
            <Link
              component="button"
              variant="body2"
              onClick={() => router("/")}
              sx={{ color: "#0077B6", fontWeight: "bold" }}
            >
              Déjà un compte ? Connectez-vous
            </Link>
          </Typography>
        </Box>
      </Fade>
    </Box>
  );
}
