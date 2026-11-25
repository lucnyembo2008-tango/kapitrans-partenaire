import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";
import { auth, db } from "./firebase.js";

export async function findPartnerByUid(uid) {
  const partnerDocument = await getDoc(doc(db, "partenaires", uid));

  if (!partnerDocument.exists()) {
    return null;
  }

  return {
    id: partnerDocument.id,
    ...partnerDocument.data(),
  };
}

function getCurrentUser() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

export async function requirePartner() {
  const user = await getCurrentUser();

  if (!user || !user.uid || !user.email) {
    window.location.replace("partner-login.html");
    return null;
  }

  try {
    const partner = await findPartnerByUid(user.uid);

    if (!partner) {
      await signOut(auth);
      window.alert("Accès refusé : vous n'êtes pas un partenaire agréé");
      window.location.replace("partner-login.html");
      return null;
    }

    return { user, partner };
  } catch (error) {
    await signOut(auth);
    window.alert(`Impossible de vérifier votre accès partenaire : ${error.message}`);
    window.location.replace("partner-login.html");
    return null;
  }
}

export function getCompanyName(partner) {
  return partner.nom_entreprise || "Entreprise non renseignée";
}
