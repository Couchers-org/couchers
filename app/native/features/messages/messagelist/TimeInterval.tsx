import TextBody from "@/components/TextBody";
import { useTranslation } from "@/i18n";
import { GLOBAL } from "@/i18n/namespaces";
import { timeAgoI18n } from "@/utils/timeAgo";
import { View } from "react-native";

export interface TimeIntervalProps {
  date: Date;
  className?: string;
}

export default function TimeInterval({ date }: TimeIntervalProps) {
  const { t } = useTranslation(GLOBAL);

  return (
    <View>
      <TextBody>
        {timeAgoI18n({ input: date, t })}
      </TextBody>
    </View>
  );
}
