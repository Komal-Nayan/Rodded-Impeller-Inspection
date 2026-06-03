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
    // Set part description
    const descField = document.querySelector('[name="part_description"]');
    if (descField) descField.value = part.description || "";

    // Set tolerance header
    const toleranceText = document.getElementById("toleranceText");
    if (toleranceText) {
        toleranceText.innerHTML = `
            <b>Tolerance (Top, Middle and Bottom):</b> ${part.tolerance.min} – ${part.tolerance.max} mm&nbsp;&nbsp;
            <b>Hole Center Tolerance:</b> Refer individual holes
        `;
    }

    // Total hole count
    const totalCount = part.vanes * part.holesPerVane;

    // ============================================================
    // HOLE TABLE HANDLING
    // ============================================================
    document.querySelectorAll(".hole-row").forEach(row => {
        const vane = Number(row.dataset.vane);
        const hole = Number(row.dataset.hole);

        const centerInput = row.querySelector(".hole-center");

        if (vane <= part.vanes && hole <= part.holesPerVane) {
            row.style.display = "";

            // Get correct holeCenter config dynamically
            const centerConfig = part[`holeCenter${hole}`];

            if (centerConfig && centerInput) {
                const min = centerConfig.tolerance.min;
                const max = centerConfig.tolerance.max;

                // Set placeholder
                centerInput.placeholder = `${min} - ${max}`;

            }

        } else {
            hideRow(row);
        }
    });

    // ============================================================
    // ROD TABLE HANDLING
    // ============================================================
    document.querySelectorAll(".rod-row").forEach(row => {
        const idx = Number(row.dataset.index);

        if (idx <= totalCount) {
            row.style.display = "";
        } else {
            hideRow(row);
        }
    });

    // Rod Summary
    const rodSummary = document.getElementById("rodSummary");

    if (rodSummary && part.rod) {
        rodSummary.innerHTML = `
            <b>Diameter:</b> ${part.rod.diameterMin} – ${part.rod.diameterMax} mm&nbsp;&nbsp;
            <b>Length:</b> ${part.rod.lengthMin} – ${part.rod.lengthMax} mm
        `;
    }

    // ============================================================
    // PLUG TABLE HANDLING (based on count)
    // ============================================================
    if (part.plug?.count) {
        document.querySelectorAll(".plug-row").forEach(row => {
            const idx = Number(row.dataset.index);

            if (idx <= part.plug.count) {
                row.style.display = "";
            } else {
                hideRow(row);
            }
        });
    }

    //Set Nominal Plug and Plug Thread Lengths
    const plugLength = document.getElementById("plugLength");
    const plugThreadLength = document.getElementById("plugThreadLength");

    plugThreadLength.innerHTML = `<b>Plug Thread Length</b> (${part.plug.plugThreadLength} mm)`
    plugLength.innerHTML = `<b>Plug Length</b> (${part.plug.plugLength} mm)`
    
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

    row.querySelectorAll("input, select").forEach(el => {
        el.value = "";

        if (el.classList.contains("hole-center")) {
            el.placeholder = "";
        }
    });
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