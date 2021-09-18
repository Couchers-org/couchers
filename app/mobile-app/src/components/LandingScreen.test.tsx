import React from "react";
import renderer from "react-test-renderer";
import { render, fireEvent } from '@testing-library/react-native';

import LandingScreen from "./LandingScreen";

describe('Testing LandingScreen', () => {
  test('Screen contains Sign up button', async () => {
    const component = (
      <LandingScreen/>
    );
    const { findAllByText } = render(component);
    const children = await findAllByText('Sign up');
    expect(children.length).toBe(1);
  })
  test('Screen contains Log in button', async () => {
    const component = (
      <LandingScreen/>
    );
    const { findAllByText } = render(component);
    const children = await findAllByText('Log in');
    expect(children.length).toBe(1);
  })
})
