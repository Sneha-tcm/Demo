
/**
 * 🧩 Main message listener — triggers when popup or background sends "SCAN_FIELDS"
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SCAN_FIELDS") {
    console.log("📡 Starting universal form scan...");
    console.log("📡 Content script loaded (Form Scanner + Ollama AI)");
async function getAIMappings(formLabels, sheetColumns) {
  const prompt = `
You are an AI assistant that helps map web form fields to spreadsheet columns.
Analyze each form label and choose the most relevant spreadsheet column name.

Return JSON like:
[
  {"label": "Business Name", "suggestedColumn": "Company", "confidence": 0.95},
  {"label": "Website URL", "suggestedColumn": "Website", "confidence": 0.98}
]

Form labels: ${JSON.stringify(formLabels.map(f => f.label))}
Spreadsheet columns: ${JSON.stringify(sheetColumns)}
`;

  try {
    const response = await chrome.runtime.sendMessage({
      type: "CALL_OLLAMA",
      payload: { prompt }
    });

    console.log("🧠 Ollama response (from background):", response);

    const messages = response?.choices?.[0]?.message?.content;
    if (!messages) {
      console.warn("⚠️ Ollama response missing 'choices[0].message.content'", response);
      return [];
    }

    return JSON.parse(messages);
  } catch (err) {
    console.error("❌ Ollama mapping error:", err);
    return [];
  }
}



    const fields = [];
    const groupedRadios = {};
    const groupedCheckboxes = {};
    const nameGroups = {};

    // 1️⃣ Collect visible form elements
    const allElements = Array.from(document.querySelectorAll("input, textarea, select")).filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden" && el.type !== "hidden" && !el.disabled;
    });

    // 2️⃣ Helper: Find nearest label/question text
    function findQuestionText(el) {
      if (el.labels?.length > 0) {
        const labelText = el.labels[0].innerText.trim();
        if (labelText.length > 3) return labelText;
      }
      const fieldset = el.closest("fieldset");
      if (fieldset?.querySelector("legend")) return fieldset.querySelector("legend").innerText.trim();
      const parent = el.closest("div, section, form, li, td, tr");
      if (parent) {
        const heading = parent.querySelector("h1,h2,h3,h4,h5,h6,strong,b,label");
        if (heading?.innerText?.trim()?.length > 3) return heading.innerText.trim();
      }
      return el.placeholder || el.name || el.id || "Unnamed Field";
    }

    // 3️⃣ Detect special field types
    function detectFieldCategory(label) {
      const l = label.toLowerCase();
      if (l.includes("email")) return "email";
      if (l.includes("phone") || l.includes("mobile")) return "tel";
      if (l.includes("pan")) return "pan";
      if (l.includes("registration")) return "registration";
      if (l.includes("date")) return "date";
      if (l.includes("website") || l.includes("url")) return "url";
      if (l.includes("number")) return "number";
      return "text";
    }

    // 4️⃣ Loop through each field and classify
    allElements.forEach((el, index) => {
      const tag = el.tagName.toLowerCase();
      const type = el.type?.toLowerCase() || "text";
      const label = findQuestionText(el);

      if (tag === "select") {
        fields.push({
          fieldId: el.id || el.name || `select_${index}`,
          label,
          type: "select",
          options: Array.from(el.options).map(o => o.textContent.trim()).filter(Boolean)
        });
      } else if (type === "radio" && el.name) {
        if (!groupedRadios[el.name]) {
          groupedRadios[el.name] = { fieldId: el.name, label, type: "radio-group", options: [] };
        }
        const optionLabel = el.closest("label")?.innerText?.trim() || el.value || "Option";
        if (!groupedRadios[el.name].options.includes(optionLabel)) {
          groupedRadios[el.name].options.push(optionLabel);
        }
      } else if (type === "checkbox") {
        const parentContainer = el.closest("fieldset, .checkbox-group, .form-group");
        if (parentContainer) {
          const groupId = parentContainer.id || el.name || `checkbox_group_${index}`;
          if (!groupedCheckboxes[groupId]) {
            groupedCheckboxes[groupId] = { fieldId: groupId, label, type: "checkbox-group", options: [] };
          }
          groupedCheckboxes[groupId].options.push({ value: el.value || "on", label: el.closest("label")?.innerText?.trim() || "Option" });
        } else {
          fields.push({
            fieldId: el.id || el.name || `checkbox_${index}`,
            label,
            type: "checkbox-single",
            value: el.value || "on"
          });
        }
      } else if (["date", "datetime-local", "month"].includes(type)) {
        fields.push({ fieldId: el.id || el.name || `date_${index}`, label, type: "date" });
      } else if (tag === "textarea") {
        fields.push({ fieldId: el.id || el.name || `textarea_${index}`, label, type: "textarea" });
      } else {
        fields.push({
          fieldId: el.id || el.name || `field_${index}`,
          label,
          type: detectFieldCategory(label)
        });
      }
    });

    // Merge grouped inputs
    fields.push(...Object.values(groupedRadios), ...Object.values(groupedCheckboxes));

    console.log("✅ Final Detected Fields:", fields);

    // Mock sheet column names (you can replace this later)
    const sheetColumns = [ {
    "Company": "Rently",
    "Website": "rently.com",
    "Address": "California, USA",
    "Phone Number": "9876543210",
    "Team members": "Gowtham, Sneha, Sivasree",
    "Your Name (Required)": "Gowtham",
    "Your Email (Required)": "gowtham@gmail.com",
    "Your Phone Number (Required)": "9876541234",
    "Your Message": "hello team . how its going?"
  }];

  

    // 🧠 Run AI mapping via Ollama
    getAIMappings(fields, sheetColumns).then(aiResult => {
      console.log("✨ AI Mapping Result:", aiResult);

      // Send the result back to background or popup
      chrome.runtime.sendMessage({
        type: "AI_SUGGESTIONS",
        data: aiResult
      });
    });

    sendResponse({ success: true, fields });
    return true;
  }
});

/**
 * 🔁 Auto-rescan DOM for dynamic/multi-step forms
 */
const observer = new MutationObserver(() => {
  console.log("🔁 DOM changed — possible new fields available");
});
observer.observe(document.body, { childList: true, subtree: true });
