import { Meta, Story } from "@storybook/react";
import { useState } from "react";

import HorizontalScroller from "./HorizontalScroller";

export default {
  title: "Components/Simple/HorizontalScroller",
  component: HorizontalScroller,
} as Meta;

const Template: Story<any> = (args) => {
  const [count, setCount] = useState(8);
  const [isFetching, setIsFetching] = useState(false);

  const fetchNext = () => {
    setIsFetching(true);
    setTimeout(() => {
      setCount(count + 3);
      setIsFetching(false);
    }, 1000);
  };

  return (
    <>
      <HorizontalScroller
        {...args}
        fetchNext={args.isInfinite ? fetchNext : undefined}
        isFetching={args.isInfinite ? isFetching : undefined}
      >
        {Array(count)
          .fill(0)
          .map((_, index) => (
            <div
              key={index}
              style={{
                margin: "1rem",
                width: 90,
                height: 140,
                backgroundColor: "pink",
              }}
            />
          ))}
      </HorizontalScroller>
    </>
  );
};

export const horizontalScroller = Template.bind({});
horizontalScroller.args = {
  isInfinite: true,
};
