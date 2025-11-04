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
      const OLLAMA_API_KEY = "7f45a572cf934e9e8628ddbb0270ace4.dgCQnMABb_97Im-lX-O75RF3"; // ⚠ Only for personal use
       try {
  const response = await fetch("https://ollama.com/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OLLAMA_API_KEY}`
    },
    body: JSON.stringify({
      model: "gemma:4b",
      messages: [
        { role: "system", content: "You are an AI assistant that maps form fields to spreadsheet columns." },
        { role: "user", content: msg.payload.prompt }
      ],
      stream: true
    })
  });

  const data = await response.json();
  console.log("AI Response:", data);

  sendResponse({ result: data });
} catch (err) {
  console.error(err);
  sendResponse({ error: err.message });
}

return true;
 // Keep message channel open for async
      }
});

 
