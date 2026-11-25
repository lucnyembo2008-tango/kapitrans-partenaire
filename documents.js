import { addDoc, collection, getDocs, onSnapshot, query, serverTimestamp, updateDoc, where } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";
import { db } from "./firebase.js";
import { getCompanyName, requirePartner } from "./partner-common.js";
import { mountSidebar } from "./sidebar.js";

const access = await requirePartner();

if (access) {
  const { user, partner } = access;
  const companyName = getCompanyName(partner);
  mountSidebar(partner);

  const tableBody = document.querySelector("#documents-body");
  const message = document.querySelector("#documents-message");
  const feedback = document.querySelector("#documents-feedback");
  const preview = document.querySelector("#document-preview");
  const previewTitle = document.querySelector("#preview-title");
  const previewType = document.querySelector("#preview-document-type");
  const previewPlate = document.querySelector("#preview-plate");
  const previewClose = document.querySelector("#preview-close");
  const vehicleStatusFields = ["statut_assurance", "statutAssurance", "assuranceStatut"];
  const documentsQuery = query(
    collection(db, "demandes_validation"),
    where("partenaire_nom", "==", companyName),
    where("statut", "==", "En attente"),
  );

  function showFeedback(text, isError) {
    feedback.textContent = text;
    feedback.classList.toggle("error", Boolean(isError));
    feedback.hidden = false;
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
    return Number.isNaN(date.getTime())
      ? "—"
      : new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(date);
  }

  function getDocumentType(documentData) {
    return documentData.typeDocument || documentData.type || "Document";
  }

  function getPlate(documentData) {
    return documentData.plaque || documentData.immatriculation || "";
  }

  function addCell(row, value, className) {
    const cell = document.createElement("td");
    cell.textContent = value || "—";
    if (className) cell.className = className;
    row.append(cell);
    return cell;
  }

  function showMessage(text, isError) {
    message.textContent = text;
    message.classList.toggle("error", Boolean(isError));
    message.hidden = false;
  }

  previewClose.addEventListener("click", () => preview.close());
  preview.addEventListener("click", (event) => {
    if (event.target === preview) preview.close();
  });

  onSnapshot(
    documentsQuery,
    (snapshot) => {
      tableBody.replaceChildren();

      if (snapshot.empty) {
        showMessage("Aucun document en attente.", false);
        return;
      }

      message.hidden = true;
      for (const documentSnapshot of snapshot.docs) {
        const documentData = documentSnapshot.data();
        const documentType = getDocumentType(documentData);
        const plate = getPlate(documentData);
        const row = document.createElement("tr");
        addCell(row, plate, "plate");
        addCell(row, documentType);
        addCell(row, formatDate(documentData.dateDemande || documentData.date || documentData.createdAt || documentData.dateCreation));

        const actionCell = document.createElement("td");
        actionCell.className = "document-actions";

        const viewButton = document.createElement("button");
        viewButton.className = "button button-view";
        viewButton.type = "button";
        viewButton.textContent = "Voir";
        viewButton.addEventListener("click", () => {
          previewTitle.textContent = documentType;
          previewType.textContent = documentType;
          previewPlate.textContent = plate || "Non renseignée";
          preview.showModal();
        });

        const validateButton = document.createElement("button");
        validateButton.className = "button button-validate";
        validateButton.type = "button";
        validateButton.textContent = "Valider";
        validateButton.addEventListener("click", async () => {
          validateButton.disabled = true;
          validateButton.textContent = "Validation…";

          try {
            await updateDoc(documentSnapshot.ref, { statut: "Validé" });
          } catch (error) {
            showFeedback(`La validation a échoué : ${error.message}`, true);
            validateButton.disabled = false;
            validateButton.textContent = "Valider";
            return;
          }

          const warnings = [];
          if (plate) {
            try {
              const vehiclesSnapshot = await getDocs(query(
                collection(db, "vehicules_dgi"),
                where("plaque", "==", plate),
              ));
              if (vehiclesSnapshot.empty) {
                warnings.push(`Aucun véhicule correspondant à la plaque ${plate} n’a été trouvé ; son statut d’assurance n’a pas été modifié.`);
              } else {
                await Promise.all(vehiclesSnapshot.docs.map((vehicleDocument) => {
                  const vehicleData = vehicleDocument.data();
                  const statusField = vehicleStatusFields.find((field) => field in vehicleData) || "statut_assurance";
                  return updateDoc(vehicleDocument.ref, { [statusField]: "Validé" });
                }));
              }
            } catch (error) {
              warnings.push(`Le document est validé, mais le statut du véhicule n’a pas pu être synchronisé : ${error.message}`);
            }
          } else {
            warnings.push("Le document est validé, mais aucune plaque n’est renseignée pour synchroniser le véhicule.");
          }

          try {
            await addDoc(collection(db, "audit"), {
              action: "validation_document",
              message: `${partner.nom_entreprise || user.email} a validé ${documentType} de ${plate || "véhicule sans plaque"}`,
              partenaireEmail: user.email,
              demandeId: documentSnapshot.id,
              plaque: plate || null,
              typeDocument: documentType,
              date: serverTimestamp(),
            });
          } catch (error) {
            warnings.push(`Le document est validé, mais l’écriture du journal d’audit a échoué : ${error.message}`);
          }

          showFeedback(
            ["Demande validée.", ...warnings].join(" "),
            warnings.length > 0,
          );
        });
        actionCell.append(viewButton, validateButton);
        row.append(actionCell);
        tableBody.append(row);
      }
    },
    (error) => {
      tableBody.replaceChildren();
      showMessage(`Impossible de charger les documents : ${error.message}`, true);
    },
  );
}
