const numbersInput = document.getElementById("numbers");
const totalSpan = document.getElementById("total");
const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");

// contador de números
numbersInput.addEventListener("input", () => {
  const count = numbersInput.value
    .split('\n')
    .filter(n => n.trim() !== '').length;

  totalSpan.textContent = count;
});

// preview da imagem
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];

  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    preview.innerHTML = `<img src="${reader.result}">`;
  };
  reader.readAsDataURL(file);
});

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