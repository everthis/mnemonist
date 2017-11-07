/**
 * Mnemonist DynamicArray
 * =======================
 *
 * Abstract implementation of a growing array that can be used with JavaScript
 * typed arrays and other array-like structures.
 *
 * Note: should try and use ArrayBuffer.transfer when it will be available.
 */


// TODO: maybe we should not accept out-of-bounds sets
// TODO: growTo increase capacity
// TODO: resize method

/**
 * Constants.
 */
var DEFAULT_GROWING_POLICY = function(currentSize) {
  return Math.ceil(currentSize * 1.5);
};

/**
 * DynamicArray.
 *
 * @constructor
 * @param {function}      ArrayClass             - An array constructor.
 * @param {number|object} initialCapacityOrOptions - Self-explanatory.
 */
function DynamicArray(ArrayClass, initialCapacityOrOptions) {
  if (arguments.length < 2)
    throw new Error('mnemonist/dynamic-array: expecting at least an array constructor and an initial size or options.');

  var initialCapacity = initialCapacityOrOptions || 0,
      policy = DEFAULT_GROWING_POLICY;

  if (typeof initialCapacityOrOptions === 'object') {
    initialCapacity = initialCapacityOrOptions.initialCapacity || 0;
    policy = initialCapacityOrOptions.policy || policy;
  }

  this.ArrayClass = ArrayClass;
  this.length = 0;
  this.capacity = initialCapacity;
  this.policy = policy;
  this.array = new ArrayClass(initialCapacity);
}

/**
 * Method used to set a value.
 *
 * @param  {number} index - Index to edit.
 * @param  {any}    value - Value.
 * @return {DynamicArray}
 */
DynamicArray.prototype.set = function(index, value) {

  // Do we need to grow the array?
  var capacity = this.capacity;

  if (index >= capacity) {
    while (index >= this.capacity) {
      this.capacity = this.policy(this.capacity);

      // Sanity check
      if (this.capacity <= capacity)
        throw new Error('mnemonist/dynamic-array.set: policy returned a less or equal length to allocate.');
    }

    // Transferring
    var oldArray = this.array;
    this.array = new this.ArrayClass(this.capacity);

    for (var i = 0, l = this.length; i < l; i++)
      this.array[i] = oldArray[i];
  }

  // Updating value
  this.array[index] = value;

  // Updating length
  index++;

  if (index > this.length)
    this.length = index;

  return this;
};

/**
 * Method used to get a value.
 *
 * @param  {number} index - Index to retrieve.
 * @return {any}
 */
DynamicArray.prototype.get = function(index) {
  if (this.length < index)
    return undefined;

  return this.array[index];
};

/**
 * Method used to grow the array.
 *
 * @return {DynamicArray}
 */
DynamicArray.prototype.grow = function() {
  var capacity = this.capacity;

  this.capacity = this.policy(capacity);

  // Sanity check
  if (this.capacity <= capacity)
    throw new Error('mnemonist/dynamic-array.grow: policy returned a less or equal length to allocate.');

  var oldArray = this.array;
  this.array = new this.ArrayClass(this.capacity);

  for (var i = 0, l = this.length; i < l; i++)
    this.array[i] = oldArray[i];

  return this;
};

/**
 * Method used to push a value into the array.
 *
 * @param  {any}    value - Value to push.
 * @return {number}       - Length of the array.
 */
DynamicArray.prototype.push = function(value) {
  if (this.length >= this.capacity)
    this.grow();

  this.array[this.length++] = value;

  return this.length;
};

/**
 * Method used to pop the last value of the array.
 *
 * @return {number} - The popped value.
 */
DynamicArray.prototype.pop = function() {
  if (!this.length)
    return;

  return this.array[--this.length];
};

/**
 * Convenience known methods.
 */
DynamicArray.prototype.inspect = function() {
  var proxy = this.array.slice(0, this.length);

  proxy.type = this.ArrayClass.name;

  // Trick so that node displays the name of the constructor
  Object.defineProperty(proxy, 'constructor', {
    value: DynamicArray,
    enumerable: false
  });

  return proxy;
};

/**
 * Exporting.
 */
function subClass(ArrayClass) {
  var SubClass = function(initialCapacityOrOptions) {
    DynamicArray.call(this, ArrayClass, initialCapacityOrOptions);
  };

  for (var k in DynamicArray.prototype) {
    if (DynamicArray.prototype.hasOwnProperty(k))
      SubClass.prototype[k] = DynamicArray.prototype[k];
  }

  return SubClass;
}

DynamicArray.DynamicInt8Array = subClass(Int8Array);
DynamicArray.DynamicUint8Array = subClass(Uint8Array);
DynamicArray.DynamicUint8ClampedArray = subClass(Uint8ClampedArray);
DynamicArray.DynamicInt16Array = subClass(Int16Array);
DynamicArray.DynamicUint16Array = subClass(Uint16Array);
DynamicArray.DynamicInt32Array = subClass(Int32Array);
DynamicArray.DynamicUint32Array = subClass(Uint32Array);
DynamicArray.DynamicFloat32Array = subClass(Float32Array);
DynamicArray.DynamicFloat64Array = subClass(Float64Array);

module.exports = DynamicArray;
