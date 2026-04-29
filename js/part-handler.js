/* ============================================================
   part-handler.js – WEIR SOP Digital Form
   ============================================================ */
console.log("✅ part-handler.js loaded");

let PART_MASTER = {};

/* ============================================================
   INITIALIZATION
   ============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
    hidePartSections();
    await loadParts();
    populatePartDropdown();
    attachPartChangeHandler();
    attachThreadFitHandler();
    attachSubmissionHandler();
});

/* ============================================================
   LOAD PARTS FROM data.json
   ============================================================ */
async function loadParts() {
    const res = await fetch("data/data.json");
    PART_MASTER = await res.json();
}

/* ============================================================
   POPULATE PART DROPDOWN
   ============================================================ */
function populatePartDropdown() {
    const partSelect = document.getElementById("partSelect");

    partSelect.querySelectorAll("option:not(:first-child)")
        .forEach(o => o.remove());

    Object.keys(PART_MASTER).forEach(p => {
        const o = document.createElement("option");
        o.value = p;
        o.textContent = p;
        partSelect.appendChild(o);
    });
}

/* ============================================================
   PART CHANGE HANDLER
   ============================================================ */
function attachPartChangeHandler() {
    const partSelect = document.getElementById("partSelect");

    partSelect.addEventListener("change", () => {
        const part = PART_MASTER[partSelect.value];

        if (!part) {
            resetFormState();
            hidePartSections();
            return;
        }

        showPartSections();
        applyPart(part);
    });
}

/* ============================================================
   APPLY PART DATA
   ============================================================ */
function applyPart(part) {

    /* ---------- BASIC ---------- */
    document.querySelector('[name="part_description"]').value =
        part.description;

    document.getElementById("toleranceText").innerHTML =
        `<b>Tolerance:</b> ${part.tolerance.min} – ${part.tolerance.max} mm`;

    const totalCount = part.vanes * part.holesPerVane;

    /* ---------- HOLES ---------- */
    document.querySelectorAll(".hole-row").forEach(row => {
        const vane = Number(row.dataset.vane);
        const hole = Number(row.dataset.hole);

        if (vane <= part.vanes && hole <= part.holesPerVane) {
            row.style.display = "";

            const center = row.querySelector(".hole-center");
            center.innerHTML = '<option value=""></option>';

            part.holeCenterOptions.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c;
                opt.textContent = c;
                center.appendChild(opt);
            });
        } else {
            hideRow(row);
        }
    });

    /* ---------- RODS ---------- */
    document.querySelectorAll(".rod-row").forEach(row => {
        const idx = Number(row.dataset.index);
        idx <= totalCount ? row.style.display = "" : hideRow(row);
    });

    document.getElementById("rodSummary").innerHTML =
        `<b>Diameter:</b> ${part.rod.diameterMin} – ${part.rod.diameterMax}
         &nbsp;&nbsp;
         <b>Length:</b> ${part.rod.lengthMin} – ${part.rod.lengthMax}`;

    /* ---------- PLUGS ---------- */
    document.querySelectorAll(".plug-row").forEach(row => {
        const idx = Number(row.dataset.index);
        idx <= totalCount ? row.style.display = "" : hideRow(row);
    });
}

/* ============================================================
   THREAD FIT (YES / NO LOGIC)
   ============================================================ */
function attachThreadFitHandler() {
    const fitSelect = document.getElementById("threadFitSelect");
    const measurements = document.getElementById("threadMeasurements");

    if (!fitSelect || !measurements) return;

    fitSelect.addEventListener("change", () => {
        if (fitSelect.value === "No") {
            measurements.style.display = "";
        } else {
            measurements.style.display = "none";
            measurements.querySelectorAll("input")
                .forEach(i => i.value = "");
        }
    });
}

/* ============================================================
   FORM SUBMISSION (Power Automate)
   ============================================================ */
function attachSubmissionHandler() {
    const form = document.getElementById("sopForm");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const payload = {};

        formData.forEach((value, key) => {
            payload[key] = value || "";
        });

        payload.submitted_at = new Date().toISOString();

        try {
            const response = await fetch(
                "https://defaultb771cb47279a4b84aaeb14a9b7a714.46.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/a1659bffaef843d9bb1c1b9392e7d2ff/triggers/manual/paths/invoke?api-version=1",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                }
            );

            if (!response.ok) throw new Error("HTTP error");

            alert("✅ Record saved successfully");
            form.reset();
            resetFormState();
            hidePartSections();

        } catch (err) {
            console.error(err);
            alert("❌ Failed to submit form");
        }
    });
}

/* ============================================================
   HELPERS
   ============================================================ */
function hideRow(row) {
    row.style.display = "none";
    row.querySelectorAll("input, select")
        .forEach(el => el.value = "");
}

function resetFormState() {
    document.getElementById("toleranceText").innerHTML =
        "<b>Tolerance:</b> —";

    document.getElementById("rodSummary").innerHTML =
        "<b>Diameter:</b> — &nbsp;&nbsp; <b>Length:</b> —";

    document.querySelectorAll(".hole-row, .rod-row, .plug-row")
        .forEach(hideRow);

    const measurements = document.getElementById("threadMeasurements");
    if (measurements) {
        measurements.style.display = "none";
        measurements.querySelectorAll("input")
            .forEach(i => i.value = "");
    }
}

function showPartSections() {
    const section = document.getElementById("partDependentSections");
    if (section) section.style.display = "";
}

function hidePartSections() {
    const section = document.getElementById("partDependentSections");
    if (section) section.style.display = "none";
}