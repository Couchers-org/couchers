import { action } from '@storybook/addon-actions';
import { text } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react-native';
import React from 'react';
import { Text } from 'react-native';
import LargeButton from '../../../components/atoms/LargeButton';
import CenterView from '../CenterView';

storiesOf('LargeButton', module)
  .addDecorator((getStory) => <CenterView>{getStory()}</CenterView>)
  .add('Sign up button', () => (
    <LargeButton 
      onPress={action('clicked-signup')}
      title={'Sign Up'}
      theme={'primary'}
    >
    </LargeButton>
  ))
  .add('Log in button', () => (
    <LargeButton 
      onPress={action('clicked-login')}
      title={'Log in'}
      color={'#fff'}
    >
    </LargeButton>
  ))
  .add('with some emoji', () => (
    <LargeButton onPress={action('clicked-emoji2')}
      title={'😀 😎 👍'}
    >
    </LargeButton>
  ));
