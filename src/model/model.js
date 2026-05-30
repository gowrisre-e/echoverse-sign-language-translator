import * as tf from '@tensorflow/tfjs';
import { SEQUENCE_LENGTH, FEATURES_PER_FRAME } from '../utils/landmarkUtils';
import { NUM_CLASSES } from '../data/gestures';

/**
 * Create CNN + LSTM model for gesture recognition
 * Input: [batchSize, sequenceLength, features] = [batch, 30, 63]
 * Output: [batchSize, numClasses] = [batch, 39]
 */
export const createModel = () => {
  const model = tf.sequential();

  // Reshape for CNN: [batch, sequence, features] -> [batch, sequence, features, 1]
  model.add(tf.layers.reshape({
    targetShape: [SEQUENCE_LENGTH, FEATURES_PER_FRAME, 1],
    inputShape: [SEQUENCE_LENGTH, FEATURES_PER_FRAME]
  }));

  // CNN layers for spatial feature extraction
  model.add(tf.layers.conv2d({
    filters: 32,
    kernelSize: [3, 3],
    activation: 'relu',
    padding: 'same'
  }));
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));
  model.add(tf.layers.dropout({ rate: 0.25 }));

  model.add(tf.layers.conv2d({
    filters: 64,
    kernelSize: [3, 3],
    activation: 'relu',
    padding: 'same'
  }));
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));
  model.add(tf.layers.dropout({ rate: 0.25 }));

  model.add(tf.layers.conv2d({
    filters: 128,
    kernelSize: [3, 3],
    activation: 'relu',
    padding: 'same'
  }));
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.dropout({ rate: 0.25 }));

  // Reshape for LSTM: flatten spatial dimensions, keep time
  // After pooling: [batch, 7, 15, 128] -> [batch, 7, 15*128]
  model.add(tf.layers.reshape({
    targetShape: [-1, 128] // Will be computed dynamically
  }));

  // LSTM layers for temporal pattern recognition
  model.add(tf.layers.lstm({
    units: 128,
    returnSequences: true,
    dropout: 0.2,
    recurrentDropout: 0.2
  }));

  model.add(tf.layers.lstm({
    units: 64,
    returnSequences: false,
    dropout: 0.2,
    recurrentDropout: 0.2
  }));

  // Dense layers for classification
  model.add(tf.layers.dense({
    units: 128,
    activation: 'relu'
  }));
  model.add(tf.layers.dropout({ rate: 0.5 }));

  model.add(tf.layers.dense({
    units: NUM_CLASSES,
    activation: 'softmax'
  }));

  // Compile model
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });

  return model;
};

/**
 * Create a simpler model (fallback if CNN+LSTM is too slow)
 */
export const createSimpleModel = () => {
  const model = tf.sequential();

  // Flatten the sequence
  model.add(tf.layers.flatten({
    inputShape: [SEQUENCE_LENGTH, FEATURES_PER_FRAME]
  }));

  // Dense layers
  model.add(tf.layers.dense({
    units: 512,
    activation: 'relu'
  }));
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.dropout({ rate: 0.3 }));

  model.add(tf.layers.dense({
    units: 256,
    activation: 'relu'
  }));
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.dropout({ rate: 0.3 }));

  model.add(tf.layers.dense({
    units: 128,
    activation: 'relu'
  }));
  model.add(tf.layers.dropout({ rate: 0.3 }));

  model.add(tf.layers.dense({
    units: NUM_CLASSES,
    activation: 'softmax'
  }));

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });

  return model;
};

/**
 * Save model to IndexedDB
 */
export const saveModel = async (model) => {
  await model.save('indexeddb://echoverse-gesture-model');
  console.log('Model saved to IndexedDB');
};

/**
 * Load model from IndexedDB
 */
export const loadModel = async () => {
  try {
    const model = await tf.loadLayersModel('indexeddb://echoverse-gesture-model');
    console.log('Model loaded from IndexedDB');
    return model;
  } catch (error) {
    console.log('No saved model found in IndexedDB');
    return null;
  }
};

/**
 * Load pre-trained model from public folder
 * This model is trained on the ASL dataset using the Python scripts
 */
export const loadPretrainedModel = async () => {
  try {
    // Try to load the pre-trained model from the public folder
    const model = await tf.loadLayersModel('/model/model.json');
    console.log('Pre-trained model loaded from /model/model.json');
    return model;
  } catch (error) {
    console.log('No pre-trained model found in public folder');
    return null;
  }
};

/**
 * Check if pre-trained model exists
 */
export const hasPretrainedModel = async () => {
  try {
    const response = await fetch('/model/model.json', { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Delete model from IndexedDB
 */
export const deleteModel = async () => {
  try {
    await tf.io.removeModel('indexeddb://echoverse-gesture-model');
    console.log('Model deleted from IndexedDB');
  } catch (error) {
    console.log('No model to delete');
  }
};

export default { createModel, createSimpleModel, saveModel, loadModel, deleteModel };
