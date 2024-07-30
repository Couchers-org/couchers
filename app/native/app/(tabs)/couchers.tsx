import { Image, StyleSheet, Platform, Button, Alert } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useState } from 'react';
import { useMutation } from "react-query";
import { RpcError } from "grpc-web";
import { service } from "@/service";
import { StatusRes } from "@/proto/bugs_pb";


export default function CouchersScreen() {
  const [pressed, setPressed] = useState<number>(0);

  const { data: resp, mutate: checkCoucherCount, } = useMutation<StatusRes.AsObject, RpcError, void>(() => service.version.status());

  const onPress = () => {
    setPressed(pressed+1)
    // Alert.alert('Simple Button pressed')
    checkCoucherCount();
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/couchers512.png')}
          style={styles.couchersLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Couchers.org Stuff?!</ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <Button
          title="Press me"
          onPress={onPress}
        />
        <ThemedText type="subtitle">{ pressed == 0 ? "didn't press yet" : `pressed ${pressed} time(s)` }</ThemedText>
        <ThemedText type="subtitle">API response: version: {resp?.version}, # users: {resp?.coucherCount}</ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  couchersLogo: {
    height: 350,
    width: 500,
    top: 0,
    right: 0,
    position: 'absolute',
  },
});
