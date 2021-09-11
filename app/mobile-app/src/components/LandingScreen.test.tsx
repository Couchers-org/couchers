import React from 'react';
import renderer from 'react-test-renderer';

import LandingScreen from './LandingScreen';

describe('<LandingScreen />', () => {
  it('has 1 child', () => {
    const tree: any = renderer.create(<LandingScreen />).toJSON()
    expect(tree?.children?.length).toBe(2)
  });
});