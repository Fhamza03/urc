import { useState } from "react";
import { loginUser } from "./loginApi";
import { Session } from "../model/common";
import { CustomError } from "../model/CustomError";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Fade,
  Link
} from "@mui/material";

export function Login() {
  const [error, setError] = useState({} as CustomError);
  const [session, setSession] = useState({} as Session);
  const [loaded, setLoaded] = useState(true);

  const router = useNavigate();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    loginUser(
      {
        user_id: -1,
        username: data.get("login") as string,
        password: data.get("password") as string,
      },
      (result: Session) => {
        setSession(result);
        router("/chat");
        form.reset();
        setError({ name: "", message: "" });
      },
      (loginError: CustomError) => {
        setError(loginError);
        setSession({} as Session);
      }
    );
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #CAF0F8, #ADE8F4, #90E0EF)',
      }}
    >
      <Fade in={loaded} timeout={800}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            p: 6,
            bgcolor: 'white',
            borderRadius: 4,
            boxShadow: 10,
            width: '100%',
            maxWidth: 450,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Typography
            variant="h4"
            textAlign="center"
            fontWeight="bold"
            sx={{ color: '#0077B6', mb: 2 }}
          >
            Connexion
          </Typography>

          <TextField
            fullWidth
            label="Nom d'utilisateur"
            name="login"
            variant="outlined"
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': { borderColor: '#48CAE4', borderWidth: 2 },
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
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': { borderColor: '#48CAE4', borderWidth: 2 },
              },
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              py: 1.5,
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #00B4D8 30%, #0096C7 90%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(45deg, #0096C7 30%, #0077B6 90%)',
                transform: 'scale(1.03)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Connexion
          </Button>

          {error.message && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error.message}
            </Alert>
          )}

          {session.token && (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              Connecté en tant que {session.username}
            </Alert>
          )}

          {/* Lien vers la page d'inscription */}
          <Typography textAlign="center" sx={{ mt: 1 }}>
            <Link
              component="button"
              variant="body2"
              onClick={() => router("/register")}
              sx={{ color: "#0077B6", fontWeight: "bold" }}
            >
              Pas encore de compte ? Inscrivez-vous
            </Link>
          </Typography>
        </Box>
      </Fade>
    </Box>
  );
}
