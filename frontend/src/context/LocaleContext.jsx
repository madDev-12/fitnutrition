import React, { useState, createContext, useContext } from 'react';
import { IntlProvider } from 'react-intl';
import { messages } from '../translations';

const LocaleContext = createContext();

export const LocaleProvider = ({ children }) => {
  const [locale, setLocale] = useState(navigator.language.split(/[-_]/)[0] || 'ja');

  const changeLocale = (newLocale) => {
    setLocale(newLocale);
  };

  return (
    <LocaleContext.Provider value={{ locale, changeLocale }}>
      <IntlProvider locale={locale} messages={messages[locale]}>
        {children}
      </IntlProvider>
    </LocaleContext.Provider>
  );
};

export const useLocale = () => useContext(LocaleContext);
