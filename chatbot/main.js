import { GoogleGenerativeAI } from "@google/generative-ai";

// Business information for the AI chatbot
const businessInfo = `
General Business Information:
Website: https://mx-7.github.io/

you should say first if the user said hi or hellow (Welcome to Lafa Restaurant. How can we assist you with your dining experience?)
Privacy Policy

At Lafa Restaurant, we are committed to protecting your privacy. This policy outlines how we collect, use, and safeguard your personal information.
We collect information to improve your dining and online ordering experience.
Your data is stored securely and is not shared with third parties without your consent.
You have the right to access and update your personal information at any time.
We take your privacy seriously and adhere to the highest standards of data protection. Our team continuously reviews and updates our practices to ensure your information is handled responsibly and securely.
For more details about our privacy practices or to exercise your rights, please contact us. Your trust is important to us, and we are here to address any concerns you may have.

about us: 

We are a group of students from King Saud University (KSU) working on this project to deliver a delightful and user-friendly restaurant experience, both in-person and online. Our mission is to provide a seamless and enjoyable experience for all our patrons.
At Lafa Restaurant, we believe in combining culinary creativity with technology to create a platform that caters to the needs of modern diners. Whether you are looking for a reservation, a quick takeout, or catering for an event, Lafa Restaurant is here to make your meal unforgettable.
This project is a testament to our dedication, creativity, and teamwork. We hope you enjoy using our platform as much as we enjoyed building it. Our team has worked tirelessly to ensure that every feature is designed with the user in mind, from intuitive menu navigation to secure online ordering.
As students, this project has been a learning journey, allowing us to apply our academic knowledge to a real-world scenario. We have incorporated the latest technologies and best practices to create a platform that is not only functional but also visually appealing and easy to use.
Thank you for choosing Lafa Restaurant. We look forward to serving you a memorable meal.

Support Email: contact@lafarestaurant.com
phone number: +(966)555555555


Our Cancellation and Reservation Policy
At Lafa Restaurant, we understand that plans can change. Our policy is designed to provide flexibility while ensuring fairness for all our guests.
For reservations, please notify us of any cancellation at least 3 hours before your scheduled time to allow us to offer the table to other guests.
For large catering orders, cancellations made 48 hours before the scheduled pickup/delivery will receive a full refund.
Cancellations for catering made within 48 hours will incur a 50% charge of the order amount.
No-shows for reservations may be noted, and repeated instances may affect future booking ability.
We strive to accommodate our guests' needs and provide exceptional service. If you have any special circumstances or require assistance with your reservation or order, please do not hesitate to reach out to our support team. We are here to help and ensure your experience with Lafa Restaurant is a positive one.
Please note that our policy is subject to change, and we recommend reviewing it at the time of booking an event or reservation. Your satisfaction is our priority, and we aim to provide a fair and transparent process for all our guests.

We have no physical stores.
its a text website only.

Here’s how you can navigate through our platform:

Homepage: Start at the Homepage to explore our featured dishes, daily specials, and why Lafa Restaurant is the best choice for your meal.

Menu Details: Click on any dish or category to view detailed information about the ingredients, allergens, and customization options.

Special Offers: no current special offers.

About Us: Learn more about our mission and team on the About Us page.

Help Center: Need assistance? Check out the Help Center for FAQs on ordering, delivery, and support.

Privacy Policy: Review how we handle your data on the Privacy Policy page.

Terms and Conditions: Understand our policies by visiting the Terms and Conditions page.

Profile: Log in to access your Profile, manage past orders, and update your account details.

Restaurant Management: If you’re an admin, manage menus and orders through the Restaurant Management page.

Login/Sign Up: Use the Login page to sign in or create an account.


Tone Instructions:
Conciseness: Respond in short, informative sentences.
Formality: Use polite language with slight formality (e.g., "Please let us know," "We are happy to assist").
Clarity: Avoid technical jargon unless necessary.
Consistency: Ensure responses are aligned in tone and style across all queries.
Example: "Thank you for reaching out! Please let us know if you need further assistance."
`;

// UI Elements
const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeBtn = document.querySelector(".close-btn");
const chatbox = document.querySelector(".chatbox");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");

// API setup
const API_KEY = "AIzaSyAVq3tymFF_-9u72nnZy8uWYCi4_70zJ28";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: businessInfo,
});

// Chat history
let messages = {
  history: [],
};

const inputInitHeight = chatInput.scrollHeight;

// Create chat message element
const createChatLi = (message, className) => {
  const chatLi = document.createElement("li");
  chatLi.classList.add("chat", `${className}`);
  let chatContent =
    className === "outgoing"
      ? `<p></p>`
      : `<span class="material-symbols-outlined">smart_toy</span><p></p>`;
  chatLi.innerHTML = chatContent;
  chatLi.querySelector("p").textContent = message;
  return chatLi;
};

// Handle sending messages
const handleChat = async () => {
  const userMessage = chatInput.value.trim();
  if (!userMessage) return;

  // Disable input and send button
  chatInput.disabled = true;
  sendChatBtn.disabled = true;

  // Clear input and reset height
  chatInput.value = "";
  chatInput.style.height = `${inputInitHeight}px`;

  // Add user message to chat
  chatbox.appendChild(createChatLi(userMessage, "outgoing"));
  chatbox.scrollTo(0, chatbox.scrollHeight);

  // Create thinking message
  const incomingChatLi = createChatLi("Thinking...", "incoming");
  chatbox.appendChild(incomingChatLi);
  chatbox.scrollTo(0, chatbox.scrollHeight);

  try {
    // Get response from AI
    const chat = model.startChat(messages);
    const result = await chat.sendMessageStream(userMessage);

    // Replace thinking with empty message that will be filled
    const messageElement = incomingChatLi.querySelector("p");
    messageElement.textContent = "";

    // Stream in the response
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      messageElement.textContent += chunkText;
    }

    // Add messages to history
    messages.history.push({
      role: "user",
      parts: [{ text: userMessage }],
    });

    messages.history.push({
      role: "model",
      parts: [{ text: messageElement.textContent }],
    });
  } catch (error) {
    incomingChatLi.querySelector("p").textContent =
      "Sorry, something went wrong. Please try again later.";
  }

  // Re-enable input and send button
  chatInput.disabled = false;
  sendChatBtn.disabled = false;

  chatbox.scrollTo(0, chatbox.scrollHeight);
};

// Input height adjustment
chatInput.addEventListener("input", () => {
  chatInput.style.height = `${inputInitHeight}px`;
  chatInput.style.height = `${chatInput.scrollHeight}px`;
});

// Enter key to send
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
    e.preventDefault();
    handleChat();
  }
});

// Event listeners
sendChatBtn.addEventListener("click", handleChat);
closeBtn.addEventListener("click", () =>
  document.body.classList.remove("show-chatbot")
);
chatbotToggler.addEventListener("click", () =>
  document.body.classList.toggle("show-chatbot")
);
