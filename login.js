import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
import { auth, isFirebaseConfigured } from "./firebase.js";
import { findPartnerByUid } from "./partner-common.js";

const form = document.querySelector("#login-form");
const submitButton = document.querySelector("#login-submit");
const errorMessage = document.querySelector("#login-error");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorMessage.hidden = true;
  submitButton.disabled = true;
  submitButton.textContent = "Connexion…";

  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;

  try {
    if (!isFirebaseConfigured) {
      errorMessage.textContent = "La connexion Firebase n’est pas configurée. Renseignez les paramètres de votre projet dans firebase.js.";
      errorMessage.hidden = false;
      return;
    }

    const credential = await signInWithEmailAndPassword(auth, email, password);
    let partner;

    try {
      partner = await findPartnerByUid(credential.user.uid);
    } catch (error) {
      await signOut(auth);
      errorMessage.textContent = `Impossible de vérifier votre accès partenaire : ${error.message}`;
      errorMessage.hidden = false;
      return;
    }

    if (!partner) {
      await signOut(auth);
      window.alert("Accès refusé : vous n'êtes pas un partenaire agréé");
      return;
    }

    window.location.replace("partner-dashboard.html");
  } catch (error) {
    if (auth.currentUser) {
      await signOut(auth);
    }
    const messages = {
      "auth/invalid-api-key": "La clé API Firebase est invalide. Vérifiez la configuration dans firebase.js.",
      "auth/operation-not-allowed": "La connexion par e-mail et mot de passe n’est pas activée dans Firebase Authentication.",
      "auth/unauthorized-domain": "Ce domaine n’est pas autorisé dans les paramètres Firebase Authentication.",
      "auth/network-request-failed": "Connexion au service Firebase impossible. Vérifiez votre connexion Internet.",
      "auth/invalid-credential": "Adresse e-mail ou mot de passe incorrect.",
      "auth/invalid-email": "L’adresse e-mail n’est pas valide.",
      "auth/too-many-requests": "Trop de tentatives. Réessayez plus tard.",
    };
    errorMessage.textContent = messages[error.code] || `Connexion impossible : ${error.message}`;
    errorMessage.hidden = false;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Se connecter";
  }
});
