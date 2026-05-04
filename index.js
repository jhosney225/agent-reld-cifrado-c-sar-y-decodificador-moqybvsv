const Anthropic = require("@anthropic-ai/sdk");
const readline = require("readline");

const client = new Anthropic();

// Caesar cipher implementation
function caesarEncrypt(text, shift) {
  return text
    .split("")
    .map((char) => {
      if (char.match(/[a-z]/i)) {
        const code = char.charCodeAt(0);
        const isUpperCase = code <= 90;
        const base = isUpperCase ? 65 : 97;
        return String.fromCharCode(((code - base + shift) % 26) + base);
      }
      return char;
    })
    .join("");
}

function caesarDecrypt(text, shift) {
  return caesarEncrypt(text, -shift);
}

function bruteForceDecrypt(text) {
  const results = [];
  for (let shift = 0; shift < 26; shift++) {
    results.push({
      shift,
      text: caesarDecrypt(text, shift),
    });
  }
  return results;
}

// Conversation history for multi-turn interaction
const conversationHistory = [];

async function chat(userMessage) {
  conversationHistory.push({
    role: "user",
    content: userMessage,
  });

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    system: `You are a helpful assistant that helps users with Caesar cipher encryption and decryption.
You can:
1. Encrypt text using Caesar cipher with a specified shift
2. Decrypt text if the shift is known
3. Decrypt text by trying all possible shifts (brute force)
4. Explain how Caesar cipher works

When the user asks to encrypt or decrypt, extract the text and shift value from their message.
Respond with the result and brief explanation.`,
    messages: conversationHistory,
  });

  const assistantMessage = response.content[0].text;
  conversationHistory.push({
    role: "assistant",
    content: assistantMessage,
  });

  return assistantMessage;
}

async function demonstrateCaesarCipher() {
  console.log("=== Caesar Cipher Encryption/Decryption Demo ===\n");

  // Direct cipher operations
  console.log("Direct Caesar Cipher Operations:");
  console.log("--------------------------------");

  const originalText = "Hello World";
  const shift = 3;

  const encrypted = caesarEncrypt(originalText, shift);
  console.log(`Original text: "${originalText}"`);
  console.log(`Shift value: ${shift}`);
  console.log(`Encrypted: "${encrypted}"`);

  const decrypted = caesarDecrypt(encrypted, shift);
  console.log(`Decrypted: "${decrypted}"`);

  // Brute force demo
  console.log("\nBrute Force Decryption (trying all shifts):");
  console.log("------------------------------------------");
  const encryptedText = "Eloow Olnvd";
  console.log(`Encrypted text: "${encryptedText}"`);
  console.log("Possible decryptions:");

  const bruteForceResults = bruteForceDecrypt(encryptedText);
  bruteForceResults.forEach(({ shift, text }) => {
    if (shift <= 5) {
      console.log(`  Shift ${shift}: "${text}"`);
    }
  });
  console.log("  ... (showing first 6 of 26 possibilities)\n");
}

async function interactiveMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("\n=== Interactive Chat Mode ===");
  console.log("Chat with AI about Caesar cipher operations");
  console.log('Type "quit" to exit\n');

  const askQuestion = () => {
    rl.question("You: ", async (input) => {
      if (input.toLowerCase() === "quit") {
        console.log("Goodbye!");
        rl.close();
        return;
      }

      try {
        const response = await chat(input);
        console.log(`\nAssistant: ${response}\n`);
      } catch (error) {
        console.error("Error:", error.message);
      }

      askQuestion();
    });
  };

  askQuestion();
}

async function main() {
  try {
    // Run direct demonstration
    await demonstrateCaesarCipher();

    // Start interactive mode with Claude
    console.log("\nStarting interactive mode with Claude AI...\n");

    // Have Claude explain Caesar cipher
    const explanation = await chat(
      "Can you explain how the Caesar cipher works and what are some of its weaknesses?"
    );
    console.log(`Claude: ${explanation}\n`);

    // Have Claude help with encryption
    const encryptHelp = await chat(
      "I want to encrypt the text 'Secret Message' with a shift of 5. Can you help me understand what the encrypted text would be?"
    );
    console.log(`Claude: ${encryptHelp}\n`);

    // Show practical example
    const practicalExample = await chat(
      "I have an encrypted message: 'Wkh txlfn eurzq ira mxpsv ryhu wkh odcb grj'. Can you help me decrypt it? Assume it uses a Caesar cipher with a shift of 3."
    );
    console.log(`Claude: ${practicalExample}\n`);

    // Start interactive conversation
    await interactiveMode();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();