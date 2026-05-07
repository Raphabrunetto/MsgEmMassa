const numbersInput = document.getElementById("numbers");
const totalSpan = document.getElementById("total");
const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const listSelect = document.getElementById("listSelect");
const listDropdownTrigger = document.getElementById("listDropdownTrigger");
const listDropdownMenu = document.getElementById("listDropdownMenu");
const dropdownLabel = document.getElementById("dropdownLabel");
const listOptionsContainer = document.getElementById("listOptionsContainer");
const dropdownEmpty = document.getElementById("dropdownEmpty");

let isDropdownOpen = false;
let currentSelectedListId = "";

function getPhoneLists() {
  return JSON.parse(localStorage.getItem("phoneLists") || "[]");
}

function savePhoneLists(lists) {
  localStorage.setItem("phoneLists", JSON.stringify(lists));
}

function populateListSelect() {
  const lists = getPhoneLists();
  const selectedId = localStorage.getItem("selectedPhoneListId") || "";

  // Atualizar select nativo (escondido)
  if (listSelect) {
    listSelect.innerHTML = `<option value="">Selecionar lista...</option>`;
    lists.forEach(list => {
      const option = document.createElement("option");
      option.value = list.id;
      option.textContent = `${list.name} (${list.numbers.length})`;
      listSelect.appendChild(option);
    });
    listSelect.value = selectedId;
  }

  // Atualizar dropdown customizado
  listOptionsContainer.innerHTML = "";
  if (lists.length === 0) {
    dropdownEmpty.style.display = "block";
  } else {
    dropdownEmpty.style.display = "none";
    lists.forEach(list => {
      const option = document.createElement("div");
      option.className = "dropdown-option" + (list.id === currentSelectedListId ? " selected" : "");
      option.textContent = `${list.name} (${list.numbers.length})`;
      option.addEventListener("click", () => selectPhoneList(list.id));
      listOptionsContainer.appendChild(option);
    });
  }

  // Atualizar label
  if (currentSelectedListId) {
    const selected = lists.find(list => list.id === currentSelectedListId);
    if (selected) {
      dropdownLabel.textContent = `${selected.name} (${selected.numbers.length})`;
    } else {
      dropdownLabel.textContent = "Selecione a lista";
      currentSelectedListId = "";
      localStorage.removeItem("selectedPhoneListId");
    }
  } else {
    dropdownLabel.textContent = "Selecione a lista";
  }
}

function selectPhoneList(listId) {
  const lists = getPhoneLists();
  const selected = lists.find(list => list.id === listId);

  if (!selected) {
    currentSelectedListId = "";
    localStorage.removeItem("selectedPhoneListId");
    numbersInput.value = "";
    totalSpan.textContent = 0;
    populateListSelect();
    closeDropdown();
    return;
  }

  currentSelectedListId = listId;
  localStorage.setItem("selectedPhoneListId", listId);
  numbersInput.value = selected.numbers.join("\n");
  totalSpan.textContent = selected.numbers.length;
  populateListSelect();
  closeDropdown();
}

function toggleDropdown() {
  if (isDropdownOpen) {
    closeDropdown();
  } else {
    openDropdown();
  }
}

function openDropdown() {
  isDropdownOpen = true;
  listDropdownTrigger.classList.add("open");
  listDropdownMenu.classList.add("open");
}

function closeDropdown() {
  isDropdownOpen = false;
  listDropdownTrigger.classList.remove("open");
  listDropdownMenu.classList.remove("open");
}

// Dropdown events
if (listDropdownTrigger) {
  listDropdownTrigger.addEventListener("click", toggleDropdown);
}

document.addEventListener("click", (e) => {
  const dropdown = document.querySelector(".dropdown");
  if (dropdown && !e.target.closest(".dropdown")) {
    closeDropdown();
  }
});

const charCount = document.getElementById("charCount");

function updateCounts() {
  const numberCount = numbersInput.value
    .split('\n')
    .filter(n => n.trim() !== '').length;
  totalSpan.textContent = numberCount;

  if (charCount) {
    charCount.textContent = `${document.getElementById("message").value.length} caracteres`;
  }
}

// contador de números e caracteres
numbersInput.addEventListener("input", updateCounts);
document.getElementById("message").addEventListener("input", updateCounts);

// preview da imagem
if (imageInput && preview) {
  const dropzoneText = preview.querySelector('.dropzone-text');

  function updateImagePreview(file) {
    if (!file) {
      const img = preview.querySelector('img');
      if (img) img.remove();
      preview.classList.remove('has-image');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      let img = preview.querySelector('img');
      if (!img) {
        img = document.createElement('img');
        preview.appendChild(img);
      }
      img.src = reader.result;
      preview.classList.add('has-image');
      preview.classList.remove('dragover');
    };
    reader.readAsDataURL(file);
  }

  imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    updateImagePreview(file);
  });

  preview.addEventListener('click', () => {
    imageInput.click();
  });

  preview.addEventListener('dragenter', event => {
    event.preventDefault();
    preview.classList.add('dragover');
  });

  preview.addEventListener('dragover', event => {
    event.preventDefault();
    preview.classList.add('dragover');
  });

  preview.addEventListener('dragleave', () => {
    preview.classList.remove('dragover');
  });

  preview.addEventListener('drop', event => {
    event.preventDefault();
    preview.classList.remove('dragover');

    const file = event.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    imageInput.files = dataTransfer.files;
    updateImagePreview(file);
  });
}

// converter base64
async function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
  });
}

// envio
async function send() {
  const file = imageInput.files[0];
  const numbers = numbersInput.value
    .split('\n')
    .map(n => n.trim())
    .filter(n => n);

  const message = document.getElementById("message").value;

  if (numbers.length === 0) {
    alert("Adicione números");
    return;
  }

  let imageBase64 = null;

  if (file) {
    imageBase64 = await toBase64(file);
  }

  await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      numbers,
      message,
      image: imageBase64
    })
  });

  alert("Disparo enviado 🚀");
}

document.addEventListener("DOMContentLoaded", () => {
  populateListSelect();
  updateCounts();

  // Efeito de pulso ao clicar nos botões
  document.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", function (e) {
      if (this.classList.contains("pulse")) return;
      
      this.classList.add("pulse");
      setTimeout(() => {
        this.classList.remove("pulse");
      }, 800);
    });
  });
});