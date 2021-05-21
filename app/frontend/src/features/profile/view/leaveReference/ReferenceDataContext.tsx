import React, { createContext, ReactNode, useContext, useState } from "react";

export type ReferenceContextFormData = {
  text: string;
  wasAppropriate: string;
  rating: number;
};

interface ReferenceDataProviderProps {
  children: ReactNode;
}

type ReferenceContextType = {
  data: ReferenceContextFormData;
  setValues: (data: ReferenceContextFormData) => void;
};

const ReferenceDataContext = createContext<ReferenceContextType | undefined>(
  undefined
);

export const ReferenceDataProvider = ({
  children,
}: ReferenceDataProviderProps) => {
  const [data, setData] = useState({
    text: "",
    wasAppropriate: "",
    rating: 0,
  });

  const setValues = (values: ReferenceContextFormData) => {
    setData((prevData) => ({
      ...prevData,
      ...values,
    }));
  };

  return (
    <ReferenceDataContext.Provider value={{ data, setValues }}>
      {children}
    </ReferenceDataContext.Provider>
  );
};

export const useReferenceData = () => useContext(ReferenceDataContext);
