document.getElementById("save").addEventListener("click", () => {
  const apiKey = document.getElementById("apiKey").value;
  const languages = document.getElementById("languages").value.split(",").map(l => l.trim());
  chrome.storage.sync.set({ apiKey, languages }, () => {
    alert("Saved :)");
  });
});
