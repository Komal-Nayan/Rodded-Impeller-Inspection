/* ============================================================
   Part Handler – WEIR SOP Digital Form
   ============================================================ */
console.log("✅ part-handler.js loaded");
alert("JS LOADED");

let PART_MASTER = {};

document.addEventListener("DOMContentLoaded", async () => {
  await loadParts();
  populatePartDropdown();
  attachPartChangeHandler();
});

/* -------------------- LOAD PARTS JSON -------------------- */
async function loadParts() {
  const response = await fetch("https://github.com/Komal-Nayan/Rodded-Impeller-Inspection/blob/main/data/data.json");
  PART_MASTER = await response.json();
}

/* -------------------- POPULATE PART DROPDOWN -------------------- */
function populatePartDropdown() {
  const select = document.getElementById("partSelect");

  // Clear existing options except placeholder
  select.querySelectorAll("option:not(:first-child)")
    .forEach(opt => opt.remove());

  Object.keys(PART_MASTER).forEach(partNo => {
    const opt = document.createElement("option");
    opt.value = partNo;
    opt.textContent = partNo;
    select.appendChild(opt);
  });
}

/* -------------------- PART CHANGE HANDLER -------------------- */
function attachPartChangeHandler() {
  const partSelect = document.getElementById("partSelect");

  partSelect.addEventListener("change", () => {
    const part = PART_MASTER[partSelect.value];

    if (!part) {
      resetFormState();
      return;
    }

    applyPart(part);
  });
}

/* -------------------- APPLY PART DATA -------------------- */
function applyPart(part) {

  /* BASIC */
  document.querySelector('input[name="part_description"]').value =
    part.description;

  document.getElementById("toleranceText").innerHTML =
    `<b>Tolerance:</b> ${part.tolerance.min} – ${part.tolerance.max} mm`;

  /* HOLES */
  document.querySelectorAll(".hole-row").forEach(row => {
    const vane = Number(row.dataset.vane);
    const holeIdx = Number(row.dataset.hole);

    if (vane <= part.vanes && holeIdx <= part.holesPerVane) {
      row.style.display = "";

      const select = row.querySelector(".hole-center");
      select.innerHTML = '<option value="">--</option>';

      const centerValue = part.holeCenterOptions[holeIdx - 1];
      if (centerValue) {
        const opt = document.createElement("option");
        opt.value = centerValue;
        opt.textContent = centerValue;
        select.appendChild(opt);
      }
    } else {
      hideRow(row);
    }
  });

  /* ROD SUMMARY */
  const rodSummary = document.getElementById("rodSummary");
  if (rodSummary && part.rod) {
    rodSummary.innerHTML =
      `<b>Diameter:</b> ${part.rod.diameterMin} – ${part.rod.diameterMax} mm
       &nbsp;&nbsp;
       <b>Length:</b> ${part.rod.lengthMin} – ${part.rod.lengthMax} mm`;
  }

  /* RODS */
  document.querySelectorAll(".rod-row").forEach(row => {
    const idx = Number(row.dataset.index);

    if (idx <= part.rod.count) {
      row.style.display = "";

      const dia = row.querySelector('input[name$="_dia"]');
      const len = row.querySelector('input[name$="_len"]');

      dia.placeholder =
        `${part.rod.diameterMin} – ${part.rod.diameterMax}`;

      len.placeholder =
        `${part.rod.lengthMin} – ${part.rod.lengthMax}`;
    } else {
      hideRow(row);
    }
  });

  /* PLUGS */
  document.querySelectorAll(".plug-row").forEach(row => {
    Number(row.dataset.index) <= part.plug.count
      ? row.style.display = ""
      : hideRow(row);
  });
}

/* -------------------- RESET STATE -------------------- */
function resetFormState() {
  document.getElementById("toleranceText").innerHTML =
    "<b>Tolerance:</b> —";

  const rodSummary = document.getElementById("rodSummary");
  if (rodSummary) {
    rodSummary.innerHTML =
      "<b>Diameter:</b> — &nbsp;&nbsp; <b>Length:</b> —";
  }

  document.querySelectorAll(".hole-row, .rod-row, .plug-row")
    .forEach(hideRow);
}

/* -------------------- HELPERS -------------------- */
function hideRow(row) {
  row.style.display = "none";
  row.querySelectorAll("input, select")
    .forEach(el => el.value = "");
}