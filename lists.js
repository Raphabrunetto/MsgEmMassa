const listNameInput = document.getElementById("listName");
const listNumbersInput = document.getElementById("listNumbers");
const listsContainer = document.getElementById("listsContainer");
const listCountSpan = document.getElementById("listCount");
const listMessage = document.getElementById("listMessage");
const saveListBtn = document.getElementById("saveListBtn");

let editingId = null;

// IndexedDB setup (shared with script.js)
let db;

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("MsgEmMassaDB", 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("phoneLists")) {
        db.createObjectStore("phoneLists", { keyPath: "id" });
      }
    };
  });
}

async function getPhoneLists() {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["phoneLists"], "readonly");
    const store = transaction.objectStore("phoneLists");
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function savePhoneLists(lists) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["phoneLists"], "readwrite");
    const store = transaction.objectStore("phoneLists");
    store.clear(); // Clear existing
    lists.forEach(list => store.add(list));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function showMessage(text) {
  listMessage.textContent = text;
}

function clearForm() {
  editingId = null;
  listNameInput.value = "";
  listNumbersInput.value = "";
  saveListBtn.textContent = "Salvar lista";
  showMessage("");
}

async function renderLists() {
  const lists = await getPhoneLists();
  listsContainer.innerHTML = "";

  if (lists.length === 0) {
    listsContainer.innerHTML = `<div class="info">Nenhuma lista criada ainda. Crie uma lista para poder selecioná-la na página de envio.</div>`;
  } else {
    lists.forEach(list => {
      const card = document.createElement("div");
      card.className = "list-card";
      card.innerHTML = `
        <h3>${list.name}</h3>
        <p>${list.numbers.length} número(s)</p>
        <div class="actions">
          <button class="small-button edit" onclick="editList('${list.id}')">Editar</button>
          <button class="small-button delete" onclick="deleteList('${list.id}')">Apagar</button>
        </div>
      `;
      listsContainer.appendChild(card);
    });
  }

  listCountSpan.textContent = lists.length;
}

async function saveList() {
  const name = listNameInput.value.trim();
  const numbers = listNumbersInput.value
    .split("\n")
    .map(n => n.trim())
    .filter(n => n);

  if (!name) {
    showMessage("Digite um nome para a lista.");
    return;
  }

  if (numbers.length === 0) {
    showMessage("Adicione pelo menos um número.");
    return;
  }

  const lists = await getPhoneLists();

  if (editingId) {
    const index = lists.findIndex(list => list.id === editingId);
    if (index !== -1) {
      lists[index].name = name;
      lists[index].numbers = numbers;
      await savePhoneLists(lists);
      showMessage("Lista atualizada com sucesso.");
    }
  } else {
    const newList = {
      id: generateId(),
      name,
      numbers
    };
    lists.push(newList);
    await savePhoneLists(lists);
    showMessage("Lista criada com sucesso.");
  }

  clearForm();
  await renderLists();
}

async function editList(id) {
  const lists = await getPhoneLists();
  const list = lists.find(item => item.id === id);

  if (!list) return;

  editingId = id;
  listNameInput.value = list.name;
  listNumbersInput.value = list.numbers.join("\n");
  saveListBtn.textContent = "Atualizar lista";
  showMessage(`Editando lista: ${list.name}`);
}

async function deleteList(id) {
  if (!confirm("Tem certeza que deseja apagar esta lista?")) return;

  let lists = await getPhoneLists();
  lists = lists.filter(list => list.id !== id);
  await savePhoneLists(lists);

  if (localStorage.getItem("selectedPhoneListId") === id) {
    localStorage.removeItem("selectedPhoneListId");
  }

  clearForm();
  await renderLists();
}

window.addEventListener("DOMContentLoaded", async () => {
  await renderLists();

  // Efeito de pulso ao clicar nos botões
  document.addEventListener("click", function (e) {
    if (!e.target.matches("button, .small-button")) return;
    if (e.target.classList.contains("pulse")) return;

    e.target.classList.add("pulse");
    setTimeout(() => {
      e.target.classList.remove("pulse");
    }, 800);
  });
});
