import { collection, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";
import { db } from "./firebase.js";
import { getCompanyName, requirePartner } from "./partner-common.js";
import { mountSidebar } from "./sidebar.js";

const access = await requirePartner();

if (access) {
  const { partner } = access;
  const companyName = getCompanyName(partner);
  document.querySelector("#company-welcome").textContent = companyName;
  document.querySelector("#account-company").textContent = companyName;
  document.querySelector("#account-avatar").textContent = companyName.trim().charAt(0).toUpperCase() || "P";
  mountSidebar(partner);

  const errorMessage = document.querySelector("#dashboard-error");
  const recentBody = document.querySelector("#recent-documents-body");
  const recentMessage = document.querySelector("#recent-documents-message");
  const documentsQuery = query(
    collection(db, "demandes_validation"),
    where("partenaire_nom", "==", companyName),
  );

  function getRequestDate(data) {
    const value = data.dateDemande || data.date || data.createdAt || data.dateCreation;
    if (!value) return null;
    const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatDate(date) {
    return date
      ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(date)
      : "—";
  }

  function addCell(row, value, className) {
    const cell = document.createElement("td");
    cell.textContent = value || "—";
    if (className) cell.className = className;
    row.append(cell);
    return cell;
  }

  function renderRecentRequests(requests) {
    recentBody.replaceChildren();
    if (requests.length === 0) {
      recentMessage.textContent = "Aucune demande reçue pour le moment.";
      recentMessage.hidden = false;
      return;
    }

    recentMessage.hidden = true;
    for (const { data, date } of requests.slice(0, 5)) {
      const row = document.createElement("tr");
      const type = data.typeDocument || data.type || "Document";
      const plate = data.plaque || data.immatriculation || "—";
      addCell(row, type);
      addCell(row, plate, "plate");
      addCell(row, formatDate(date));
      const statusCell = addCell(row, "");
      const status = document.createElement("span");
      status.className = `status-pill${data.statut === "Validé" ? " validated" : ""}`;
      status.textContent = data.statut || "Non renseigné";
      statusCell.append(status);
      recentBody.append(row);
    }
  }

  function setStat(id, value) {
    const element = document.querySelector(`#${id}`);
    element.textContent = String(value);
    element.classList.remove("loading");
  }

  onSnapshot(
    documentsQuery,
    (snapshot) => {
      const requests = snapshot.docs.map((documentSnapshot) => {
        const data = documentSnapshot.data();
        return { data, date: getRequestDate(data) };
      }).sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
      const pending = requests.filter(({ data }) => data.statut === "En attente").length;
      const validated = requests.filter(({ data }) => data.statut === "Validé").length;
      const other = requests.length - pending - validated;
      const total = requests.length;
      const rate = total === 0 ? 0 : Math.round((validated / total) * 100);

      setStat("total-count", total);
      setStat("pending-count", pending);
      setStat("validated-count", validated);
      setStat("validation-rate", `${rate} %`);
      document.querySelector("#chart-pending-count").textContent = String(pending);
      document.querySelector("#chart-validated-count").textContent = String(validated);
      document.querySelector("#chart-other-count").textContent = String(other);
      document.querySelector("#chart-total-count").textContent = String(total);

      for (const [id, count] of [
        ["chart-pending-bar", pending],
        ["chart-validated-bar", validated],
        ["chart-other-bar", other],
      ]) {
        document.querySelector(`#${id}`).style.width = `${total ? (count / total) * 100 : 0}%`;
      }

      renderRecentRequests(requests);
      errorMessage.hidden = true;
    },
    (error) => {
      errorMessage.textContent = `Impossible de charger les demandes : ${error.message}`;
      errorMessage.hidden = false;
      recentBody.replaceChildren();
      recentMessage.textContent = "Les demandes n’ont pas pu être chargées.";
      recentMessage.classList.add("error");
      recentMessage.hidden = false;
      for (const id of ["total-count", "pending-count", "validated-count", "validation-rate"]) {
        setStat(id, "—");
      }
    },
  );
}
