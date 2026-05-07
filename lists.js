const listNameInput = document.getElementById("listName");
const listNumbersInput = document.getElementById("listNumbers");
const listsContainer = document.getElementById("listsContainer");
const listCountSpan = document.getElementById("listCount");
const listMessage = document.getElementById("listMessage");
const saveListBtn = document.getElementById("saveListBtn");

let editingId = null;

function getPhoneLists() {
  return JSON.parse(localStorage.getItem("phoneLists") || "[]");
}

function savePhoneLists(lists) {
  localStorage.setItem("phoneLists", JSON.stringify(lists));
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

function renderLists() {
  const lists = getPhoneLists();
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

function saveList() {
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

  const lists = getPhoneLists();

  if (editingId) {
    const index = lists.findIndex(list => list.id === editingId);
    if (index !== -1) {
      lists[index].name = name;
      lists[index].numbers = numbers;
      savePhoneLists(lists);
      showMessage("Lista atualizada com sucesso.");
    }
  } else {
    const newList = {
      id: generateId(),
      name,
      numbers
    };
    lists.push(newList);
    savePhoneLists(lists);
    showMessage("Lista criada com sucesso.");
  }

  clearForm();
  renderLists();
}

function editList(id) {
  const lists = getPhoneLists();
  const list = lists.find(item => item.id === id);

  if (!list) return;

  editingId = id;
  listNameInput.value = list.name;
  listNumbersInput.value = list.numbers.join("\n");
  saveListBtn.textContent = "Atualizar lista";
  showMessage(`Editando lista: ${list.name}`);
}

function deleteList(id) {
  if (!confirm("Tem certeza que deseja apagar esta lista?")) return;

  let lists = getPhoneLists();
  lists = lists.filter(list => list.id !== id);
  savePhoneLists(lists);

  if (localStorage.getItem("selectedPhoneListId") === id) {
    localStorage.removeItem("selectedPhoneListId");
  }

  clearForm();
  renderLists();
}

window.addEventListener("DOMContentLoaded", () => {
  renderLists();

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
