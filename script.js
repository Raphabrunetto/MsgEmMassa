const numbersInput = document.getElementById("numbers");
const totalSpan = document.getElementById("total");
const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");

const charCount = document.getElementById("charCount");

// =========================
// CONTADORES
// =========================
function updateCounts() {
  const numberCount = numbersInput.value
    .split('\n')
    .filter(n => n.trim() !== '').length;

  totalSpan.textContent = numberCount;

  if (charCount) {
    charCount.textContent = `${document.getElementById("message").value.length} caracteres`;
  }
}

numbersInput.addEventListener("input", updateCounts);
document.getElementById("message").addEventListener("input", updateCounts);

// =========================
// PREVIEW DA IMAGEM
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

  const removeBtn = document.getElementById("removeImageBtn");

  if (removeBtn) {
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      updateImagePreview(null);
    });
  }

  imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (file) updateImagePreview(file);
  });

  preview.addEventListener('click', () => {
    imageInput.click();
  });

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
// BASE64 (CORRETO)
// =========================
async function fileToBase64Data(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => {
      const full = reader.result; // ✅ já vem completo

      resolve({
        full // 👈 É ISSO QUE VAMOS USAR
      });
    };

    reader.onerror = reject;
  });
}

// =========================
// ENVIO
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

    console.log("Base64 completo:", imageData.full.slice(0, 50));
  }

  for (const number of numbers) {
    try {

      let payload;

      // 👉 COM IMAGEM
      if (imageData) {
        payload = {
          number: number,
          image: imageData.full, // ✅ CORRETO
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

      await new Promise(r => setTimeout(r, 800));

    } catch (err) {
      console.error("Erro ao enviar para", number, err);
    }
  }

  alert("Disparo enviado 🚀");
}

document.addEventListener("DOMContentLoaded", () => {
  updateCounts();
});