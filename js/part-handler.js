console.log("✅ part-handler.js loaded");

const SOP_DRAFT_KEY = "weir_sop_draft";
let isRestoringDraft = false;

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
    attachDimensionModeHandler(); 

    restoreDraftIfExists();
    enableDraftAutoSave();
});

/* ============================================================
   LOAD PARTS
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
        } else {
            showPartSections();
            applyPart(part);
        }

        updateConditionalVisibility(); // ✅ KEY
    });
}

/* ============================================================
   DIMENSION MODE HANDLER
   ============================================================ */
function attachDimensionModeHandler() {
    const select = document.getElementById("dimensionModeSelect");
    if (!select) return;

    select.addEventListener("change", () => {
        updateConditionalVisibility();
    });
}

/* ============================================================
   CONDITIONAL VISIBILITY (CORE LOGIC)
   ============================================================ */
function updateConditionalVisibility() {
    const partSelect = document.getElementById("partSelect");
    const modeSelect = document.getElementById("dimensionModeSelect");

    const checklist = document.getElementById("checklistSection");
    const postSections = document.getElementById("postChecklistSections");

    if (!partSelect || !modeSelect || !checklist || !postSections) return;

    const hasPart = !!partSelect.value;
    const hasMode = !!modeSelect.value;

    if (hasPart && hasMode) {

        if (modeSelect.value === "As Found") {
            checklist.style.display = "none";
            postSections.style.display = "";
        } else {
            checklist.style.display = "";
            postSections.style.display = "";
        }

    } else {
        checklist.style.display = "none";
        postSections.style.display = "none";
    }
}

/* ============================================================
   APPLY PART DATA
   ============================================================ */
function applyPart(part) {
    document.querySelector('[name="part_description"]').value =
        part.description;

    document.getElementById("toleranceText").innerHTML =
        `<b>Tolerance:</b> ${part.tolerance.min} – ${part.tolerance.max} mm`;

    const totalCount = part.vanes * part.holesPerVane;

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

    document.querySelectorAll(".rod-row").forEach(row => {
        const idx = Number(row.dataset.index);
        idx <= totalCount ? row.style.display = "" : hideRow(row);
    });
}

/* ============================================================
   THREAD FIT
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
   DRAFT SAVE
   ============================================================ */
function enableDraftAutoSave() {
    const form = document.getElementById("sopForm");
    if (!form) return;

    form.addEventListener("input", () => {
        if (isRestoringDraft) return;

        const data = {};
        new FormData(form).forEach((v, k) => data[k] = v);
        localStorage.setItem(SOP_DRAFT_KEY, JSON.stringify(data));
    });
}

/* ============================================================
   RESTORE DRAFT
   ============================================================ */
function restoreDraftIfExists() {
    const saved = localStorage.getItem(SOP_DRAFT_KEY);
    if (!saved) return;

    if (!confirm("An unfinished SOP draft was found. Restore it?")) return;

    isRestoringDraft = true;

    const data = JSON.parse(saved);

    Object.entries(data).forEach(([key, value]) => {
        if (!value) return;
        const field = document.querySelector(`[name="${key}"]`);
        if (field) field.value = value;
    });

    if (data.part_no) {
        const partSelect = document.getElementById("partSelect");
        if (partSelect) {
            partSelect.value = data.part_no;
            partSelect.dispatchEvent(new Event("change"));
        }
    }

    updateConditionalVisibility(); // ✅ IMPORTANT

    setTimeout(() => {
        isRestoringDraft = false;
    }, 0);
}

/* ============================================================
   SUBMIT
   ============================================================ */
function attachSubmissionHandler() {
    const form = document.getElementById("sopForm");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const payload = {};
        new FormData(form).forEach((v, k) => payload[k] = v || "");
        payload.submitted_at = new Date().toISOString();

        try {
            const response = await fetch("https://defaultb771cb47279a4b84aaeb14a9b7a714.46.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/a1659bffaef843d9bb1c1b9392e7d2ff/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=R3C053ID3Sma0M3FoRtv-5Xj-LmrHhvm6Y_zv-6BRTM", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error();

            alert("✅ Record saved successfully");

            localStorage.removeItem(SOP_DRAFT_KEY);
            form.reset();
            resetFormState();
            hidePartSections();
            updateConditionalVisibility();

        } catch {
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

    document.querySelectorAll(".hole-row, .rod-row, .plug-row")
        .forEach(hideRow);
}

function showPartSections() {
    document.getElementById("partDependentSections").style.display = "";
}

function hidePartSections() {
    document.getElementById("partDependentSections").style.display = "none";
}