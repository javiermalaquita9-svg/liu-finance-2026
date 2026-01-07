import React from 'react';
import Select from 'react-select';

export function PredictiveSearch({ options, onChange, placeholder, value }) {
  return (
    <Select
      value={value}
      options={options}
      onChange={onChange}
      placeholder={placeholder}
      isClearable
      isSearchable
    />
  );
}