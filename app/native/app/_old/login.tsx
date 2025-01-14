// import { Button, Pressable, StyleSheet } from "react-native";

// import { ThemedText } from "@/components/ThemedText";
// import { ThemedView } from "@/components/ThemedView";
// import Alert from "components/Alert";
// import LoginForm from "features/auth/login/LoginForm";

// import { useAuthContext } from "features/auth/AuthProvider";

// import { Trans, useTranslation } from "i18n";
// import { AUTH, GLOBAL } from "i18n/namespaces";
// import BasicScreen from "@/components/BasicScreen";
// import { Link } from "expo-router";

// export default function Login() {
//   const { t } = useTranslation([AUTH, GLOBAL]);

//   const { authState } = useAuthContext();

//   return (
//     <BasicScreen>
//       <ThemedView style={styles.titleContainer}>
//         <ThemedText type="title">{t("auth:login_page.title")}</ThemedText>
//       </ThemedView>
//       <ThemedView style={styles.stepContainer}>
//         {authState.error && <Alert>{authState.error}</Alert>}
//         <LoginForm />
//         <ThemedText>
//           <Trans t={t} i18nKey="auth:login_page.no_account_prompt">
//             No account yet?
//           </Trans>
//           <Link href="/signup" asChild>
//             <Pressable>
//               <ThemedText type="button">Sign up</ThemedText>
//             </Pressable>
//           </Link>
//         </ThemedText>
//         <ThemedText>
//           <Trans t={t} i18nKey="auth:login_page.blah_blah">
//             By using Couchers.org you agree to our{" "}
//           </Trans>
//           <Link href="/terms" asChild>
//             <Pressable>
//               <ThemedText type="button">Terms of Service</ThemedText>
//             </Pressable>
//           </Link>
//         </ThemedText>
//       </ThemedView>
//     </BasicScreen>
//   );
// }

// const styles = StyleSheet.create({
//   titleContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//   },
//   stepContainer: {
//     gap: 8,
//     marginBottom: 8,
//   },
// });
