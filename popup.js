const titleInput = document.getElementById("titleInput");
const promptInput = document.getElementById("promptInput");
const saveBtn = document.getElementById("saveBtn");
const promptList = document.getElementById("promptList");
const messageBox = document.getElementById("messageBox");
const searchInput = document.getElementById("searchInput");

let allPrompts = [];

function showMessage(message, isError = false) {
  messageBox.textContent = message;
  messageBox.style.color = isError ? "red" : "green";

  setTimeout(() => {
    messageBox.textContent = "";
  }, 2000);
}

function getStoredPrompts() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["prompts"], (result) => {
      resolve(result.prompts || []);
    });
  });
}

function saveStoredPrompts(prompts) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ prompts }, () => resolve());
  });
}

function createPromptCard(promptItem, index) {
  const card = document.createElement("div");
  card.className = "prompt-card";

  const title = document.createElement("div");
  title.className = "prompt-title";
  title.textContent = promptItem.title || "Untitled Prompt";

  const text = document.createElement("div");
  text.className = "prompt-text";
  text.textContent = promptItem.text;

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const copyBtn = document.createElement("button");
  copyBtn.className = "copy-btn";
  copyBtn.textContent = "Copy";
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(promptItem.text);
      showMessage("Prompt copied");
    } catch (error) {
      showMessage("Copy failed", true);
    }
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "Delete";
  deleteBtn.addEventListener("click", async () => {
    allPrompts.splice(index, 1);
    await saveStoredPrompts(allPrompts);
    renderPrompts(searchInput.value.trim().toLowerCase());
    showMessage("Prompt deleted");
  });

  actions.appendChild(copyBtn);
  actions.appendChild(deleteBtn);

  card.appendChild(title);
  card.appendChild(text);
  card.appendChild(actions);

  return card;
}

function renderPrompts(searchTerm = "") {
  promptList.innerHTML = "";

  const filteredPrompts = allPrompts.filter((item) => {
    const titleMatch = (item.title || "").toLowerCase().includes(searchTerm);
    const textMatch = (item.text || "").toLowerCase().includes(searchTerm);
    return titleMatch || textMatch;
  });

  if (filteredPrompts.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = searchTerm
      ? "No matching prompts found."
      : "No prompts saved yet.";
    promptList.appendChild(empty);
    return;
  }

  filteredPrompts.forEach((item) => {
    const originalIndex = allPrompts.findIndex(
      (p) =>
        p.id === item.id
    );

    const card = createPromptCard(item, originalIndex);
    promptList.appendChild(card);
  });
}

async function loadPrompts() {
  allPrompts = await getStoredPrompts();
  renderPrompts();
}

saveBtn.addEventListener("click", async () => {
  const title = titleInput.value.trim();
  const text = promptInput.value.trim();

  if (!text) {
    showMessage("Prompt text is required", true);
    return;
  }

  const newPrompt = {
    id: Date.now(),
    title: title || "Untitled Prompt",
    text
  };

  allPrompts.unshift(newPrompt);
  await saveStoredPrompts(allPrompts);

  titleInput.value = "";
  promptInput.value = "";

  renderPrompts(searchInput.value.trim().toLowerCase());
  showMessage("Prompt saved");
});

searchInput.addEventListener("input", () => {
  renderPrompts(searchInput.value.trim().toLowerCase());
});

document.addEventListener("DOMContentLoaded", loadPrompts);
