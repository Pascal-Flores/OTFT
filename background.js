chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(["languages"], (data) => {
    const languages = data.languages || ["en", "fr"];
    createContextMenus(languages);
    console.log(languages)
  });
});

function createContextMenus(languages) {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "translate",
      title: "Traduire",
      contexts: ["editable"]
    });

    languages.forEach(lang => {
      chrome.contextMenus.create({
        id: `translate-${lang}`,
        parentId: "translate",
        title: `→ ${lang.toUpperCase()}`,
        contexts: ["editable"]
      });
    });
  });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId.startsWith("translate-")) {
    const lang = info.menuItemId.split("-")[1];
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: translateTextInField,
      args: [lang, info.selectionText]
    });
  }
});

async function translateTextInField(lang, selectedText) {
  const selection = window.getSelection();
  console.log(selection)
  if (!selection || selection.rangeCount === 0) {
    console.warn("Aucune sélection");
    return;
  }
  if (!selectedText) {
    console.warn("Rien de sélectionné");
    return;
  }

  let wholeText = selection.baseNode.data
  const apiKey = await new Promise(resolve => {
    chrome.storage.sync.get(["apiKey"], (data) => resolve(data.apiKey));
  });
  console.log(apiKey)
  const prompt = `Translate the given text to this language : ${lang} :\n${selectedText}\n You only must give the translated text, and no other information`;
  console.log(prompt)
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5
    })
  });
  const data = await res.json();
  const translated = data.choices?.[0]?.message?.content;
  console.log(translated)
  wholeText = wholeText.replace(selectedText, translated)
  console.log(wholeText)
  if (translated) selection.anchorNode.data = wholeText;
}
