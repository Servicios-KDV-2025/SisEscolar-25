import { BookOpen, CalendarDays, GraduationCap, AlertCircle, Calendar, Users, Trophy, Star, Heart } from "@repo/ui/icons";

export const iconMap: Record<string, React.ElementType> = {
  bookOpen: BookOpen,
  calendarDays: CalendarDays,
  graduation: GraduationCap,
  alerta: AlertCircle,
  calendar: Calendar,
  users: Users,
  book: BookOpen,
  trophy: Trophy,
  star: Star,
  heart: Heart,
};

export const colorMap: Record<string, { color: string; bgLight: string; borderColor: string; dotColor: string }> = {
  "#3B82F6": { color: "bg-blue-500 text-white", bgLight: "bg-blue-50", borderColor: "border-l-blue-500", dotColor: "before:bg-blue-500" },
  "#10B981": { color: "bg-green-500 text-white", bgLight: "bg-green-50", borderColor: "border-l-green-500", dotColor: "before:bg-green-500" },
  "#F59E0B": { color: "bg-yellow-500 text-white", bgLight: "bg-yellow-50", borderColor: "border-l-yellow-500", dotColor: "before:bg-yellow-500" },
  "#EF4444": { color: "bg-red-500 text-white", bgLight: "bg-red-50", borderColor: "border-l-red-500", dotColor: "before:bg-red-500" },
  "#8B5CF6": { color: "bg-purple-500 text-white", bgLight: "bg-purple-50", borderColor: "border-l-purple-500", dotColor: "before:bg-purple-500" },
  "#06B6D4": { color: "bg-cyan-500 text-white", bgLight: "bg-cyan-50", borderColor: "border-l-cyan-500", dotColor: "before:bg-cyan-500" },
  "#F97316": { color: "bg-orange-500 text-white", bgLight: "bg-orange-50", borderColor: "border-l-orange-500", dotColor: "before:bg-orange-500" },
  "#EC4899": { color: "bg-pink-500 text-white", bgLight: "bg-pink-50", borderColor: "border-l-pink-500", dotColor: "before:bg-pink-500" },
}