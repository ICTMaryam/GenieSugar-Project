import { db } from "./db";
import { chatMessages } from "@shared/schema";
import crypto from "crypto";

function generateId(): string {
  return crypto.randomUUID();
}

async function seedMessages() {
  console.log("Adding chat messages between doctors and patients...");

  const now = new Date();

  // Conversation templates between patients and doctors
  const conversations = [
    // Hussain Ali (P006) and Dr. Ahmed Al-Noor (D001)
    {
      patientId: "P006",
      doctorId: "D001",
      messages: [
        { sender: "patient", text: "Good morning Dr. Ahmed, I wanted to ask about my recent glucose readings.", hoursAgo: 48 },
        { sender: "doctor", text: "Good morning Hussain! I've reviewed your readings. They look fairly stable. How are you feeling?", hoursAgo: 47 },
        { sender: "patient", text: "I'm feeling good overall. Sometimes I notice higher readings after dinner.", hoursAgo: 46 },
        { sender: "doctor", text: "That's common. Try to have dinner earlier and go for a short walk after eating. This can help.", hoursAgo: 45 },
        { sender: "patient", text: "I'll try that. Thank you for the advice!", hoursAgo: 44 },
        { sender: "doctor", text: "You're welcome. Keep logging your readings and we'll review them in our next appointment.", hoursAgo: 43 },
      ]
    },
    // Noora Salman (P007) and Dr. Ahmed Al-Noor (D001)
    {
      patientId: "P007",
      doctorId: "D001",
      messages: [
        { sender: "patient", text: "Dr. Ahmed, I had a low glucose reading this morning (65 mg/dL). Should I be concerned?", hoursAgo: 24 },
        { sender: "doctor", text: "That is slightly low. Did you eat a late dinner or skip breakfast?", hoursAgo: 23 },
        { sender: "patient", text: "I had a light dinner and woke up late. I hadn't eaten yet when I checked.", hoursAgo: 22 },
        { sender: "doctor", text: "That explains it. Make sure to eat something when you wake up. Keep glucose tablets nearby for emergencies.", hoursAgo: 21 },
        { sender: "patient", text: "Understood. I'll be more careful about my meal timing.", hoursAgo: 20 },
      ]
    },
    // Abdulrahman Yusuf (P008) and Dr. Fatima Al-Haddad (D002)
    {
      patientId: "P008",
      doctorId: "D002",
      messages: [
        { sender: "doctor", text: "Hello Abdulrahman, I noticed your glucose readings have been higher than usual this week. Is everything okay?", hoursAgo: 72 },
        { sender: "patient", text: "Hello Dr. Fatima. Yes, I've been under a lot of stress at work. Could that affect my readings?", hoursAgo: 70 },
        { sender: "doctor", text: "Absolutely. Stress can raise blood glucose levels. Try to find time for relaxation and exercise.", hoursAgo: 68 },
        { sender: "patient", text: "I've been skipping my walks because of work. I'll try to get back on track.", hoursAgo: 66 },
        { sender: "doctor", text: "Even a 15-minute walk can help. Let me know if the readings don't improve in a week.", hoursAgo: 64 },
        { sender: "patient", text: "Will do. Thank you for checking in!", hoursAgo: 62 },
      ]
    },
    // Saeed Ahmed (P010) and Dr. Fatima Al-Haddad (D002)
    {
      patientId: "P010",
      doctorId: "D002",
      messages: [
        { sender: "patient", text: "Good evening Dr. Fatima. My glucose was 195 after lunch today. That seems high.", hoursAgo: 8 },
        { sender: "doctor", text: "What did you have for lunch?", hoursAgo: 7 },
        { sender: "patient", text: "I had rice with grilled chicken and a small dessert for a colleague's birthday.", hoursAgo: 6 },
        { sender: "doctor", text: "The dessert likely caused the spike. Occasional treats are okay, but try to limit portion sizes.", hoursAgo: 5 },
        { sender: "patient", text: "I understand. I'll be more mindful next time.", hoursAgo: 4 },
        { sender: "doctor", text: "Your overall trend is good. One high reading isn't a problem. Just continue your healthy habits!", hoursAgo: 3 },
      ]
    },
    // Maryam Jasim (P009) and Dr. Khalid Al-Mahroos (D003)
    {
      patientId: "P009",
      doctorId: "D003",
      messages: [
        { sender: "patient", text: "Dr. Khalid, when should I check my glucose - before or after meals?", hoursAgo: 96 },
        { sender: "doctor", text: "It's best to check both! Before meals gives you fasting/baseline levels, after meals shows how food affects you.", hoursAgo: 94 },
        { sender: "patient", text: "How long after eating should I wait?", hoursAgo: 92 },
        { sender: "doctor", text: "About 2 hours after you start eating. This captures the peak glucose level from your meal.", hoursAgo: 90 },
        { sender: "patient", text: "That makes sense. I'll start tracking both times. Thank you!", hoursAgo: 88 },
      ]
    },
    // Omar Khalil (P012) and Dr. Ahmed Al-Noor (D001)
    {
      patientId: "P012",
      doctorId: "D001",
      messages: [
        { sender: "patient", text: "Hello Dr. Ahmed, I started exercising regularly last week. Will this help my glucose?", hoursAgo: 36 },
        { sender: "doctor", text: "Hello Omar! Yes, regular exercise is excellent for glucose control. What exercises are you doing?", hoursAgo: 34 },
        { sender: "patient", text: "I'm walking for 30 minutes every morning and doing light yoga twice a week.", hoursAgo: 32 },
        { sender: "doctor", text: "That's a great routine! You should start seeing improvements in your readings within 2-3 weeks.", hoursAgo: 30 },
        { sender: "patient", text: "I already feel more energetic. Looking forward to seeing the results in my numbers too!", hoursAgo: 28 },
        { sender: "doctor", text: "Excellent attitude! Keep up the good work and remember to stay hydrated during exercise.", hoursAgo: 26 },
      ]
    },
    // Lulwa Fawzi (P013) and Dr. Khalid Al-Mahroos (D003)
    {
      patientId: "P013",
      doctorId: "D003",
      messages: [
        { sender: "doctor", text: "Hi Lulwa, I wanted to follow up on your recent lab results. Everything looks good!", hoursAgo: 120 },
        { sender: "patient", text: "That's great news, Dr. Khalid! I've been very careful with my diet.", hoursAgo: 118 },
        { sender: "doctor", text: "I can see that from your glucose logs. Your HbA1c has improved significantly.", hoursAgo: 116 },
        { sender: "patient", text: "The food log feature in the app really helps me stay accountable.", hoursAgo: 114 },
        { sender: "doctor", text: "Keep using it! Data-driven management is key to long-term success.", hoursAgo: 112 },
      ]
    },
    // Reem Abdulaziz (P015) and Dr. Yousif Al-Ansari (D005)
    {
      patientId: "P015",
      doctorId: "D005",
      messages: [
        { sender: "patient", text: "Dr. Yousif, I'm traveling next week. Any tips for managing my diabetes while away?", hoursAgo: 12 },
        { sender: "doctor", text: "Good question! Carry extra supplies, keep snacks for low glucose, and try to maintain meal times.", hoursAgo: 10 },
        { sender: "patient", text: "Should I adjust my testing schedule during travel?", hoursAgo: 9 },
        { sender: "doctor", text: "Test more frequently, especially if crossing time zones. Jet lag can affect glucose levels.", hoursAgo: 8 },
        { sender: "patient", text: "I'll pack extra supplies and set reminders. Thank you!", hoursAgo: 6 },
        { sender: "doctor", text: "Safe travels! Feel free to message if you have any concerns while away.", hoursAgo: 5 },
      ]
    },
    // Zahra Hasan (P011) and Dr. Yousif Al-Ansari (D005)
    {
      patientId: "P011",
      doctorId: "D005",
      messages: [
        { sender: "patient", text: "Good morning Doctor. My fasting glucose has been consistently around 110-120. Is that okay?", hoursAgo: 52 },
        { sender: "doctor", text: "Good morning Zahra. That's slightly elevated for fasting. What time do you usually have your last meal?", hoursAgo: 50 },
        { sender: "patient", text: "Usually around 9 PM, sometimes later if I work late.", hoursAgo: 48 },
        { sender: "doctor", text: "Try to have dinner earlier, ideally before 7 PM. Also avoid high-carb meals at night.", hoursAgo: 46 },
        { sender: "patient", text: "I'll try moving dinner earlier. My work schedule makes it difficult sometimes.", hoursAgo: 44 },
        { sender: "doctor", text: "Do your best. Even a light, early snack instead of a full late dinner can help.", hoursAgo: 42 },
      ]
    },
  ];

  // Dietitian-Patient conversations
  const dietitianConversations = [
    // Hussain Ali (P006) and Sara Al-Khalifa (DT001)
    {
      patientId: "P006",
      dietitianId: "DT001",
      messages: [
        { sender: "patient", text: "Hello Sara, I need some advice on meal planning for better glucose control.", hoursAgo: 36 },
        { sender: "dietitian", text: "Hi Hussain! I'd be happy to help. Can you tell me about your current eating habits?", hoursAgo: 34 },
        { sender: "patient", text: "I usually have rice with lunch and dinner. Breakfast is just coffee and sometimes bread.", hoursAgo: 32 },
        { sender: "dietitian", text: "Try swapping white rice for brown rice or quinoa. Also, add protein to breakfast - eggs or yogurt work great.", hoursAgo: 30 },
        { sender: "patient", text: "What about snacks? I get hungry between meals.", hoursAgo: 28 },
        { sender: "dietitian", text: "Nuts, cheese, or vegetables with hummus are excellent choices. They won't spike your glucose like crackers or sweets.", hoursAgo: 26 },
        { sender: "patient", text: "Thank you! I'll try these changes this week.", hoursAgo: 24 },
      ]
    },
    // Noora Salman (P007) and Huda Al-Sayed (DT002)
    {
      patientId: "P007",
      dietitianId: "DT002",
      messages: [
        { sender: "dietitian", text: "Hi Noora! I noticed from your food log that you've been eating more vegetables. Great progress!", hoursAgo: 18 },
        { sender: "patient", text: "Thank you! I've been trying to follow your advice. But I miss sweets sometimes.", hoursAgo: 16 },
        { sender: "dietitian", text: "That's completely normal. You can have dark chocolate in small amounts, or try fresh berries as a sweet treat.", hoursAgo: 14 },
        { sender: "patient", text: "Oh, I love berries! Are all fruits okay for diabetics?", hoursAgo: 12 },
        { sender: "dietitian", text: "Berries, apples, and pears are best. Limit tropical fruits like mango and pineapple as they're higher in sugar.", hoursAgo: 10 },
        { sender: "patient", text: "Good to know. I'll stick to berries then!", hoursAgo: 8 },
      ]
    },
    // Abdulrahman Yusuf (P008) and Sara Al-Khalifa (DT001)
    {
      patientId: "P008",
      dietitianId: "DT001",
      messages: [
        { sender: "patient", text: "Sara, I'm struggling with portion control. Any tips?", hoursAgo: 60 },
        { sender: "dietitian", text: "Use smaller plates - it tricks your brain into thinking you're eating more. Also, eat slowly!", hoursAgo: 58 },
        { sender: "patient", text: "I do eat quite fast. Does that really matter?", hoursAgo: 56 },
        { sender: "dietitian", text: "Yes! It takes 20 minutes for your brain to register fullness. Eating slowly helps you stop before overeating.", hoursAgo: 54 },
        { sender: "patient", text: "I'll try putting my fork down between bites.", hoursAgo: 52 },
        { sender: "dietitian", text: "Perfect strategy! Also try drinking water before meals - it helps with satiety.", hoursAgo: 50 },
      ]
    },
    // Saeed Ahmed (P010) and Amina Yusuf (DT003)
    {
      patientId: "P010",
      dietitianId: "DT003",
      messages: [
        { sender: "patient", text: "Hi Amina, what are some good breakfast options that won't raise my glucose too much?", hoursAgo: 4 },
        { sender: "dietitian", text: "Great question! Try eggs with vegetables, Greek yogurt with nuts, or oatmeal with cinnamon.", hoursAgo: 3 },
        { sender: "patient", text: "Is oatmeal okay? I heard it has carbs.", hoursAgo: 2 },
        { sender: "dietitian", text: "Steel-cut oats are better than instant. The fiber slows glucose absorption. Add protein like nuts to balance it.", hoursAgo: 1 },
      ]
    },
    // Omar Khalil (P012) and Noor Abdulrahman (DT004)
    {
      patientId: "P012",
      dietitianId: "DT004",
      messages: [
        { sender: "dietitian", text: "Omar, I see you've started exercising! That's wonderful for glucose control.", hoursAgo: 20 },
        { sender: "patient", text: "Thank you! Should I eat differently on workout days?", hoursAgo: 18 },
        { sender: "dietitian", text: "Yes! Have a small snack 30 minutes before - banana or toast with peanut butter works well.", hoursAgo: 16 },
        { sender: "patient", text: "What about after the workout?", hoursAgo: 14 },
        { sender: "dietitian", text: "Have protein within an hour - chicken, fish, or a protein shake. This helps muscle recovery.", hoursAgo: 12 },
        { sender: "patient", text: "I'll add this to my routine. Thanks for the guidance!", hoursAgo: 10 },
      ]
    },
    // Reem Abdulaziz (P015) and Lina Hasan (DT005)
    {
      patientId: "P015",
      dietitianId: "DT005",
      messages: [
        { sender: "patient", text: "Hi Lina, I'm going on vacation. Any diet tips for traveling?", hoursAgo: 6 },
        { sender: "dietitian", text: "Pack healthy snacks like nuts and dried fruits. At restaurants, choose grilled over fried.", hoursAgo: 5 },
        { sender: "patient", text: "What if the only options are carb-heavy?", hoursAgo: 4 },
        { sender: "dietitian", text: "Eat smaller portions, add a side salad, and take a walk after meals. Don't stress too much - enjoy your trip!", hoursAgo: 3 },
        { sender: "patient", text: "That's reassuring. I was worried about falling off track.", hoursAgo: 2 },
        { sender: "dietitian", text: "One week won't undo your progress. Just make the best choices available and resume healthy eating when you return.", hoursAgo: 1 },
      ]
    },
  ];

  // Insert all doctor-patient messages
  for (const convo of conversations) {
    for (const msg of convo.messages) {
      const senderId = msg.sender === "patient" ? convo.patientId : convo.doctorId;
      const receiverId = msg.sender === "patient" ? convo.doctorId : convo.patientId;
      const createdAt = new Date(now.getTime() - msg.hoursAgo * 60 * 60 * 1000);

      try {
        await db.insert(chatMessages).values({
          id: generateId(),
          senderId: senderId,
          receiverId: receiverId,
          content: msg.text,
          isRead: msg.hoursAgo > 6, // Mark older messages as read
          createdAt: createdAt,
        });
      } catch (error: any) {
        console.error(`Error inserting message:`, error.message);
      }
    }
    console.log(`  Created conversation between patient ${convo.patientId} and doctor ${convo.doctorId}`);
  }

  // Insert all dietitian-patient messages
  for (const convo of dietitianConversations) {
    for (const msg of convo.messages) {
      const senderId = msg.sender === "patient" ? convo.patientId : convo.dietitianId;
      const receiverId = msg.sender === "patient" ? convo.dietitianId : convo.patientId;
      const createdAt = new Date(now.getTime() - msg.hoursAgo * 60 * 60 * 1000);

      try {
        await db.insert(chatMessages).values({
          id: generateId(),
          senderId: senderId,
          receiverId: receiverId,
          content: msg.text,
          isRead: msg.hoursAgo > 6, // Mark older messages as read
          createdAt: createdAt,
        });
      } catch (error: any) {
        console.error(`Error inserting message:`, error.message);
      }
    }
    console.log(`  Created conversation between patient ${convo.patientId} and dietitian ${convo.dietitianId}`);
  }

  const totalDoctorMsgs = conversations.reduce((sum, c) => sum + c.messages.length, 0);
  const totalDietitianMsgs = dietitianConversations.reduce((sum, c) => sum + c.messages.length, 0);
  console.log("\nChat messages seeding completed!");
  console.log(`Total doctor conversations: ${conversations.length}`);
  console.log(`Total dietitian conversations: ${dietitianConversations.length}`);
  console.log(`Total messages: ${totalDoctorMsgs + totalDietitianMsgs}`);
}

seedMessages()
  .then(() => {
    console.log("Message seed script finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Message seed script failed:", error);
    process.exit(1);
  });
