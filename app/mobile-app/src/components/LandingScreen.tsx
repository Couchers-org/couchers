import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import LandingImage from '../assets/landing-bg.png';
import { Dimensions } from 'react-native';
import LargeButton from './atoms/LargeButton';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

export default function LandingScreen() {

    return (
        <View style={styles.container}>
            <Image style={styles.bgImage} source={LandingImage}/>
            <View style={[styles.actionsView]}>
              <LargeButton
                title="Sign up"
                onPress={() => console.log("Signing up!")}
                theme={'primary'}
              />
              <View style={{height: 20}}></View>
              <LargeButton
                title="Log in"
                onPress={() => console.log("Loggin in!")}
                color={'white'}
              />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
    width: '100%',
    height: '100%'
  },
  bgImage: {
      top: 0,
      left: 0,
      width: windowWidth,
      height: windowHeight,
      position: 'absolute'
  },
  actionsView: {
    top: '71%',
    width: '80%',
    height: 'auto',
  } 
});
