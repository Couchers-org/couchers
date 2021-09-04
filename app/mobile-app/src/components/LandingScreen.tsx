import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import LandingImage from '../assets/landing-bg.png';
import { Dimensions } from 'react-native';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

export default function LandingScreen() {

    return (
        <View style={styles.container}>
            <Image style={styles.bgImage} source={LandingImage}/>
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgImage: {
      top: 0,
      left: 0,
      width: windowWidth,
      height: windowHeight
  }
});
