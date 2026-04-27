// EXTRACTED FROM: client/src/pages/help/HelpPage.tsx
// CONVERTED TO:   app/help.tsx
// BUCKET:         B_convert
// WEB LIBRARIES REPLACED: wouter Link → expo-router Link, shadcn Card/Button/Collapsible/Skeleton → RN View/TouchableOpacity/ActivityIndicator, lucide-react icons dropped (no RN equivalent — icons removed)
// LOGIC CHANGES: FAQItem uses useState accordion (no Collapsible), skeleton replaced with ActivityIndicator

import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";

const BASE = process.env.EXPO_PUBLIC_API_URL;

interface Board {
  id: string;
  boardKey: string;
  displayName: string;
  fullName: string;
  description: string;
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <View className="border border-gray-100 rounded-2xl bg-white mb-4 overflow-hidden">
      <View className="px-5 pt-5 pb-3 border-b border-gray-50">
        <Text className="text-base font-semibold text-gray-900">{title}</Text>
        <Text className="text-sm text-gray-500 mt-0.5">{description}</Text>
      </View>
      <View className="p-5">{children}</View>
    </View>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <View className="border border-gray-100 rounded-xl mb-2 overflow-hidden">
      <TouchableOpacity
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center justify-between px-4 py-3"
        activeOpacity={0.7}
      >
        <Text className="text-sm font-medium text-gray-800 flex-1 mr-2">{question}</Text>
        <Text className="text-gray-400 text-lg">{open ? "−" : "+"}</Text>
      </TouchableOpacity>
      {open && (
        <View className="px-4 pb-4">
          <Text className="text-sm text-gray-500 leading-relaxed">{answer}</Text>
        </View>
      )}
    </View>
  );
}

export default function HelpPage() {
  const router = useRouter();

  const { data: boards = [], isLoading } = useQuery<Board[]>({
    queryKey: ["/api/curriculum/boards"],
  });

  const steps = [
    {
      title: "1. Choose Your Curriculum",
      body: "Start by selecting your education board from the home page. We support CAIE, Edexcel, and IB curricula with comprehensive resources for each.",
    },
    {
      title: "2. Select Your Level",
      body: "Choose your academic level (e.g., IGCSE, O Level, A Level for CAIE/Edexcel, or MYP/DP for IB) to access level-specific content.",
    },
    {
      title: "3. Pick Your Subject",
      body: "Browse available subjects and select the one you want to study. Each subject has its own dashboard with organized resources.",
    },
    {
      title: "4. Access Resources",
      body: "On the subject dashboard, you'll find notes, videos, practice questions, past papers, mark schemes, and grade boundaries—all in one place.",
    },
    {
      title: "5. Use Quick Search",
      body: "Use the Subjects page to quickly search for any subject across all curricula. Filter by curriculum and level to narrow down results.",
    },
  ];

  const faqs = [
    {
      q: "Is ExamsValley free to use?",
      a: "Yes! ExamsValley is completely free to access. Browse all curricula, subjects, and resources without any subscription or payment.",
    },
    {
      q: "How are the resources organized?",
      a: "Resources are organized by curriculum, then by level/program, and finally by subject. Each subject has a dashboard with sections for notes, videos, past papers, and more.",
    },
    {
      q: "What curricula are supported?",
      a: "We currently support CAIE (Cambridge Assessment International Education), Edexcel (National Curriculum for England), and IB (International Baccalaureate).",
    },
    {
      q: "Can I search for a specific subject?",
      a: "Yes! Use the Subjects page in the navigation to search for any subject across all curricula. You can also filter by curriculum and level.",
    },
    {
      q: "Are past papers and mark schemes available?",
      a: "Yes, each subject dashboard includes sections for past papers and mark schemes organized by examination session.",
    },
    {
      q: "How often is content updated?",
      a: "We regularly update our resources to include the latest past papers, syllabi, and study materials as they become available.",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-sm text-gray-500">← Back</Text>
        </TouchableOpacity>

        <Text className="text-2xl font-bold text-gray-900 text-center mb-1">Help Center</Text>
        <Text className="text-sm text-gray-500 text-center mb-6">
          Learn how to use ExamsValley and find answers to common questions
        </Text>

        {/* How to Use */}
        <SectionCard title="How to Use the App" description="Get started with ExamsValley">
          {steps.map((step) => (
            <View key={step.title} className="border border-gray-100 rounded-xl p-4 mb-3">
              <Text className="text-sm font-semibold text-gray-800 mb-1">{step.title}</Text>
              <Text className="text-sm text-gray-500 leading-relaxed">{step.body}</Text>
            </View>
          ))}
        </SectionCard>

        {/* Curriculum Explanations */}
        <SectionCard
          title="Curriculum Explanations"
          description="Understand different education systems"
        >
          {isLoading ? (
            <ActivityIndicator size="small" className="py-4" />
          ) : (
            boards
              .filter((b) => ["caie", "pearson", "ib"].includes(b.boardKey))
              .map((board) => (
                <View key={board.id} className="border border-gray-100 rounded-xl p-4 mb-3">
                  <Text className="text-sm font-semibold text-gray-800">{board.displayName}</Text>
                  <Text className="text-xs text-gray-400 mb-2">{board.fullName}</Text>
                  <Text className="text-sm text-gray-500 leading-relaxed">{board.description}</Text>
                  <TouchableOpacity
                    onPress={() => router.push(`/curriculum/${board.boardKey}` as any)}
                    className="mt-3 border border-gray-200 rounded-xl px-4 py-2 self-start"
                  >
                    <Text className="text-sm text-gray-700">Browse {board.displayName}</Text>
                  </TouchableOpacity>
                </View>
              ))
          )}
        </SectionCard>

        {/* FAQs */}
        <SectionCard title="Frequently Asked Questions" description="Common questions and answers">
          {faqs.map((faq) => (
            <FAQItem key={faq.q} question={faq.q} answer={faq.a} />
          ))}
        </SectionCard>

        {/* Contact */}
        <SectionCard title="Contact & Feedback" description="Get in touch with us">
          <Text className="text-sm text-gray-500 mb-4">
            We'd love to hear from you! Whether you have questions, suggestions, or feedback, our
            team is here to help.
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL("mailto:support@ExamsValley.com")}
            className="flex-row items-center border border-gray-100 rounded-xl p-4 mb-3"
          >
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-800">Email Support</Text>
              <Text className="text-sm text-blue-600 mt-0.5">support@ExamsValley.com</Text>
            </View>
          </TouchableOpacity>
          <View className="border border-gray-100 rounded-xl p-4">
            <Text className="text-sm font-medium text-gray-800">Feedback Form</Text>
            <Text className="text-sm text-gray-400 mt-0.5">Coming soon</Text>
          </View>
          <Text className="text-xs text-gray-400 mt-4">
            Response times may vary. We typically respond within 24-48 hours on business days.
          </Text>
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}
