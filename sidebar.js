import { signOut } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
import { auth } from "./firebase.js";
import { getCompanyName } from "./partner-common.js";

export function mountSidebar(partner) {
  const sidebar = document.querySelector("#sidebar");
  const currentPage = window.location.pathname.split("/").pop();

  sidebar.innerHTML = `
    <a class="brand sidebar-brand" href="partner-dashboard.html">
      <img class="brand-mark" src="logokapitrans.png" alt="">
      <span>KapiTrans <span class="brand-light">/ Partenaire</span></span>
    </a>
    <div class="sidebar-company">
      <span class="company-label">VOTRE ENTREPRISE</span>
      <strong class="company-name"></strong>
    </div>
    <nav class="sidebar-nav" aria-label="Navigation principale">
      <a class="nav-link" href="partner-dashboard.html" data-page="partner-dashboard.html">
        <span class="nav-icon" aria-hidden="true">▦</span> Tableau de bord
      </a>
      <a class="nav-link" href="partner-documents.html" data-page="partner-documents.html">
        <span class="nav-icon" aria-hidden="true">▤</span> Documents à valider
      </a>
      <a class="nav-link" href="partner-profile.html" data-page="partner-profile.html">
        <span class="nav-icon" aria-hidden="true">♙</span> Profil
      </a>
      <button class="nav-link nav-logout" type="button" id="logout-button">
        <span class="nav-icon" aria-hidden="true">↪</span> Déconnexion
      </button>
    </nav>
    <div class="sidebar-bottom">PORTAIL PROFESSIONNEL</div>
  `;

  sidebar.querySelector(".company-name").textContent = getCompanyName(partner);
  const activeLink = sidebar.querySelector(`[data-page="${currentPage}"]`);
  if (activeLink) {
    activeLink.classList.add("active");
    activeLink.setAttribute("aria-current", "page");
  }

  sidebar.querySelector("#logout-button").addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.replace("partner-login.html");
    } catch (error) {
      window.alert(`La déconnexion a échoué : ${error.message}`);
    }
  });
}
