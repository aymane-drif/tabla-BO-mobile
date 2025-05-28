"use client"
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { format } from 'date-fns';

interface SelectedDateContextType {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

const SelectedDateContext = createContext<SelectedDateContextType | undefined>(undefined);

export const SelectedDateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedDate, setSelectedDateState] = useState<string>(format(new Date(), "yyyy-MM-dd"));

  const setSelectedDate = (date: string) => {
    setSelectedDateState(date);
  };

  return (
    <SelectedDateContext.Provider value={{ selectedDate, setSelectedDate }}>
      {children}
    </SelectedDateContext.Provider>
  );
};

export const useSelectedDate = (): SelectedDateContextType => {
  const context = useContext(SelectedDateContext);
  if (context === undefined) {
    throw new Error('useSelectedDate must be used within a SelectedDateProvider');
  }
  return context;
};
