import { StyleSheet, ImageBackground, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";

import { Trans, useTranslation } from "i18n";
import { AUTH, GLOBAL } from "i18n/namespaces";
import { router } from "expo-router";
import Button from "@/components/Button";
import { loginRoute, signUpRoute } from "@/routes";

export default function Landing() {
  const { t } = useTranslation([AUTH, GLOBAL]);

  return (
    <ImageBackground
      source={require("../assets/images/couchers_bg.jpg")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={styles.textContainer}>
          <ThemedText style={styles.whiteText} type="title">
            <Trans t={t} i18nKey="auth:landing_screen.connect_with_world">
              Connect with the world around you
            </Trans>
          </ThemedText>
          <ThemedText style={styles.whiteText}>
            <Trans t={t} i18nKey="auth:landing_screen.build_collaboratively">
              Build collaboratively, and always free
            </Trans>
          </ThemedText>
        </View>
        <View style={styles.lineContainer}>
          <View style={styles.line} />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Sign up"
            filled={true}
            onPress={() => router.push(signUpRoute as any)}
          />
          <Button title="Log in" onPress={() => router.push(loginRoute as any)} />
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 30,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  lineContainer: {
    alignItems: "flex-start",
    marginTop: 10,
    marginBottom: 30,
  },
  line: {
    width: "50%",
    height: 3,
    backgroundColor: "#00A398",
  },
  textContainer: {
    alignItems: "flex-start",
  },
  whiteText: {
    color: "white",
    textAlign: "center",
  },
});
