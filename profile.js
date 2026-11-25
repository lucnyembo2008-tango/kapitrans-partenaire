import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
import { getCompanyName, requirePartner } from "./partner-common.js";
import { mountSidebar } from "./sidebar.js";

const access = await requirePartner();

if (access) {
  const { user, partner } = access;
  mountSidebar(partner);

  document.querySelector("#profile-company").textContent = getCompanyName(partner);
  document.querySelector("#profile-email").textContent = user.email;

  const form = document.querySelector("#password-form");
  const submitButton = document.querySelector("#password-submit");
  const feedback = document.querySelector("#password-feedback");

  function showFeedback(text, isError) {
    feedback.textContent = text;
    feedback.classList.toggle("error", Boolean(isError));
    feedback.hidden = false;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    feedback.hidden = true;

    const currentPassword = form.elements.currentPassword.value;
    const newPassword = form.elements.newPassword.value;
    const confirmPassword = form.elements.confirmPassword.value;

    if (newPassword !== confirmPassword) {
      showFeedback("Les deux nouveaux mots de passe ne correspondent pas.", true);
      return;
    }

    if (newPassword === currentPassword) {
      showFeedback("Choisissez un mot de passe différent de l’actuel.", true);
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Mise à jour…";

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      form.reset();
      showFeedback("Votre mot de passe a été modifié dans Firebase Authentication.", false);
    } catch (error) {
      const messages = {
        "auth/invalid-credential": "Le mot de passe actuel est incorrect.",
        "auth/wrong-password": "Le mot de passe actuel est incorrect.",
        "auth/weak-password": "Le nouveau mot de passe est trop faible. Choisissez-en un plus robuste.",
        "auth/requires-recent-login": "Reconnectez-vous puis réessayez de modifier votre mot de passe.",
        "auth/network-request-failed": "Connexion à Firebase impossible. Vérifiez votre connexion Internet.",
        "auth/too-many-requests": "Trop de tentatives. Réessayez plus tard.",
      };
      showFeedback(messages[error.code] || `Impossible de modifier le mot de passe : ${error.message}`, true);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Mettre à jour le mot de passe";
    }
  });
}
