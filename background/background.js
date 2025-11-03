chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  switch(msg.type) {
    case "FIELDS_DETECTED":
      console.log("✅ Received form fields:", msg.data);
      sendResponse({ status: "ok" });
      break;
    case "USER_FEEDBACK":
      console.log("📝 User feedback:", msg.data);
      sendResponse({ status: "ok" });
      break;
    case "CALL_OLLAMA":
      console.log("calling ollama")
      try {
       const res = await fetch("http://127.0.0.1:11435/api/tags", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "tinyllama",
    messages: [{ role: "user", content: msg.payload.prompt }]
  })
});
        console.log("Status:", res.status, res.statusText);
        const text = await res.text(); // get raw text first
        console.log("Response text:", text);
        const data = await res.json();
        sendResponse(data);
      } catch (err) {
        console.error("❌ Ollama fetch failed:", err);
        sendResponse({ error: err.message });
      }
      return true;
  }
});
