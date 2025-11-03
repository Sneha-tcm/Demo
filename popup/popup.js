document.addEventListener("DOMContentLoaded", () => {
  const scanBtn = document.getElementById("scan");
  const fieldList = document.getElementById("fieldList");

  scanBtn.addEventListener("click", async () => {
    console.log("🟢 Scan button clicked");

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    try {
      // ✅ FIXED PATH HERE
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content/content.js"]
      });

      // Send message to content.js
      chrome.tabs.sendMessage(tab.id, { type: "SCAN_FIELDS" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("❌ Error:", chrome.runtime.lastError.message);
          fieldList.innerHTML = `<div>Error: ${chrome.runtime.lastError.message}</div>`;
          return;
        }

        if (!response || !response.fields || response.fields.length === 0) {
          fieldList.innerHTML =`<div>No fields found.</div>`;
        } else {
          console.log("✅ Fields received:", response.fields);
          fieldList.innerHTML = response.fields
            .map((f) => `<div><b>${f.label}</b> (${f.fieldId})</div>`)
            .join("");
        }
      });
    } catch (err) {
      console.error("❌ Script injection failed:", err);
      fieldList.innerHTML = `<div>Failed to inject content script: ${err.message}</div>`;
    }
  });
 

});
