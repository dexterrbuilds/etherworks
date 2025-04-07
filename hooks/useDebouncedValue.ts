import { useState, useEffect } from 'react';

// Custom hook for debouncing values
export const useDebouncedValue = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up the timer that will update the debounced value
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if the value changes before the delay has passed
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Custom hook for handling infinite scrolling
export const useInfiniteScroll = (fetchMore, threshold = 0.8) => {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const handleScroll = ({ layoutMeasurement, contentOffset, contentSize }) => {
    const paddingToBottom = 20;
    const isCloseToBottom = 
      layoutMeasurement.height + contentOffset.y >= 
      contentSize.height - paddingToBottom;
    
    if (isCloseToBottom && !isLoadingMore) {
      setIsLoadingMore(true);
      fetchMore().finally(() => setIsLoadingMore(false));
    }
  };
  
  return {
    isLoadingMore,
    handleScroll
  };
};

// Custom hook for tracking status changes
export const useStatusTracking = (items, statusKey = 'status') => {
  const [statusCounts, setStatusCounts] = useState({});
  
  useEffect(() => {
    const counts = items.reduce((acc, item) => {
      const status = item[statusKey];
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    setStatusCounts(counts);
  }, [items, statusKey]);
  
  return statusCounts;
};

// Custom hook for form validation
export const useFormValidation = (initialState, validationRules) => {
  const [values, setValues] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);
  
  const validate = (fieldValues = values) => {
    let tempErrors = { ...errors };
    let valid = true;
    
    Object.keys(fieldValues).forEach(field => {
      if (validationRules[field]) {
        const { required, pattern, min, max, custom } = validationRules[field];
        
        // Check required
        if (required && !fieldValues[field]) {
          tempErrors[field] = 'This field is required';
          valid = false;
        }
        
        // Check pattern
        if (pattern && fieldValues[field] && !pattern.value.test(fieldValues[field])) {
          tempErrors[field] = pattern.message;
          valid = false;
        }
        
        // Check min length
        if (min && fieldValues[field] && fieldValues[field].length < min.value) {
          tempErrors[field] = min.message;
          valid = false;
        }
        
        // Check max length
        if (max && fieldValues[field] && fieldValues[field].length > max.value) {
          tempErrors[field] = max.message;
          valid = false;
        }
        
        // Custom validation
        if (custom && fieldValues[field] && !custom.isValid(fieldValues[field], fieldValues)) {
          tempErrors[field] = custom.message;
          valid = false;
        }
        
        // Clear error if validation passes
        if (tempErrors[field] && fieldValues[field] && 
          (!required || (required && fieldValues[field])) &&
          (!pattern || (pattern && pattern.value.test(fieldValues[field]))) &&
          (!min || (min && fieldValues[field].length >= min.value)) &&
          (!max || (max && fieldValues[field].length <= max.value)) &&
          (!custom || (custom && custom.isValid(fieldValues[field], fieldValues)))
        ) {
          delete tempErrors[field];
        }
      }
    });
    
    setErrors(tempErrors);
    setIsValid(valid);
    return valid;
  };
  
  const handleChange = (field, value) => {
    const fieldValues = { ...values, [field]: value };
    setValues(fieldValues);
    validate({ [field]: value });
  };
  
  const resetForm = () => {
    setValues(initialState);
    setErrors({});
    setIsValid(false);
  };
  
  return {
    values,
    errors,
    isValid,
    handleChange,
    resetForm,
    validate: () => validate(),
    setValues
  };
};