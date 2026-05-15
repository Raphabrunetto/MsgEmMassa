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

// IndexedDB setup
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

async function populateListSelect() {
  const lists = await getPhoneLists();
  const selectedId = localStorage.getItem("selectedPhoneListId") || "";

  // Atualizar select nativo (escondido)
  if (listSelect) {
  listSelect.innerHTML = `<option value="" disabled selected hidden>Escolha a lista</option>`;

  lists.forEach(list => {
    const option = document.createElement("option");
    option.value = list.id;
    option.textContent = `${list.name} (${list.numbers.length})`;
    listSelect.appendChild(option);
  });

  // só aplica valor se tiver um válido
  if (selectedId) {
    listSelect.value = selectedId;
  }
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

async function selectPhoneList(listId) {
  const lists = await getPhoneLists();
  const selected = lists.find(list => list.id === listId);

  if (!selected) {
    currentSelectedListId = "";
    localStorage.removeItem("selectedPhoneListId");
    numbersInput.value = "";
    totalSpan.textContent = 0;
    await populateListSelect();
    closeDropdown();
    return;
  }

  currentSelectedListId = listId;
  localStorage.setItem("selectedPhoneListId", listId);
  numbersInput.value = selected.numbers.join("\n");
  totalSpan.textContent = selected.numbers.length;
  await populateListSelect();
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

// =========================
// PREVIEW DA IMAGEM (FIX REAL)
// =========================
if (imageInput && preview) {

  function updateImagePreview(file) {
    let img = preview.querySelector('img');

    if (!file) {
      if (img) img.remove();
      preview.classList.remove('has-image');
      imageInput.value = "";
      return;
    }

    if (!img) {
      img = document.createElement('img');
      preview.appendChild(img);
    }

    img.src = URL.createObjectURL(file);

    preview.classList.add('has-image');
    preview.classList.remove('dragover');
  }

  // 🔥 REMOVE BUTTON
  const removeBtn = document.getElementById("removeImageBtn");

  if (removeBtn) {
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      updateImagePreview(null);
    });
  }

  // 🔥 INPUT FILE (UMA VEZ SÓ)
  imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (file) updateImagePreview(file);
  });

  // 🔥 CLICK DROPZONE (UMA VEZ)
  preview.addEventListener('click', () => {
    imageInput.click();
  });

  // 🔥 DRAG
  preview.addEventListener('dragover', (e) => {
    e.preventDefault();
    preview.classList.add('dragover');
  });

  preview.addEventListener('dragleave', () => {
    preview.classList.remove('dragover');
  });

  preview.addEventListener('drop', (e) => {
    e.preventDefault();
    preview.classList.remove('dragover');

    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    imageInput.files = dataTransfer.files;

    updateImagePreview(file);
  });
}

// =========================
// BASE64 CORRETO (COM MIME)
// =========================
async function fileToBase64Data(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => {
      const full = reader.result; // data:image/jpeg;base64,XXXX
      const [meta, base64] = full.split(",");

      const mimetype = meta.match(/data:(.*);base64/)[1];

      resolve({
        base64,
        mimetype,
        full // caso precise enviar completo
      });
    };

    reader.onerror = reject;
  });
}


// =========================
// ENVIO (COMPATÍVEL Z-API)
// =========================
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

  let imageData = null;

  if (file) {
    imageData = await fileToBase64Data(file);

    console.log("Preview base64:", imageData.base64.slice(0, 50));
    console.log("Mimetype:", imageData.mimetype);
  }

  // 🔥 ENVIO 1 POR 1 (ESSENCIAL PRA Z-API)
  for (const number of numbers) {
    try {

      let payload;

      // 👉 COM IMAGEM
      if (imageData) {
        payload = {
          phone: number, // 🔥 MUDA AQUI (Z-API usa phone, não number)
          image: imageData.base64, // já tá correto (SEM prefixo)
          caption: message
        };
      } 
      // 👉 SEM IMAGEM
      else {
        payload = {
          number: number,
          message: message
        };
      }

      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      // 🔥 Delay pra não bloquear (IMPORTANTE)
      await new Promise(r => setTimeout(r, 800));

    } catch (err) {
      console.error("Erro ao enviar para", number, err);
    }
  }

  alert("Disparo enviado 🚀");
}

document.addEventListener("DOMContentLoaded", async () => {
  await populateListSelect();
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