import * as tf from '@tensorflow/tfjs';
import { SEQUENCE_LENGTH, FEATURES_PER_FRAME } from '../utils/landmarkUtils';
import { LABEL_TO_INDEX, NUM_CLASSES } from '../data/gestures';

/**
 * Convert label to one-hot encoded tensor
 * @param {string} label - Gesture label
 * @returns {tf.Tensor} One-hot encoded tensor
 */
export const labelToOneHot = (label) => {
  const index = LABEL_TO_INDEX[label];
  if (index === undefined) {
    throw new Error(`Unknown label: ${label}`);
  }
  return tf.oneHot(index, NUM_CLASSES);
};

/**
 * Convert array of labels to one-hot encoded tensor
 * @param {string[]} labels - Array of gesture labels
 * @returns {tf.Tensor} Batch of one-hot encoded tensors
 */
export const labelsToOneHot = (labels) => {
  const indices = labels.map(label => {
    const index = LABEL_TO_INDEX[label];
    if (index === undefined) {
      throw new Error(`Unknown label: ${label}`);
    }
    return index;
  });
  return tf.oneHot(indices, NUM_CLASSES);
};

/**
 * Prepare training data from collected samples
 * @param {Object} data - Collected data { label: samples[] }
 * @returns {Object} { xs: tf.Tensor, ys: tf.Tensor }
 */
export const prepareTrainingData = (data) => {
  const sequences = [];
  const labels = [];

  for (const [label, samples] of Object.entries(data)) {
    for (const sample of samples) {
      if (sample.length === SEQUENCE_LENGTH) {
        sequences.push(sample);
        labels.push(label);
      }
    }
  }

  if (sequences.length === 0) {
    throw new Error('No valid training samples found');
  }

  // Shuffle data
  const indices = Array.from({ length: sequences.length }, (_, i) => i);
  tf.util.shuffle(indices);

  const shuffledSequences = indices.map(i => sequences[i]);
  const shuffledLabels = indices.map(i => labels[i]);

  // Convert to tensors
  const xs = tf.tensor3d(shuffledSequences);
  const ys = labelsToOneHot(shuffledLabels);

  return { xs, ys, count: sequences.length };
};

/**
 * Split data into training and validation sets
 * @param {tf.Tensor} xs - Input tensor
 * @param {tf.Tensor} ys - Label tensor
 * @param {number} validationSplit - Fraction for validation (0-1)
 * @returns {Object} { trainXs, trainYs, valXs, valYs }
 */
export const splitData = (xs, ys, validationSplit = 0.2) => {
  const numSamples = xs.shape[0];
  const numVal = Math.floor(numSamples * validationSplit);
  const numTrain = numSamples - numVal;

  const trainXs = xs.slice([0, 0, 0], [numTrain, -1, -1]);
  const trainYs = ys.slice([0, 0], [numTrain, -1]);
  const valXs = xs.slice([numTrain, 0, 0], [numVal, -1, -1]);
  const valYs = ys.slice([numTrain, 0], [numVal, -1]);

  return { trainXs, trainYs, valXs, valYs };
};

/**
 * Augment training data by adding noise
 * @param {number[][]} sequence - Original sequence
 * @param {number} noiseLevel - Standard deviation of noise
 * @returns {number[][]} Augmented sequence
 */
export const augmentSequence = (sequence, noiseLevel = 0.02) => {
  return sequence.map(frame =>
    frame.map(value => value + (Math.random() - 0.5) * 2 * noiseLevel)
  );
};

/**
 * Create augmented dataset
 * @param {Object} data - Original data
 * @param {number} augmentFactor - How many augmented copies per sample
 * @returns {Object} Augmented data
 */
export const augmentData = (data, augmentFactor = 2) => {
  const augmented = {};

  for (const [label, samples] of Object.entries(data)) {
    augmented[label] = [...samples];

    for (const sample of samples) {
      for (let i = 0; i < augmentFactor; i++) {
        augmented[label].push(augmentSequence(sample));
      }
    }
  }

  return augmented;
};

export default {
  labelToOneHot,
  labelsToOneHot,
  prepareTrainingData,
  splitData,
  augmentSequence,
  augmentData
};
