const conteguous = (arr = [], k=1) => {
  let max = 0;
  let subArrs = [];
  let result = arr.slice(0, k);
  for (let a = 0; a < arr.length - k; a++) {
    subArrs.push(arr.slice(a, k));
  }
  subArrs.forEach((ele) => {
    if (Math.sum(...ele) > max) {
      result = ele;
    }
    max = Math.sum(...ele);
  });
  return result;
};

conteguous([2, 1, 5, 1, 3, 2], 3);

integers and an integer k, and returns the maximum sum of any contiguous subarray of length k.



[2, 1, 5, 1, 3, 2],3



5+1+3 =9



// DEE88
// 14m ago
// Write a function that takes an array of integers and returns a list of all the unique triplets [a, b, c] in the array such that a + b + c = 0.



// [-1, 0, 1, 2, -1, -4]



// [ [-1, -1, 2], [-1, 0, 1] ]



// DEE88
// 8m ago
// How does the event loop work in Node.js, and why is it important for non-blocking I/O operations? Can you explain how the event loop manages different phases (timers, I/O callbacks, idle, prepare, poll, check, and close callbacks)?



// DEE88
// 5m ago
// What are some of the latest features in React or Angular that you have adopted in your recent projects, and how have they improved your development process?



// DEE88
// 2m ago
// How is dependency injection handled in Angular, and how does it compare to dependency management in React?



