/**
 * Native JavaScript replacements for lodash functions
 * These helpers provide the same functionality as lodash without the dependency
 */

/**
 * Get a nested property from an object using a path string
 * @param {Object} obj - The object to query
 * @param {string} path - The path of the property to get (e.g., 'a.b.c' or 'a[0].b')
 * @param {*} defaultValue - The value returned if the resolved value is undefined
 * @returns {*} The resolved value
 */
function get(obj, path, defaultValue = undefined) {
  if (!obj || typeof path !== 'string') {
    return defaultValue;
  }
  
  // First try to get the path as a literal key (for keys with dots in them)
  if (obj.hasOwnProperty(path)) {
    return obj[path];
  }
  
  // Handle both dot notation and bracket notation
  const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result == null) {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result === undefined ? defaultValue : result;
}

/**
 * Create a new object with specified keys omitted
 * @param {Object} obj - The source object
 * @param {...string} keys - The keys to omit
 * @returns {Object} A new object without the omitted keys
 */
function omit(obj, ...keys) {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
}

/**
 * Deep merge objects
 * @param {Object} target - The target object
 * @param {...Object} sources - The source objects
 * @returns {Object} The merged object
 */
function merge(target, ...sources) {
  if (!sources.length) return target;
  
  const result = { ...target };
  
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const sourceValue = source[key];
        // Check if it's a plain object that should be merged recursively
        // Exclude Date, RegExp, and other special objects (like moment objects)
        const shouldMerge = sourceValue && 
          typeof sourceValue === 'object' && 
          !Array.isArray(sourceValue) &&
          !(sourceValue instanceof Date) &&
          !(sourceValue instanceof RegExp) &&
          sourceValue.constructor === Object;
        
        if (shouldMerge) {
          result[key] = merge(result[key] || {}, sourceValue);
        } else {
          result[key] = sourceValue;
        }
      }
    }
  }
  
  return result;
}

/**
 * Deep clone an object
 * @param {*} obj - The value to clone
 * @returns {*} The cloned value
 */
function cloneDeep(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (obj instanceof Array) {
    return obj.map(item => cloneDeep(item));
  }
  
  if (obj instanceof Object) {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = cloneDeep(obj[key]);
      }
    }
    return clonedObj;
  }
}

/**
 * Find an item in an array matching an object pattern
 * @param {Array} arr - The array to search
 * @param {Object|Function} predicate - Object pattern or function to match
 * @returns {*} The matched item or undefined
 */
function find(arr, predicate) {
  if (!arr || !Array.isArray(arr)) {
    return undefined;
  }
  
  if (typeof predicate === 'function') {
    return arr.find(predicate);
  }
  
  if (typeof predicate === 'object' && predicate !== null) {
    return arr.find(item => 
      Object.keys(predicate).every(key => item[key] === predicate[key])
    );
  }
  
  return undefined;
}

/**
 * Check if value is a plain object
 * @param {*} value - The value to check
 * @returns {boolean} True if value is a plain object
 */
function isPlainObject(value) {
  return value != null && typeof value === 'object' && value.constructor === Object;
}

module.exports = {
  get,
  omit,
  merge,
  cloneDeep,
  find,
  isPlainObject
};

