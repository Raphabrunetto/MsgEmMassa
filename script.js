// =========================
// FORMATADOR DE NÚMERO 🇧🇷
// =========================
function formatPhoneBR(phone) {
  let cleaned = phone.replace(/\D/g, "");

  // remove 55 se já tiver
  if (cleaned.startsWith("55")) {
    cleaned = cleaned.slice(2);
  }

  // valida tamanho básico (DDD + número)
  if (cleaned.length < 10 || cleaned.length > 11) {
    return null;
  }

  return "55" + cleaned;
}

// =========================
// ENVIO (CORRIGIDO Z-API)
// =========================
async function send() {
  const file = imageInput.files[0];

  // 🔥 SPLIT + LIMPEZA + FORMATAÇÃO
  let numbers = numbersInput.value
    .split('\n')
    .map(n => n.trim())
    .filter(n => n)
    .map(n => formatPhoneBR(n))
    .filter(n => n); // remove inválidos

  const message = document.getElementById("message").value;

  if (numbers.length === 0) {
    alert("Nenhum número válido");
    return;
  }

  // 🔥 REMOVE DUPLICADOS
  numbers = [...new Set(numbers)];

  let imageData = null;

  if (file) {
    imageData = await fileToBase64Data(file);

    console.log("Preview base64:", imageData.base64.slice(0, 50));
    console.log("Mimetype:", imageData.mimetype);
  }

  let success = 0;
  let errors = 0;

  // 🔥 ENVIO 1 POR 1
  for (const number of numbers) {
    try {
      let payload;

      if (imageData) {
        payload = {
          phone: number,
          image: imageData.base64,
          caption: message
        };
      } else {
        payload = {
          phone: number,
          message: message
        };
      }

      console.log("Enviando para:", number);

      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Erro HTTP");
      }

      success++;

      // delay anti-bloqueio
      await new Promise(r => setTimeout(r, 800));

    } catch (err) {
      console.error("Erro ao enviar para", number, err);
      errors++;
    }
  }

  alert(`Disparo finalizado 🚀\n\n✅ Sucesso: ${success}\n❌ Erros: ${errors}`);
}