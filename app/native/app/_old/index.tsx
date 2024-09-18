// import { Pressable, StyleSheet } from "react-native";

// import { ThemedText } from "@/components/ThemedText";

// import { useAuthContext } from "features/auth/AuthProvider";

// import { useTranslation } from "i18n";
// import { AUTH, GLOBAL } from "i18n/namespaces";
// import BasicScreen from "@/components/BasicScreen";
// import { Link } from "expo-router";

// export default function CouchersScreen() {
//   const { t } = useTranslation([AUTH, GLOBAL]);

//   const { authState } = useAuthContext();

//   return (
//     <BasicScreen>
//       <ThemedText type="title">Couchers native app</ThemedText>
//       <ThemedText type="default">
//         This is like a stupidly early prototype native app.
//       </ThemedText>
//       {authState.authenticated ? (
//         <>
//           <ThemedText type="default">
//             It seems that you are{" "}
//             <ThemedText type="defaultSemiBold">logged in</ThemedText> with user
//             id{" "}
//             <ThemedText type="defaultSemiBold">{authState.userId}</ThemedText>!
//           </ThemedText>
//           <Link href="/logout" asChild>
//             <Pressable>
//               <ThemedText type="button">Log out</ThemedText>
//             </Pressable>
//           </Link>
//         </>
//       ) : (
//         <>
//           <ThemedText type="default">
//             It seems that you are{" "}
//             <ThemedText type="defaultSemiBold">not logged in</ThemedText>. Click
//             below to log in.
//           </ThemedText>
//           <Link href="/login" asChild>
//             <Pressable>
//               <ThemedText type="button">Log in</ThemedText>
//             </Pressable>
//           </Link>
//         </>
//       )}
//       <Link href="/everything" asChild>
//         <Pressable>
//           <ThemedText type="button">Debug page</ThemedText>
//         </Pressable>
//       </Link>
//       <Link href="/login2" asChild>
//         <Pressable>
//           <ThemedText type="button">Web embed stuff</ThemedText>
//         </Pressable>
//       </Link>
//       <Link href="/map" asChild>
//         <Pressable>
//           <ThemedText type="button">Map</ThemedText>
//         </Pressable>
//       </Link>
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
