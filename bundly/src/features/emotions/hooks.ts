import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchEmotions, addEmotion, fetchDebriefs, addDebrief, type EmotionKey } from "./api";
import { useAppStore } from "@/stores/appStore";

export function useEmotions() {
  const profile = useAppStore((s) => s.profile);

  return useQuery({
    queryKey: ["emotions", profile?.id],
    queryFn: () => fetchEmotions(profile!.id),
    enabled: !!profile?.id,
  });
}

export function useAddEmotion() {
  const queryClient = useQueryClient();
  const { profile, awardXP } = useAppStore();

  return useMutation({
    mutationFn: async ({
      emotion,
      mood,
      context,
    }: {
      emotion: EmotionKey;
      mood: number;
      context?: string;
    }) => {
      const result = await addEmotion(profile!.id, emotion, mood, context);
      await awardXP("emotion_log", "emotions");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emotions", profile?.id] });
    },
  });
}

export function useDebriefs(emotionId?: string) {
  return useQuery({
    queryKey: ["debriefs", emotionId],
    queryFn: () => fetchDebriefs(emotionId!),
    enabled: !!emotionId,
  });
}

export function useAddDebrief(emotionId?: string) {
  const queryClient = useQueryClient();
  const { awardXP } = useAppStore();

  return useMutation({
    mutationFn: async (debrief: string) => {
      const result = await addDebrief(emotionId!, debrief);
      await awardXP("emotion_debrief", "emotions");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debriefs", emotionId] });
    },
  });
}
